// Caregiver-link grace linking (docs/designs/jdwnrh-hospital-booking.md,
// Pass 3A -- the critical fix for patients who cannot self-approve).
//
// The 'provisional' transition is computed here, not written to the DB by
// either party. If it were a client-side UPDATE, a caregiver could flip
// their own pending request to "approved" by racing the grace window --
// the RLS policy only lets the *patient* update the row, so nothing else
// can legally perform that write. Deriving the effective status from
// grace_expires_at keeps the security model simple: the only real writes
// are "patient approves" and "patient revokes."

export type CaregiverLinkStatus = "pending" | "provisional" | "approved" | "revoked";

export interface CaregiverLinkRow {
  status: "pending" | "approved" | "revoked"; // DB-stored states only
  graceExpiresAt: Date;
}

export function effectiveStatus(link: CaregiverLinkRow, now: Date = new Date()): CaregiverLinkStatus {
  if (link.status === "pending" && now >= link.graceExpiresAt) {
    return "provisional";
  }
  return link.status;
}

export function canCaregiverAct(link: CaregiverLinkRow, now: Date = new Date()): boolean {
  const status = effectiveStatus(link, now);
  return status === "approved" || status === "provisional";
}
