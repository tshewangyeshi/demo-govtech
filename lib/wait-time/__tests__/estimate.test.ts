import { describe, it, expect } from "vitest";
import { computeWaitEstimate, formatMinutes, formatFreshness, type WaitReport } from "../estimate";

const NOW = new Date("2026-08-19T12:00:00Z");

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60 * 1000);
}

describe("computeWaitEstimate", () => {
  it("returns null/empty state when there are zero reports", () => {
    const result = computeWaitEstimate([], NOW);
    expect(result.estimatedMinutes).toBeNull();
    expect(result.reportCount).toBe(0);
    expect(result.confidence).toBe("low");
    expect(result.mostRecentReportAt).toBeNull();
    expect(result.isStale).toBe(false);
  });

  it("excludes reports older than the max age window (6h) entirely", () => {
    const reports: WaitReport[] = [
      { waitMinutes: 30, createdAt: minutesAgo(7 * 60) }, // 7h old, excluded
    ];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.reportCount).toBe(0);
    expect(result.estimatedMinutes).toBeNull();
  });

  it("computes a weighted estimate from a single fresh report (low confidence)", () => {
    const reports: WaitReport[] = [{ waitMinutes: 45, createdAt: minutesAgo(5) }];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.estimatedMinutes).toBe(45);
    expect(result.reportCount).toBe(1);
    expect(result.confidence).toBe("low");
    expect(result.isStale).toBe(false);
  });

  it("reaches medium confidence at 2-3 reports", () => {
    const reports: WaitReport[] = [
      { waitMinutes: 30, createdAt: minutesAgo(5) },
      { waitMinutes: 40, createdAt: minutesAgo(10) },
    ];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.confidence).toBe("medium");
  });

  it("reaches high confidence at 4+ reports", () => {
    const reports: WaitReport[] = [
      { waitMinutes: 30, createdAt: minutesAgo(5) },
      { waitMinutes: 35, createdAt: minutesAgo(10) },
      { waitMinutes: 40, createdAt: minutesAgo(15) },
      { waitMinutes: 45, createdAt: minutesAgo(20) },
    ];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.confidence).toBe("high");
  });

  it("weights recent reports more heavily than older ones (decay)", () => {
    const reports: WaitReport[] = [
      { waitMinutes: 10, createdAt: minutesAgo(1) }, // very recent, low wait
      { waitMinutes: 200, createdAt: minutesAgo(5 * 60) }, // 5h old, high wait
    ];
    const result = computeWaitEstimate(reports, NOW);
    // The recent report should dominate -- estimate should be much closer
    // to 10 than to the midpoint (105) or the old report (200).
    expect(result.estimatedMinutes).toBeLessThan(60);
  });

  it("flags isStale true when the most recent report is older than 2h", () => {
    const reports: WaitReport[] = [{ waitMinutes: 30, createdAt: minutesAgo(3 * 60) }];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.isStale).toBe(true);
  });

  it("flags isStale false when the most recent report is within 2h", () => {
    const reports: WaitReport[] = [{ waitMinutes: 30, createdAt: minutesAgo(90) }];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.isStale).toBe(false);
  });

  it("uses the most recent report's timestamp for mostRecentReportAt, not array order", () => {
    const older = minutesAgo(60);
    const newer = minutesAgo(5);
    const reports: WaitReport[] = [
      { waitMinutes: 30, createdAt: older },
      { waitMinutes: 40, createdAt: newer },
    ];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.mostRecentReportAt).toEqual(newer);
  });

  it("handles a report at exactly the max-age boundary (6h) as excluded", () => {
    const reports: WaitReport[] = [{ waitMinutes: 30, createdAt: minutesAgo(6 * 60 + 1) }];
    const result = computeWaitEstimate(reports, NOW);
    expect(result.reportCount).toBe(0);
  });
});

describe("formatMinutes", () => {
  it("formats minutes only when under an hour", () => {
    expect(formatMinutes(45)).toBe("~45m");
  });

  it("formats whole hours with no remainder", () => {
    expect(formatMinutes(120)).toBe("~2h");
  });

  it("formats hours and minutes together", () => {
    expect(formatMinutes(135)).toBe("~2h 15m");
  });

  it("handles zero minutes", () => {
    expect(formatMinutes(0)).toBe("~0m");
  });
});

describe("formatFreshness", () => {
  it("says 'just now' for reports under a minute old", () => {
    expect(formatFreshness(minutesAgo(0), NOW)).toBe("just now");
  });

  it("formats minutes for reports under an hour old", () => {
    expect(formatFreshness(minutesAgo(6), NOW)).toBe("6 min ago");
  });

  it("formats hours for reports an hour or older", () => {
    expect(formatFreshness(minutesAgo(3 * 60), NOW)).toBe("3 hr ago");
  });
});
