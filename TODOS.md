# TODOS

## Product

### Reconstruct build-vs-buy reasoning for the JDWNRH booking platform

**What:** Write down the actual reasoning for choosing a custom-built confirmed-slot platform (Approach B) over integrating an existing commercial queue-management platform (WaitWell/Qmatic-style), which was raised and considered during `/plan-ceo-review` but not fully captured in writing.

**Why:** The CEO plan (`~/.gstack/projects/demo/ceo-plans/2026-08-19-jdwnrh-hospital-booking.md`) currently flags this as "decision made, reasoning not fully justified in writing yet." Right now a reader could mistake the founder's choice for a fully considered decision when it wasn't reconstructed. Likely candidates worth confirming: cost of commercial licensing for a government pilot, Bhutan-specific localization/CID support not available off-the-shelf, or control over the connections-bypass-detection logic that no commercial platform builds.

**Context:** Raised during the CEO review's 0C-bis implementation-alternatives step. The founder kept the original custom-build choice (Approach B) when the buy-vs-build alternative was presented, but the underlying reasoning wasn't articulated in the conversation. See `docs/designs/jdwnrh-hospital-booking.md` for the full design doc and `~/.gstack/projects/demo/ceo-plans/2026-08-19-jdwnrh-hospital-booking.md` for the CEO plan's Build vs. Buy Consideration section.

**Effort:** S
**Priority:** P2
**Depends on:** None

### Referral pre-booking for district-hospital-referred patients

**What:** Let district hospitals pre-book a referred patient's JDWNRH slot before the patient travels to Thimphu, so the trip and the wait aren't both dead time.

**Why:** Directly resolves the open Premise 3 risk — if referred/rural patients turn out to be the real majority of JDWNRH's queue (not the civil-servant wedge), this is what actually serves them.

**Context:** Originally accepted as scope during `/plan-ceo-review`'s SELECTIVE EXPANSION cherry-pick ceremony, then moved to backlog after outside-voice review flagged it as doubly-gated (needs both Phase 1 JDWNRH access AND a separate, not-yet-attempted district-hospital cooperation effort) with no owner or timeline — keeping it in "Accepted Scope" understated how blocked the plan actually is. Also introduces a cross-institution double-booking risk (two institutions writing to the same JDWNRH capacity pool) that isn't solved yet — see `docs/designs/jdwnrh-hospital-booking.md` Open Questions. Do not start before JDWNRH itself (Phase 1) is unblocked.

**Effort:** L
**Priority:** P3
**Depends on:** Phase 1 (JDWNRH institutional access) AND a separate district-hospital relationship not yet attempted
