export type Locale = "en" | "dz";

export const DEFAULT_LOCALE: Locale = "en";

// Dzongkha strings are placeholders pending professional translation
// (blocking dependency noted in docs/designs/jdwnrh-hospital-booking.md).
// Falling back to English is intentional until real translations land.
export const translations = {
  en: {
    appName: "JDWNRH Wait Times",
    intro: "Reported by people currently at the hospital. Not official hospital data.",
    reportYourWait: "Report your wait",
    based_on_reports_one: "based on 1 report",
    based_on_reports_other: "based on {count} recent reports",
    updatedMinutesAgo: "updated {minutes} min ago",
    updatedHoursAgo: "updated {hours} hr ago — may be outdated",
    lowConfidence: "uncertain",
    noRecentReports: "No recent reports for {department}.",
    beFirstToReport: "Be the first to report your wait.",
    callDepartment: "Call {department}",
    rateLimited: "You've already reported recently — thanks!",
    reportSubmitted: "Thanks — your report was received.",
  },
  dz: {
    // Placeholder pending translator (docs/designs/jdwnrh-hospital-booking.md)
    appName: "JDWNRH Wait Times",
    intro: "Reported by people currently at the hospital. Not official hospital data.",
    reportYourWait: "Report your wait",
    based_on_reports_one: "based on 1 report",
    based_on_reports_other: "based on {count} recent reports",
    updatedMinutesAgo: "updated {minutes} min ago",
    updatedHoursAgo: "updated {hours} hr ago — may be outdated",
    lowConfidence: "uncertain",
    noRecentReports: "No recent reports for {department}.",
    beFirstToReport: "Be the first to report your wait.",
    callDepartment: "Call {department}",
    rateLimited: "You've already reported recently — thanks!",
    reportSubmitted: "Thanks — your report was received.",
  },
} satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;

export function t(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let str = translations[locale][key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
