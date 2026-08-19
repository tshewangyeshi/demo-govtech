"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createWaitTimeRepository } from "@/lib/wait-time/repository";
import { isRateLimited, recordSubmission } from "@/lib/wait-time/rate-limit";
import { createClient } from "@/lib/supabase/server";

const DEVICE_COOKIE = "jdwnrh-device";

async function getOrCreateDeviceToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEVICE_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  cookieStore.set(DEVICE_COOKIE, token, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
  return token;
}

export interface SubmitReportResult {
  ok: boolean;
  rateLimited: boolean;
}

export async function submitWaitReport(
  departmentId: string,
  waitMinutes: number
): Promise<SubmitReportResult> {
  // Untrusted input -- validate before touching the repository.
  if (!departmentId || typeof waitMinutes !== "number") {
    return { ok: false, rateLimited: false };
  }
  const clamped = Math.max(0, Math.min(1440, Math.round(waitMinutes)));

  const deviceToken = await getOrCreateDeviceToken();

  if (isRateLimited(deviceToken)) {
    // Explicit rejection, never a silent drop (design review Pass 7B).
    return { ok: false, rateLimited: true };
  }

  // Tie the submission to the account when logged in -- a trust signal
  // for future weighting (design review Pass 6). Anonymous stays fully
  // supported; the rate limit applies uniformly either way.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const repository = await createWaitTimeRepository();
  await repository.submitReport(departmentId, clamped, user?.id ?? null);
  recordSubmission(deviceToken);
  revalidatePath("/wait-times");

  return { ok: true, rateLimited: false };
}
