// Wait-time estimate logic. Freshness and confidence are deliberately
// separate signals (docs/designs/jdwnrh-hospital-booking.md, Pass 2A) --
// a report can be recent but low-confidence (few reports), or old but
// technically "fresh" by clock time alone. Never conflate the two.

export interface WaitReport {
  waitMinutes: number;
  createdAt: Date;
}

export interface WaitEstimate {
  estimatedMinutes: number | null;
  reportCount: number;
  confidence: "low" | "medium" | "high";
  mostRecentReportAt: Date | null;
  isStale: boolean;
}

// Reports older than this are excluded entirely -- a report from 6+ hours
// ago is noise, not signal (design doc constraint).
const MAX_REPORT_AGE_HOURS = 6;

// Reports older than this are still included but down-weighted, and the
// estimate is flagged stale in the UI.
const STALE_AFTER_HOURS = 2;

// Half-life for exponential decay weighting within the valid window.
const DECAY_HALF_LIFE_HOURS = 1.5;

function ageInHours(createdAt: Date, now: Date): number {
  return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
}

function decayWeight(ageHours: number): number {
  return Math.pow(0.5, ageHours / DECAY_HALF_LIFE_HOURS);
}

export function computeWaitEstimate(
  reports: WaitReport[],
  now: Date = new Date()
): WaitEstimate {
  const valid = reports.filter((r) => ageInHours(r.createdAt, now) <= MAX_REPORT_AGE_HOURS);

  if (valid.length === 0) {
    return {
      estimatedMinutes: null,
      reportCount: 0,
      confidence: "low",
      mostRecentReportAt: null,
      isStale: false,
    };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let mostRecent = valid[0].createdAt;

  for (const report of valid) {
    const age = ageInHours(report.createdAt, now);
    const weight = decayWeight(age);
    weightedSum += report.waitMinutes * weight;
    totalWeight += weight;
    if (report.createdAt > mostRecent) mostRecent = report.createdAt;
  }

  const estimatedMinutes = Math.round(weightedSum / totalWeight);

  // Confidence is about sample size, independent of how fresh the most
  // recent report is -- a single 2-minute-old report is still low
  // confidence, per the design review's explicit distinction.
  const confidence: WaitEstimate["confidence"] =
    valid.length >= 4 ? "high" : valid.length >= 2 ? "medium" : "low";

  const isStale = ageInHours(mostRecent, now) > STALE_AFTER_HOURS;

  return {
    estimatedMinutes,
    reportCount: valid.length,
    confidence,
    mostRecentReportAt: mostRecent,
    isStale,
  };
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `~${minutes}m`;
  if (minutes === 0) return `~${hours}h`;
  return `~${hours}h ${minutes}m`;
}

export function formatFreshness(mostRecentReportAt: Date, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - mostRecentReportAt.getTime()) / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}
