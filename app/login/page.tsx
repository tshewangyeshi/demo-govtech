"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "./actions";

type Step = "phone" | "otp" | "name";

const COUNTRY_PREFIX = "+975";

function toE164(localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "");
  return `${COUNTRY_PREFIX}${digits}`;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [localPhone, setLocalPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = toE164(localPhone);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        setError(error.message);
        return;
      }
      setStep("otp");
    });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = toE164(localPhone);

    startTransition(async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otpCode,
        type: "sms",
      });
      if (error || !data.session) {
        setError(error?.message ?? "Verification failed. Try again.");
        return;
      }
      // New account vs. returning user: try to finish with an empty
      // display name first: ensureProfile is a no-op if a profile
      // already exists, and only prompts for a name on true first login.
      const result = await ensureProfile("");
      if (result.ok) {
        router.push("/wait-times");
      } else {
        setStep("name");
      }
    });
  }

  function handleSetName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await ensureProfile(displayName);
      if (result.ok) {
        router.push("/wait-times");
      } else {
        setError(result.error ?? "Could not save your profile. Try again.");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-lg font-bold text-neutral-900">Sign in</h1>
      <p className="mb-6 text-sm text-neutral-500">
        For patients and caregivers linking a family member&apos;s account.
      </p>

      {step === "phone" && (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-3">
          <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <span className="min-h-[44px] flex items-center rounded-md border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">
              {COUNTRY_PREFIX}
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              required
              autoFocus
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              placeholder="17632226"
              className="min-h-[44px] flex-1 rounded-md border border-neutral-300 px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
          <label htmlFor="otp" className="text-sm font-medium text-neutral-700">
            Enter the 6-digit code sent to {COUNTRY_PREFIX} {localPhone}
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="123456"
            className="min-h-[44px] rounded-md border border-neutral-300 px-3 text-lg tracking-widest"
          />
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="min-h-[44px] text-xs font-medium text-neutral-500 underline underline-offset-2"
          >
            Use a different number
          </button>
        </form>
      )}

      {step === "name" && (
        <form onSubmit={handleSetName} className="flex flex-col gap-3">
          <label htmlFor="name" className="text-sm font-medium text-neutral-700">
            What should we call you?
          </label>
          <input
            id="name"
            type="text"
            required
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="min-h-[44px] rounded-md border border-neutral-300 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Continue"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </main>
  );
}
