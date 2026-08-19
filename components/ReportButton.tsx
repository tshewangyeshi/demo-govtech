"use client";

import { useState, useTransition } from "react";
import { submitWaitReport } from "@/app/wait-times/actions";

interface Props {
  departmentId: string;
  departmentName: string;
  variant: "inline" | "empty-state";
}

type FormState = "closed" | "open" | "submitting" | "success" | "rate-limited" | "error";

export function ReportButton({ departmentId, departmentName, variant }: Props) {
  const [state, setState] = useState<FormState>("closed");
  const [minutes, setMinutes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (state === "success") {
    return (
      <p className="min-h-[44px] flex items-center text-xs font-medium text-emerald-700" role="status">
        Thanks — your report was received.
      </p>
    );
  }

  if (state === "rate-limited") {
    return (
      <p className="min-h-[44px] flex items-center text-xs font-medium text-neutral-600" role="status">
        You&apos;ve already reported recently — thanks!
      </p>
    );
  }

  if (state === "open" || state === "submitting" || state === "error") {
    return (
      <form
        className="flex flex-1 items-center gap-2"
        aria-label={`Report your wait for ${departmentName}`}
        onSubmit={(e) => {
          e.preventDefault();
          const value = Number(minutes);
          if (!Number.isFinite(value) || value < 0) return;
          setState("submitting");
          startTransition(async () => {
            const result = await submitWaitReport(departmentId, value);
            if (result.rateLimited) setState("rate-limited");
            else if (result.ok) setState("success");
            else setState("error");
          });
        }}
      >
        <label htmlFor={`wait-${departmentId}`} className="sr-only">
          Minutes you&apos;ve waited at {departmentName}
        </label>
        <input
          id={`wait-${departmentId}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={1440}
          required
          autoFocus
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="Minutes waited"
          className="min-h-[44px] w-28 rounded-md border border-neutral-300 px-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Submit"}
        </button>
        {state === "error" && (
          <span role="alert" className="text-xs text-red-700">
            Something went wrong — try again.
          </span>
        )}
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState("open")}
      className={
        variant === "empty-state"
          ? "mt-2 min-h-[44px] rounded-md border border-neutral-400 px-3 text-xs font-medium underline underline-offset-2"
          : "min-h-[44px] rounded-md border border-neutral-300 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
      }
    >
      + Report your wait
    </button>
  );
}
