// Simple per-device rate limit for anonymous wait-time report submission
// (docs/designs/jdwnrh-hospital-booking.md, data-integrity requirement).
// In-memory for the mock/dev repository; a real deployment would back
// this with a Supabase table or Redis, keyed the same way (deviceToken).

const MIN_INTERVAL_MS = 5 * 60 * 1000; // one submission per 5 minutes per device

const lastSubmission = new Map<string, number>();

export function isRateLimited(deviceToken: string, now: number = Date.now()): boolean {
  const last = lastSubmission.get(deviceToken);
  return last !== undefined && now - last < MIN_INTERVAL_MS;
}

export function recordSubmission(deviceToken: string, now: number = Date.now()): void {
  lastSubmission.set(deviceToken, now);
}
