"use server";

import { createClient } from "@/lib/supabase/server";

export interface EnsureProfileResult {
  ok: boolean;
  error?: string;
}

// Called right after a successful OTP verification (client-side) to make
// sure a profiles row exists. Uses the server client so it runs with the
// caller's own session (RLS "insert own profile" policy applies) --
// never a service-role bypass.
export async function ensureProfile(displayName: string): Promise<EnsureProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    phone: user.phone,
    display_name: displayName.trim() || null,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
