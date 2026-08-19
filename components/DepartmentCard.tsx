import { computeWaitEstimate, formatMinutes, formatFreshness } from "@/lib/wait-time/estimate";
import type { DepartmentWithReports } from "@/lib/wait-time/repository";
import { ReportButton } from "./ReportButton";

const CONFIDENCE_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "1 report — uncertain",
  medium: "based on a few recent reports",
  high: "based on several recent reports",
};

export function DepartmentCard({ department }: { department: DepartmentWithReports }) {
  const estimate = computeWaitEstimate(department.reports);

  if (estimate.reportCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-center">
        <p className="text-sm font-semibold text-neutral-900">{department.name}</p>
        <p className="mt-1 text-sm text-neutral-500">
          No recent reports for {department.name}.
        </p>
        <ReportButton departmentId={department.id} departmentName={department.name} variant="empty-state" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-900">{department.name}</p>
        <p
          className={`text-xl font-bold ${estimate.confidence === "low" ? "text-neutral-500" : "text-neutral-900"}`}
        >
          {formatMinutes(estimate.estimatedMinutes!)}
        </p>
      </div>

      {/* Confidence and freshness are separate signals, shown separately
          (design review Pass 2A) -- never conflate "how old" with "how
          trustworthy". */}
      <p className="mt-1 text-xs text-neutral-600">{CONFIDENCE_LABEL[estimate.confidence]}</p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {/* Status never relies on color alone -- text label carries the
            meaning too (accessibility spec, Pass 6A). */}
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 rounded-full ${estimate.isStale ? "bg-neutral-300" : "bg-emerald-600"}`}
        />
        <span className={estimate.isStale ? "text-neutral-400" : "text-neutral-500"}>
          {formatFreshness(estimate.mostRecentReportAt!)}
          {estimate.isStale && " — may be outdated"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <ReportButton departmentId={department.id} departmentName={department.name} variant="inline" />
        {department.phoneNumber && (
          <a
            href={`tel:${department.phoneNumber}`}
            className="min-h-[44px] flex items-center text-xs font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            Call {department.name}
          </a>
        )}
      </div>
    </div>
  );
}
