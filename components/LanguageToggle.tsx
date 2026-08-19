"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Choose language"
      className="inline-flex overflow-hidden rounded-md border border-neutral-400"
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={`min-h-[44px] min-w-[44px] px-3 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-neutral-900 text-white"
            : "bg-white text-neutral-900 hover:bg-neutral-100"
        }`}
      >
        EN
        {locale === "en" && <span className="sr-only"> (selected)</span>}
      </button>
      <button
        type="button"
        aria-pressed={locale === "dz"}
        onClick={() => setLocale("dz")}
        lang="dz"
        className={`min-h-[44px] min-w-[44px] px-3 font-dzongkha text-base transition-colors ${
          locale === "dz"
            ? "bg-neutral-900 text-white"
            : "bg-white text-neutral-900 hover:bg-neutral-100"
        }`}
      >
        རྫོང་ཁ
        {locale === "dz" && <span className="sr-only"> (selected)</span>}
      </button>
    </div>
  );
}
