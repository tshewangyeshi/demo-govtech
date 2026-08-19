# Dzongkha Translator Outreach — Draft Messages

Generated to unblock the bilingual UI dependency in `docs/designs/jdwnrh-hospital-booking.md`. Review and edit before sending — these are drafts, not final copy.

---

## 1. Email to the Dzongkha Development Commission

**To:** ddc@moha.gov.bt
**Subject:** Translation inquiry — small civic-tech project, JDWNRH wait-time app

> Kuzuzangpo la,
>
> My name is [YOUR NAME]. I'm building a small, independent civic-tech pilot: a mobile-web app that lets patients and families at JDWNRH (Jigme Dorji Wangchuck National Referral Hospital) check crowd-reported wait times before traveling to the hospital, and eventually supports online appointment scheduling.
>
> The app already uses the **Uchen** font (Google Fonts) for Dzongkha text, which I understand DDC developed — thank you for making that available.
>
> I'm now looking to translate a small set of UI strings (roughly 20-40 short phrases — page labels, button text, a handful of status messages) from English into Dzongkha for the app's initial version. Some of this touches civic/health terminology (e.g. "wait time," "department," "report your wait"), so I'd value input from someone with DDC's standardization background rather than a generic translation service.
>
> Could you let me know:
> 1. Whether DDC offers translation services for a small project like this, or
> 2. Whether you could refer a qualified translator familiar with civic/health terminology.
>
> This is currently a self-funded pilot, not yet a funded venture, so I'd appreciate knowing what a reasonable budget looks like for a project this size.
>
> Thank you for your time — happy to share more detail about the project if useful.
>
> Kadrinche la,
> [YOUR NAME]
> [YOUR PHONE / EMAIL]

---

## 2. ProZ.com job posting

**Title:** English → Dzongkha translation, ~20-40 short UI strings (civic health app)

**Language pair:** English → Dzongkha
**Field:** Medical / General / IT (civic technology)
**Volume:** ~20-40 short phrases (UI labels, buttons, status messages — not long-form content)
**Deadline:** Flexible — [ADD REALISTIC DATE, e.g. 2 weeks from posting]
**Budget:** [ADD YOUR BUDGET — even a modest fixed fee is fine to state; ProZ translators expect a number]

**Description:**

> I'm building a small independent civic-tech pilot app for JDWNRH (Bhutan's national referral hospital) — a mobile-web tool that shows crowd-reported hospital wait times and (later) supports appointment scheduling. I need a small set of UI strings translated from English into Dzongkha (Uchen script).
>
> Examples of the type of content: "No recent reports for [department]," "Report your wait," "You've already reported recently — thanks!," "Sign in," department names, and similar short, functional phrases — not long-form or legal text.
>
> Looking for a translator comfortable with plain, civic/health-adjacent language (not formal/literary register) — the app is meant to be read quickly by patients and family members, some of whom may have limited literacy.
>
> Please include: relevant experience with Dzongkha translation, familiarity with UI/app localization if any, and your rate for a project this size.

---

## 3. Note to Sherubtse College, Dzongkha Department

**To:** [Dzongkha department contact — look up current faculty contact at sherubtse.edu.bt before sending]
**Subject:** Small paid translation project — civic health app, English to Dzongkha

> Kuzuzangpo la,
>
> My name is [YOUR NAME]. I'm building an independent civic-tech project: a small app that shows crowd-reported wait times at JDWNRH (the national referral hospital) so patients and families can check before traveling in, with the goal of eventually supporting online appointment booking.
>
> I'm looking for someone with strong Dzongkha and English skills to help translate a small set of app text (roughly 20-40 short UI phrases, not long-form writing) — the kind of civic/health-adjacent language a patient or family member would need to read quickly and clearly.
>
> I'd love to know if there's a faculty member or advanced student in the Dzongkha department who might be interested in a small paid project like this. Happy to share more detail, and flexible on timing.
>
> Kadrinche la,
> [YOUR NAME]
> [YOUR PHONE / EMAIL]

---

## Notes

- Fill in `[YOUR NAME]`, `[YOUR PHONE / EMAIL]`, budget, and deadline before sending any of these.
- Sending order suggested in the design doc: DDC first (official source, existing font relationship), ProZ second (broadest reach), Sherubtse third (best quality for the effort, but slower to get a response).
- Once a translator is engaged, the actual translation work replaces the placeholder Dzongkha strings in `lib/i18n/translations.ts` (`dz` object) and the `name_dz` column on `departments` in Supabase.
