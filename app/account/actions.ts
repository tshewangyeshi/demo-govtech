"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface RequestLinkResult {
  ok: boolean;
  error?: string;
}

export async function requestCaregiverLink(patientLocalPhone: string): Promise<RequestLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const phone = `+975${patientLocalPhone.replace(/\D/g, "")}`;

  if (phone === user.phone) {
    return { ok: false, error: "You can't link to your own account." };
  }

  const { data: patientId, error: lookupError } = await supabase.rpc("find_patient_id_by_phone", {
    p_phone: phone,
  });

  if (lookupError) return { ok: false, error: lookupError.message };
  if (!patientId) {
    return { ok: false, error: "No account found with that phone number. They need to sign in at least once first." };
  }

  const { error: insertError } = await supabase.from("caregiver_links").insert({
    caregiver_id: user.id,
    patient_id: patientId,
  });

  if (insertError) {
    // Unique constraint violation -- a link already exists.
    if (insertError.code === "23505") {
      return { ok: false, error: "You've already sent a request to this person." };
    }
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/account");
  return { ok: true };
}

export async function respondToLinkRequest(
  linkId: string,
  decision: "approved" | "revoked"
): Promise<RequestLinkResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("caregiver_links")
    .update({ status: decision, responded_at: new Date().toISOString() })
    // RLS also enforces patient_id = auth.uid(), this is defense in depth,
    // not the actual security boundary.
    .eq("id", linkId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/account");
  return { ok: true };
}
