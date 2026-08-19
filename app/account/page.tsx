import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { effectiveStatus } from "@/lib/caregiver/grace-linking";
import { LinkRequestForm } from "./LinkRequestForm";
import { PendingRequestCard } from "./PendingRequestCard";

interface CaregiverLinkRow {
  id: string;
  status: "pending" | "approved" | "revoked";
  grace_expires_at: string;
  caregiver_id: string;
  patient_id: string;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: asPatient } = await supabase
    .from("caregiver_links")
    .select("id, status, grace_expires_at, caregiver_id, patient_id")
    .eq("patient_id", user.id)
    .neq("status", "revoked")
    .order("requested_at", { ascending: false });

  const { data: asCaregiver } = await supabase
    .from("caregiver_links")
    .select("id, status, grace_expires_at, caregiver_id, patient_id")
    .eq("caregiver_id", user.id)
    .neq("status", "revoked")
    .order("requested_at", { ascending: false });

  const patientLinks = (asPatient ?? []) as CaregiverLinkRow[];
  const caregiverLinks = (asCaregiver ?? []) as CaregiverLinkRow[];

  // Resolve display names for the caregiver-side view (only works for
  // approved/provisional links -- see get_linked_patient_name's scope).
  const caregiverLinksWithNames = await Promise.all(
    caregiverLinks.map(async (link) => {
      const status = effectiveStatus(
        { status: link.status, graceExpiresAt: new Date(link.grace_expires_at) }
      );
      let patientName: string | null = null;
      if (status !== "pending") {
        const { data } = await supabase.rpc("get_linked_patient_name", {
          p_patient_id: link.patient_id,
        });
        patientName = data;
      }
      return { ...link, effectiveStatus: status, patientName };
    })
  );

  const patientLinksWithNames = await Promise.all(
    patientLinks.map(async (link) => {
      const { data: caregiverName } = await supabase.rpc("get_requesting_caregiver_name", {
        p_caregiver_id: link.caregiver_id,
      });
      return {
        ...link,
        effectiveStatus: effectiveStatus({
          status: link.status,
          graceExpiresAt: new Date(link.grace_expires_at),
        }),
        caregiverName,
      };
    })
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">
          {profile?.display_name || "My account"}
        </h1>
        <p className="text-sm text-neutral-500">
          {profile?.phone ? `+${profile.phone.replace(/^\+/, "")}` : ""}
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Caregiver requests for you
        </h2>
        {patientLinksWithNames.length === 0 ? (
          <p className="text-sm text-neutral-500">No one has requested to be your caregiver.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {patientLinksWithNames.map((link) => (
              <li key={link.id}>
                <PendingRequestCard
                  linkId={link.id}
                  name={link.caregiverName ?? "Someone"}
                  status={link.effectiveStatus}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Patients you&apos;re linked to
        </h2>
        {caregiverLinksWithNames.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">
            You haven&apos;t linked to any patient accounts yet.
          </p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {caregiverLinksWithNames.map((link) => (
              <li
                key={link.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
              >
                <p className="font-medium text-neutral-900">
                  {link.patientName ?? "Pending approval"}
                </p>
                <p className="text-xs text-neutral-500">
                  {link.effectiveStatus === "provisional"
                    ? "Provisional access — the patient hasn't responded yet"
                    : link.effectiveStatus === "approved"
                      ? "Approved"
                      : "Waiting for the patient to approve"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <LinkRequestForm />
      </section>
    </main>
  );
}
