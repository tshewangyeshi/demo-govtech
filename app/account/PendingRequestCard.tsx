"use client";

import { useTransition } from "react";
import { respondToLinkRequest } from "./actions";

interface Props {
  linkId: string;
  name: string;
  status: "pending" | "provisional" | "approved" | "revoked";
}

export function PendingRequestCard({ linkId, name, status }: Props) {
  const [isPending, startTransition] = useTransition();

  if (status === "approved") {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
        <p className="font-medium text-neutral-900">{name}</p>
        <p className="text-xs text-emerald-700">Approved as your caregiver</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-sm font-medium text-neutral-900">{name} wants to be your caregiver</p>
      {status === "provisional" && (
        <p className="mt-1 text-xs text-amber-700">
          They already have provisional access since you haven&apos;t responded yet. Approve or
          revoke below.
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await respondToLinkRequest(linkId, "approved");
            })
          }
          className="min-h-[44px] rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await respondToLinkRequest(linkId, "revoked");
            })
          }
          className="min-h-[44px] rounded-md border border-neutral-300 px-3 text-xs font-medium text-neutral-700 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
