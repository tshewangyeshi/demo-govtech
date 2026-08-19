import { describe, it, expect } from "vitest";
import { isRateLimited, recordSubmission } from "../rate-limit";

describe("rate-limit", () => {
  it("allows a first submission from a device with no history", () => {
    expect(isRateLimited("device-a")).toBe(false);
  });

  it("blocks a second submission from the same device within the interval", () => {
    const now = Date.now();
    recordSubmission("device-b", now);
    expect(isRateLimited("device-b", now + 1000)).toBe(true);
  });

  it("allows a submission from a different device even if another device is limited", () => {
    const now = Date.now();
    recordSubmission("device-c", now);
    expect(isRateLimited("device-d", now + 1000)).toBe(false);
  });

  it("allows a submission again once the interval has fully elapsed", () => {
    const now = Date.now();
    recordSubmission("device-e", now);
    expect(isRateLimited("device-e", now + 5 * 60 * 1000 + 1)).toBe(false);
  });

  it("allows a submission exactly at the interval boundary (fully elapsed, inclusive)", () => {
    const now = Date.now();
    recordSubmission("device-f", now);
    expect(isRateLimited("device-f", now + 5 * 60 * 1000)).toBe(false);
  });

  it("still blocks one millisecond before the interval elapses", () => {
    const now = Date.now();
    recordSubmission("device-g", now);
    expect(isRateLimited("device-g", now + 5 * 60 * 1000 - 1)).toBe(true);
  });
});
