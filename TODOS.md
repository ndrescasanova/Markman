# TODOS

Deferred work captured during engineering review. Each item includes enough context
to pick up cold.

---

## TODO-001: Brand health score DB caching

**What:** Store `health_score` as a computed integer column on the `users` table.
Update it in the daily cron job (after TSDR sync) and on any trademark write (create/update/delete).

**Why:** Currently the score is a pure function computed on every page load from trademark rows. Fine for beta (< 20 trademarks). At scale (100+ trademarks per account), it becomes O(n) JS + N DB reads on every render.

**Pros:** Single DB read to display score. Cron already touches trademarks — trivial to add score update. Enables future SQL queries like "users with score < 60".

**Cons:** Score becomes slightly stale (up to 24h) for changes that happen between cron runs. Mitigate: also recompute on trademark writes.

**Context:** The pure function `computeBrandHealthScore(trademarks[])` will already exist as a tested utility in `lib/ai/brand-health-score.ts`. To cache: call it after TSDR sync and write result to `users.health_score`. Add column in a new migration `003_health_score_cache.sql`.

**Depends on / blocked by:** Phase 1 brand health score function + cron job being built first.

---

## TODO-002: Attorney premium tier (Phase 2+)

**What:** If attorneys prove high engagement and manage large books (50+ clients), consider a premium attorney tier with advanced features (reporting, white-label branding, priority support). Free tier remains free forever.

**Why:** Phase 1 confirmed: attorneys are free forever as a distribution channel (QBOA model). This decision was locked in /plan-eng-review on 2026-03-25. However, a premium tier with value-added features (not a paywall) could unlock a second revenue stream without undermining attorney adoption.

**Pros:** Second revenue stream from high-engagement attorneys. High-volume attorneys have demonstrated willingness to pay for practice management tools (Clio at $49-129/user/mo).

**Cons:** Free-forever is the adoption hook — any paywall risks chilling distribution before network effects kick in. Premium must be genuinely additive, not a gate on existing features.

**Context:** Revisit after Phase 1 attorney beta. Do not introduce any attorney billing until: (1) at least 10 active attorneys, (2) clear data on what features they use most. Base free tier must remain free in perpetuity (it's the core QBOA value prop). Premium features only.

**Depends on / blocked by:** Phase 1 attorney beta data. Not needed until Phase 2.

---

## TODO-003: Resend HTML email templates

**What:** Design and implement branded HTML email templates for the two Phase 1 transactional emails: (1) invite email (attorney → client), (2) renewal alert (to founder, 30d and 7d before deadline).

**Why:** Plain-text Resend emails work for beta. Before public launch, branded templates meaningfully affect activation rate (invite email is the first impression for invited founders) and retention (renewal alert is the core value delivery mechanism).

**Pros:** Invite email sets brand tone. Renewal alert with clear CTA (link to dashboard) improves click-through vs. plain text.

**Cons:** Requires design system to be finalized first (colors, fonts, logo). HTML email testing across clients (Gmail, Outlook, Apple Mail) adds complexity.

**Context:** The Resend client + send functions will exist in `lib/email/`. Templates should be React Email components (Resend's first-class format) or simple HTML strings. Test with Resend's preview feature before going live. Copy: invite template needs attorney name + CTA link; renewal alert needs trademark name + days remaining + dashboard link.

**Depends on / blocked by:** Design system finalized. Not blocking Phase 1 beta (plain text is fine).

---

## TODO-004: Brand health score legal framing

**What:** Before public launch, get feedback from an IP attorney on how the brand health score is framed in the UI. Add explicit "not legal advice" framing to the score component (tooltip, footer, or inline copy). Consider renaming from "health score" to "portfolio status score" or "renewal readiness score" to reduce legal-advice connotations.

**Why:** A numeric 0–100 score on trademark standing can be interpreted as legal advice by founders. An attorney recommending Markman to clients implicitly endorses any score the product shows. If a founder claims reliance on a score and misses a renewal, the attorney faces malpractice-adjacent exposure. This could cause attorney channel resistance before the product reaches scale.

**Pros:** Proactively addresses the risk that is most likely to block attorney adoption. Costs nothing to fix before launch — just copy and a tooltip.

**Cons:** Softer framing (e.g., "renewal readiness") may reduce the perceived value of the score. Test with attorneys first.

**Context:** The score component will exist in the founder dashboard as a prominent number (0–100). At minimum, add: (1) a tooltip: "This score reflects your trademark data completeness and renewal status. It is not a legal opinion." (2) a footer disclaimer consistent with standard SaaS "not legal advice" language. The attorney validation conversations (The Assignment) are the right time to pressure-test the framing.

**Depends on / blocked by:** Attorney validation conversations (The Assignment). Address before first attorney beta invite.

---

## TODO-005: Mark ingestion flow spec

**What:** Spec and implement the UI flow for adding trademarks to the system. Decisions needed: (1) self-serve by founder (founder searches by serial number) vs. attorney-assisted import (attorney enters marks on behalf of client), (2) what the add-trademark form looks like, (3) how TSDR 404 and malformed inputs are handled in the UI.

**Why:** The mark ingestion flow is the most operationally critical interaction in the product. Without a clear spec, the add-trademark page will be implemented ad-hoc. An attorney with 30 clients × 4 marks = 120 entries — if this is all manual, adoption stalls after the demo.

**Pros:** Speccing this now prevents a last-minute scramble. The TSDR 404 handling (trademark not found) and bulk import path are easier to design up front than retrofit.

**Cons:** Bulk import requires USPTO serial number parsing or CSV upload — adds complexity.

**Context:** Minimum viable implementation: a single text input for serial number or registration number. On submit: call TSDR API. If found: create trademark row and show confirmation. If not found: show "Trademark not found — check the number and try again" with a link to USPTO's TSDR search. If API timeout: show "USPTO API is slow — try again in a moment." Future: CSV upload of multiple registration numbers. The attorney dashboard should also allow adding marks on behalf of a client (same flow, but founder_id is the client's user.id).

**Depends on / blocked by:** Phase 1 TSDR integration. Address before first attorney beta invite.

---

## TODO-006: ~~Create DESIGN.md via /design-consultation~~ — DONE

**Completed 2026-03-25.** DESIGN.md written to repo root. CLAUDE.md updated with `## Design System` section. Design system: "Quiet Authority" — Instrument Serif + Instrument Sans + Geist Mono, Navy/Blue/White palette, restrained color (status only), arc gauge score widget, full component pattern specs including status badges, urgency hierarchy, empty/loading/error states, a11y baseline, responsive breakpoints.

---

## TODO-007: Paginated TSDR cron

**What:** Refactor the daily TSDR cron job to process founders in pages (e.g., 50/run), rather than all founders in one run.

**Why:** At 300 founders × 5 marks avg = 1,500 TSDR calls at 30 req/sec = 50+ seconds of I/O alone, exceeding Vercel Hobby's 60s max. The cron will silently time out and leave half the portfolio unsynced. Caught by /plan-eng-review outside voice on 2026-03-25.

**Pros:** Cron stays within Hobby limits indefinitely. Upgrading to Vercel Pro (maxDuration=300) handles ~500 marks comfortably — pagination buys time before that becomes necessary.

**Cons:** Cursor-based pagination adds a `last_synced_batch_cursor` or similar state. Must handle the edge case where a run fails mid-batch (resume from cursor, not restart).

**Context:** Implementation: add a `last_cron_synced_at` column to `users` (or use `trademarks.last_synced` as the cursor). Each cron run fetches `SELECT id FROM users WHERE role='founder' ORDER BY last_cron_synced_at ASC NULLS FIRST LIMIT 50`. After syncing, update `last_cron_synced_at = now()`. This distributes sync naturally across runs without state files.

**Depends on / blocked by:** Phase 1 TSDR cron being built first. Address before hitting 50 active founders (estimated Month 2-3).

---

## TODO-008: TSDR circuit breaker and retry strategy

**What:** Add retry logic (3 attempts with exponential backoff: 1s / 2s / 4s) and a circuit breaker (halt TSDR calls after 5 consecutive failures in a run) to all TSDR call sites.

**Why:** USPTO's TSDR has documented outages of 30 min to 4 hours. During a bulk import, a TSDR outage causes all rows to fail and the all-or-nothing transaction returns a 500 with no actionable message. Attorneys attempting to onboard clients during an outage will see a cryptic error and may not retry.

**Pros:** Graceful degradation: instead of 500 on outage, show "USPTO is temporarily unavailable. Your import was saved — retrying automatically in 30 minutes." Increases trust.

**Cons:** Adds complexity to `lib/uspto/tsdr.ts`. Requires distinguishing retriable errors (5xx, timeout) from non-retriable (404, malformed response).

**Context:** Implementation: wrap TSDR fetch in a retry utility with jitter. For bulk import specifically: if TSDR fails mid-batch after some rows succeed, abort the TSDR loop and return partial preview with an error banner — do NOT commit partial data. The retry applies only to individual TSDR calls, not the DB transaction.

**Depends on / blocked by:** Phase 1 TSDR integration. Address before first attorney uses bulk import in production.
