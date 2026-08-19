"use client";

import { useState, useTransition } from "react";
import { requestCaregiverLink } from "./actions";

export function LinkRequestForm() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-300 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await requestCaregiverLink(phone);
          if (result.ok) {
            setMessage({ type: "ok", text: "Request sent. The patient needs to approve it." });
            setPhone("");
          } else {
            setMessage({ type: "error", text: result.error ?? "Something went wrong." });
          }
        });
      }}
    >
      <label htmlFor="patient-phone" className="text-xs font-medium text-neutral-700">
        Link to a patient by phone number
      </label>
      <div className="flex items-center gap-2">
        <span className="min-h-[44px] flex items-center rounded-md border border-neutral-300 bg-neutral-50 px-2 text-xs text-neutral-600">
          +975
        </span>
        <input
          id="patient-phone"
          type="tel"
          inputMode="numeric"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="17632226"
          className="min-h-[44px] flex-1 rounded-md border border-neutral-300 px-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send request"}
        </button>
      </div>
      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`text-xs ${message.type === "error" ? "text-red-700" : "text-emerald-700"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
