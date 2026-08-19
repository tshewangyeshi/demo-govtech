import { describe, it, expect } from "vitest";
import { effectiveStatus, canCaregiverAct, type CaregiverLinkRow } from "../grace-linking";

const NOW = new Date("2026-08-19T12:00:00Z");

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000);
}

describe("effectiveStatus", () => {
  it("returns 'pending' when within the grace window", () => {
    const link: CaregiverLinkRow = { status: "pending", graceExpiresAt: hoursFromNow(12) };
    expect(effectiveStatus(link, NOW)).toBe("pending");
  });

  it("returns 'provisional' once the grace window has passed with no response", () => {
    const link: CaregiverLinkRow = { status: "pending", graceExpiresAt: hoursFromNow(-1) };
    expect(effectiveStatus(link, NOW)).toBe("provisional");
  });

  it("returns 'provisional' exactly at the grace expiry boundary", () => {
    const link: CaregiverLinkRow = { status: "pending", graceExpiresAt: NOW };
    expect(effectiveStatus(link, NOW)).toBe("provisional");
  });

  it("never derives 'provisional' from an 'approved' link, even past the grace window", () => {
    const link: CaregiverLinkRow = { status: "approved", graceExpiresAt: hoursFromNow(-100) };
    expect(effectiveStatus(link, NOW)).toBe("approved");
  });

  it("never derives 'provisional' from a 'revoked' link", () => {
    const link: CaregiverLinkRow = { status: "revoked", graceExpiresAt: hoursFromNow(-100) };
    expect(effectiveStatus(link, NOW)).toBe("revoked");
  });
});

describe("canCaregiverAct", () => {
  it("is false while pending and within the grace window", () => {
    const link: CaregiverLinkRow = { status: "pending", graceExpiresAt: hoursFromNow(1) };
    expect(canCaregiverAct(link, NOW)).toBe(false);
  });

  it("is true once provisional (grace window passed)", () => {
    const link: CaregiverLinkRow = { status: "pending", graceExpiresAt: hoursFromNow(-1) };
    expect(canCaregiverAct(link, NOW)).toBe(true);
  });

  it("is true when explicitly approved", () => {
    const link: CaregiverLinkRow = { status: "approved", graceExpiresAt: hoursFromNow(-1) };
    expect(canCaregiverAct(link, NOW)).toBe(true);
  });

  it("is false when revoked, even if it would otherwise be in the grace window", () => {
    const link: CaregiverLinkRow = { status: "revoked", graceExpiresAt: hoursFromNow(1) };
    expect(canCaregiverAct(link, NOW)).toBe(false);
  });
});
