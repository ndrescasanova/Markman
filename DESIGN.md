# Design System — Markman

## Product Context
- **What this is:** B2B2C trademark portfolio management SaaS — attorneys manage client portfolios, founders track their own marks and receive renewal alerts
- **Who it's for:** Two user types: (1) startup founders who hold trademarks and need renewal tracking, (2) IP attorneys who manage multiple client portfolios
- **Space/industry:** Legal tech / IP management. Peers: Corsearch, Alt Legal, Clio, Clarivate
- **Project type:** Web app dashboard — data-dense, utility-first, trust-critical

## Aesthetic Direction
- **Direction:** Quiet Authority — the aesthetic of the best software that happens to do legal, not legal software that happens to look modern
- **Decoration level:** Minimal — typography and whitespace do all the work. Status colors are the only ornamentation.
- **Mood:** Effortless. Clean. Authoritative without being cold. The kind of interface where nothing gets in the way. Harvey AI meets Apple — every element earns its pixels, nothing is decorative.
- **Reference sites:** Harvey AI (quiet confidence, generous whitespace, zero chrome), Apple (effortless hierarchy, type does the work, nothing to distract)
- **Deliberate departures from legal tech category:**
  1. **No navy + gold corporate palette.** Corsearch, Clarivate, Clio all use dark navy with gold or teal accents — signals "enterprise," "old," "scary." Markman uses clean white with a single Blue accent. Feels like a consumer product.
  2. **No information density as a feature.** Alt Legal packs the screen. Markman uses generous whitespace to signal that we've done the work of simplification for you. Restraint as a brand statement.

## Typography

- **Logo / Wordmark + Hero Headline only:** EB Garamond (Garamond), Georgia serif — used for two specific moments: (1) the "Markman" wordmark in the nav/top bar, and (2) the primary hero `<h1>` in italic at display size (`clamp(52px, 8vw, 96px)`, `font-style: italic`, `font-weight: 500`). Nowhere else. This is the Harvey AI strategy: one dramatic serif moment in the hero, then clean sans for everything else. Overuse destroys the effect. Do not use for section headings, panel titles, or any functional UI text.
- **Body/UI:** Instrument Sans, -apple-system sans-serif — all interface labels, body text, navigation, buttons, form fields. Clean and highly legible at small sizes.
- **Data/Tables:** Geist Mono, JetBrains Mono monospace — dates in tables, any numeric data needing alignment. `font-variant-numeric: tabular-nums` always applied. Exception: registration/serial number chips use Instrument Sans + tabular-nums (chip treatment, not full mono).
- **Loading:** Google Fonts CDN
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  ```
  Geist Mono: `npm install geist` or local font files.

### Type Scale
| Role | Size | Weight | Font |
|------|------|--------|------|
| Logo / Wordmark | any | 400–500 | EB Garamond |
| Hero Headline `<h1>` | clamp(52px–96px) | 500 italic | EB Garamond |
| Page Title | 1.5rem (24px) | 600 | Instrument Sans |
| Section Heading | 1.125rem (18px) | 600 | Instrument Sans |
| Card Title | 1rem (16px) | 600 | Instrument Sans |
| Body | 0.9375rem (15px) | 400 | Instrument Sans |
| Label/Caption | 0.875rem (14px) | 400 | Instrument Sans |
| Data/Mono | 0.875rem (14px) | 400 | Geist Mono |
| Micro | 0.75rem (12px) | 500 | Instrument Sans |

## Color

- **Approach:** Restrained — one accent color (Blue), three semantic colors (Success/Warning/Danger), otherwise neutral gray palette. Color is rare and meaningful.

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--text` / Navy | `#0A1628` | All primary text, headings, body |
| `--text-muted` | `#6B7280` | Secondary text, labels, metadata |
| `--text-subtle` | `#9CA3AF` | Placeholder text, disabled states |
| `--overline` | `#8C7355` | Editorial category labels only — "TRADEMARK PORTFOLIO MANAGEMENT" overlines, section overlines. NOT interactive. Dark mode: `#A08B6A` |
| `--accent` / Blue | `#2563EB` | CTAs only: primary buttons, links, active nav |
| `--success` | `#16A34A` | Score ≥80, Registered badge, positive states |
| `--warning` | `#D97706` | Score 50-79, <90d renewal, Pending badge |
| `--danger` | `#DC2626` | Score <50, <30d renewal, Abandoned/Office Action |
| `--bg` | `#FFFFFF` | Page background |
| `--surface` | `#FAFAFA` | Card backgrounds, sidebar |
| `--border` | `#E5E7EB` | All borders, dividers, table rules |

### Semantic Color Usage Rules
- **Navy** appears on: marketing/hero CTA pill ("Get started free") — the Harvey/Tesla treatment. One commanding dark pill on a white hero, matched by an outlined ghost pill. Navy pill = "buy/start" intent.
- **Blue** appears on: all app UI CTAs (dashboard buttons, form submits, text links, active nav item, focus rings). Blue = interactive within the app. Do NOT use blue on the marketing hero CTA.
- **Overline brown (`--overline`)** only appears on: editorial category labels ("TRADEMARK PORTFOLIO MANAGEMENT", section overlines). NOT on interactive elements. This is the Apple HIG rule: brown = label, blue = interactive. Never swap them.
- **Green/Warning/Red** only appear on: status badges, score gauge, urgency indicators, attorney stat cards when count > 0
- Never use color for decoration. If removing a color makes the UI clearer, remove it.

### Dark Mode Strategy
- Flip `--bg` to `#0A0F1A`, `--surface` to `#111118`, `--border` to `rgba(255,255,255,0.1)`
- Reduce saturation on accent/semantic colors by ~15%
- Navy `#0A1628` becomes light `#E8EDF5` for text
- Dark mode is secondary — light mode is the primary target for Phase 1

### CSS Variables (globals.css additions)
```css
:root {
  /* Markman design tokens — override shadcn defaults */
  --background: #FFFFFF;
  --foreground: #0A1628;
  --card: #FFFFFF;
  --card-foreground: #0A1628;
  --primary: #2563EB;
  --primary-foreground: #FFFFFF;
  --muted: #FAFAFA;
  --muted-foreground: #6B7280;
  --border: #E5E7EB;
  --ring: #2563EB;

  /* Editorial labels — NOT interactive */
  --overline: #8C7355;

  /* Semantic aliases */
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-warning: #D97706;
  --color-warning-bg: #FFFBEB;
  --color-danger: #DC2626;
  --color-danger-bg: #FEF2F2;

  /* Typography */
  --font-serif: 'EB Garamond', Garamond, Georgia, serif;
  --font-sans: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;
}
```

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable — generous whitespace signals simplicity and trust. Never pack the UI.
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| 2xs | 4px | Icon gap, tight inline spacing |
| xs | 8px | Between related elements |
| sm | 12px | Card padding (tight), badge padding |
| md | 16px | Default card padding, form field spacing |
| lg | 24px | Section spacing, card gap |
| xl | 32px | Page section padding |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Hero section padding |

## Layout

- **Approach:** Grid-disciplined — strict column system for the app shell. The score strip and stat cards use a clear visual hierarchy, not creative asymmetry.
- **Grid:** 12-column at desktop (≥1024px), 4-column at tablet (768-1023px), single-column at mobile (<768px)
- **Max content width:** 1280px
- **Sidebar width:** 240px (fixed, not collapsible in Phase 1)
- **Border radius:**
  - Buttons, inputs, small elements: `6px` (--radius-md)
  - Cards: `8px` (--radius-lg)
  - Badges: `4px` (--radius-sm)
  - Full-round: `9999px` (avatar, pill tags)

### Navigation Structure
- **Left sidebar** (shadcn Sidebar component)
- **Founder sidebar:** Dashboard · Trademarks · + Add Trademark
- **Attorney sidebar:** Overview · Clients · Deadlines · Invite Client
- Active item: Blue text + left border indicator (no background fill)
- Sidebar background: `--surface` (#FAFAFA), border-right: 1px solid `--border`

### Founder Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR │ BRAND HEALTH STRIP (arc gauge + score)        │
│         │ 120px height, full width of content area      │
│ 240px   ├─────────────────────────────────────────────  │
│ fixed   │ TRADEMARKS TABLE (full width)                 │
│         │ Status | Name | Reg# | Renewal | Action       │
│         ├─────────────────────────────────────────────  │
│         │ RENEWAL TIMELINE (full width)                 │
│         │ Chronological list with urgency indicators    │
│         ├─────────────────────────────────────────────  │
│         │ ATTORNEY STRIP (conditional)                  │
│         │ Only visible when attorney relationship exists│
└─────────────────────────────────────────────────────────┘
```

### Attorney Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR │ STAT CARDS ROW (3 cards)                      │
│         │ Total Clients | Upcoming Renewals | Alerts    │
│         ├─────────────────────────────────────────────  │
│         │ CLIENT LIST (full width)                      │
│         │ Client | Marks | Next Renewal | Status        │
└─────────────────────────────────────────────────────────┘
```

## Component Patterns

### Brand Health Score — Arc Gauge
- SVG semi-circle arc, 200px wide, 110px height
- Track: `#E5E7EB` (full arc background)
- Fill: color-coded by score
  - ≥80: `#16A34A` (Success)
  - 50-79: `#D97706` (Warning)
  - <50: `#DC2626` (Danger)
- Score number: overlaid inside arc (absolute positioned), 52px Instrument Sans 600, letter-spacing -0.04em
- Label: "Brand Health Score" in 14px Instrument Sans muted
- Tooltip: "This score reflects your trademark data completeness and renewal status. It is not a legal opinion."
- Hidden when 0 trademarks — replaced by empty state

### Status Badges
All badges: 4px border-radius, 12px font, 500 weight, `px-2 py-0.5`

| Status | Background | Text |
|--------|-----------|------|
| Registered | `#F0FDF4` | `#16A34A` |
| Pending | `#EFF6FF` | `#2563EB` |
| Office Action | `#FFFBEB` | `#D97706` |
| Abandoned | `#FEF2F2` | `#DC2626` |
| Expired | `#F3F4F6` | `#6B7280` |

### Registration & Serial Number Display
USPTO numbers are plain sequential integers — never formatted with commas or separators.
- **Registration number:** 7 digits, e.g., `7123456`
- **Serial number:** 8 digits, e.g., `88345678`
- Display treatment: chip style — `var(--surface)` background, 1px `var(--border)` border, `var(--radius-sm)` (4px) border-radius, `px-2 py-0.5`, 11px Instrument Sans, `font-variant-numeric: tabular-nums`, `var(--text-subtle)` color
- Never use monospace for these — Instrument Sans + tabular-nums is sufficient and cleaner

### Urgency Hierarchy (renewal timeline sorting)
1. Conflicts (Phase 2 — locked card in Phase 1) — Danger
2. Renewal <7d — Danger (`#DC2626`)
3. Renewal 7-30d — Warning (`#D97706`)
4. Renewal 30-90d — muted text, no color
5. All clear — neutral

### Attorney Stat Cards — Urgency Coloring
- Stat card background changes when count > 0 for urgent items:
  - `Upcoming Renewals (<30d)`: card bg → `#FFFBEB`, count text → `#D97706`
  - `Alerts / Abandoned`: card bg → `#FEF2F2`, count text → `#DC2626`
  - Normal state: `--surface` background, `--text` count

### Sidebar CTA Buttons ("Add Trademark" / "Invite Client")
- Style: Apple/Harvey/Tesla — white bg, barely-there border, micro shadow. Never Blue (`--accent`) in sidebar.
- Background: `var(--bg)` (white)
- Border: `1px solid rgba(10, 22, 40, 0.14)` (navy at 14% opacity)
- Box shadow: `0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(10,22,40,0.03)`
- Border radius: `var(--radius-md)` (6px)
- Font: Instrument Sans 13px, 500 weight, letter-spacing -0.01em, `var(--text)` color
- Padding: `8px 14px`
- Leading icon: `+` SVG (11×11, stroke-width 1.5, stroke-linecap round)
- Full width, `justify-content: center`
- Hover: `var(--surface)` bg (subtle — no color change)

### Attorney Staleness Strip
Shown on attorney dashboard client rows to indicate data freshness:
- **0-7 days** since last sync: no indicator (neutral)
- **8-30 days**: Warning strip (`#FFFBEB` bg, `#D97706` text: "Last synced X days ago")
- **>30 days**: hide strip entirely — sync is too stale to be useful

## Interaction States

### Empty States
**Founder (0 trademarks):**
- Hide arc gauge and marks table
- Show centered empty state in content area:
  - Shield icon (outline, 48px, `--text-muted`)
  - Heading: "Add your first trademark" (18px, 600)
  - Body: "Enter your USPTO serial number to start tracking renewals and get your brand health score."
  - CTA: "Add Trademark" (primary Blue button)

**Attorney (0 clients):**
- Hide all stat cards
- Show centered empty state:
  - Briefcase icon (outline, 48px, `--text-muted`)
  - Heading: "Invite your first client"
  - Body: "Invite a founder to connect their trademark portfolio to your dashboard."
  - CTA: "Invite Client" (primary Blue button)

### Loading States
- **Score strip:** 120px-height shimmer skeleton (pulsing gray gradient)
- **Marks table:** 3 skeleton rows (gray bars at name/badge/date positions)
- **TSDR lookup button:** "Looking up..." text + inline spinner (replaces button label during fetch)
- Skeleton animation: `opacity: 0.7 → 1` pulse, 1.5s ease-in-out infinite

### TSDR Error States
1. **Trademark not found (404):** Inline red border on input + "Trademark not found — check the number and try again. [Search on USPTO ↗]" below input. No DB record created.
2. **USPTO API down/timeout:** Toast notification: "USPTO API is slow — try again in a moment." Retry button in toast. No DB record created.
3. **Invalid format:** Inline validation before submit — "Serial numbers are 8 digits (e.g., 97123456)". Prevents submission.

### Phase 2 Locked Card
- On founder dashboard: "Conflict Monitoring — Coming in Phase 2"
- Card style: `--surface` bg, dashed `--border`, muted text
- No lock icon — just "Available soon" in 14px muted text

## Motion

- **Approach:** Minimal-functional — only transitions that aid comprehension. No choreography.
- **Easing:** enter: `ease-out` / exit: `ease-in` / move: `ease-in-out`
- **Duration:**
  - Micro (hover state changes): 100ms
  - Short (badge appearance, focus ring): 150ms
  - Medium (page transitions, modal open): 250ms
  - Long (skeleton fade): 400ms
- **Skeleton pulse:** 1.5s ease-in-out infinite

## Responsive

- **Mobile (<768px):** Marks table collapses to 2-line card stack (Name + Status on line 1, Renewal date on line 2). Sidebar becomes bottom tab bar. Stat cards stack single-column.
- **Tablet (768-1023px):** Sidebar stays visible (narrower, icon-only option). Stat cards 2-column.
- **Desktop (≥1024px):** Full layout as specified above.

## Accessibility Baseline

- Color contrast: WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- All interactive elements: 44px minimum touch target
- Focus ring: 2px solid `#2563EB` (Blue), 2px offset
- ARIA landmarks: `<nav>`, `<main>`, `<aside>` on all pages
- Score gauge: `aria-label="Brand health score: {N} out of 100"`
- Status badges: `aria-label="{status}"` in addition to visual color
- Keyboard navigation: full tab order, no focus traps except modals
- Screen reader: table headers `scope="col"`, status changes announced via `aria-live="polite"`

## Legal Framing

- The brand health score tooltip must always include: "This score reflects your trademark data completeness and renewal status. It is not a legal opinion."
- Page footer: standard "Not legal advice" disclaimer
- Score component label: consider "Brand Health Score" (preferred) vs "Portfolio Status Score" — get IP attorney input before public launch (see TODOS.md TODO-004)

## Expansion Feature UI Specs

*Added by /plan-design-review on 2026-03-25. Covers the 5 CEO expansion features that were unspecced at the time of the base DESIGN.md creation.*

---

### Score Sparkline

- **Dimensions:** 64×20px inline (founder dashboard score strip); 80×20px (attorney client list rows)
- **Stroke:** 1.5px, no fill, no axes, no grid
- **Color:** matches current score — success `#16A34A` (≥80), warning `#D97706` (50–79), danger `#DC2626` (<50)
- **Hover tooltip:** "Score on {date}: {N}" (Instrument Sans 12px)
- **Empty state:** dash "—" when fewer than 2 data points exist. No sparkline rendered.
- **Data window:** last 30 days (from `score_history` query)
- **No loading skeleton:** sparkline is supplemental data; omit entirely if loading takes >200ms

---

### Navigation Update (Expansion)

Updated sidebar items to include Messages:

- **Founder sidebar:** Dashboard · Trademarks · Messages · + Add Trademark
- **Attorney sidebar:** Overview · Clients · Deadlines · Messages · Invite Client

**Messages nav item:**
- Unread badge: Blue `#2563EB` rounded pill, white text, 18px height
  - 0 unread: badge hidden
  - 1–99 unread: shows count
  - 100+: shows "99+"
- Founders with no active subscription: "Messages" item visible, clicking shows Stripe upgrade prompt (see below)

---

### In-App Messaging UI

**Route:** `/messages` (founders with attorney) · `/attorney/messages` (attorneys, thread list)

**Attorney Messages page — thread list + selected thread (two-column layout):**
```
SIDEBAR  │ THREAD LIST          │ THREAD VIEW
─────────│──────────────────────│────────────────────────────
Messages │ ● Jane Founder       │ Jane Founder
         │   "Thanks, noted"    │ Mar 25 · 10:42 AM
         │   Today              │
         │                      │ Hi, your §8 Declaration
         │ Zoe Founder          │ is due in 45 days. Let me
         │   "Sounds good!"     │ know if you need help.
         │   Yesterday          │ ─────────────────── Read ✓
         │                      │
         │                      │       Thanks, noted! That
         │                      │       would be great.
         │                      │
         │                      │ [ Message...       ] [Send]
```

**Founder Messages page — single thread (no thread list needed):**
```
SIDEBAR  │ MESSAGES — Jane Attorney
─────────│──────────────────────────────────
Messages │ Mar 25 · 10:42 AM
         │ Hi, your §8 Declaration is due in
         │ 45 days. Let me need help.
         │ ─────────────────────── Read ✓
         │
         │        Thanks, noted! That would be
         │        great.
         │
         │ [ Message...                 ] [Send]
```

**Message transcript style** (not chat bubbles):
- Attorney messages: left-aligned, no background, `--text` color
- Own messages: right-aligned, no background, `--text-muted` color
- Timestamp: `--text-subtle` 12px above each new date group (date divider)
- Read receipt: "Read" in `--text-subtle` 11px below the last read message (updates via Realtime)
- No colored message bubbles — transcript style appropriate for legal communication

**Composer:**
- Full-width textarea, min-height 40px, max-height 96px (auto-expand on type)
- Placeholder: "Message…" in `--text-subtle`
- Character limit: 2000 (show counter at 1800+: "200 remaining" in `--text-muted`)
- Send button: Blue `--primary`, disabled when empty or >2000 chars
- Send on Enter, Shift+Enter for newline

**Empty state (no messages yet):**
- Center of thread area: envelope outline icon (32px, `--text-muted`), "No messages yet" heading, "Start the conversation below." body text

**Realtime failure banner:**
- Amber bar (`#FFFBEB`) at top of thread area
- "Reconnecting…" with 12px spinner (role="status", aria-live="polite")
- After 5s: switches silently to 5s polling — banner remains until connection restores, then fades out (250ms ease-out)

**Loading state (initial thread fetch):**
- 3 skeleton rows: alternating left/right alignment (mirrors transcript layout), each row a 40% and 60% width gray bar, 36px height
- Standard 1.5s shimmer animation (same as marks table skeleton)

**Send error state:**
- Red toast: "Message failed to send. [Retry]"
- Retry button re-submits the same message text
- Message text remains in composer (not cleared on error)

**Accessibility:**
- Unread badge: `aria-label="N unread messages"` on the badge element
- Composer textarea: `aria-label="Message {recipient name}"`
- Send button: `aria-label="Send message"`
- Read receipt: `aria-live="polite"` on the read receipt element (updates without focus)

**Responsive:**
- Mobile (<768px): thread list is hidden; Messages page shows the thread directly (no two-column layout). Attorney on mobile navigates back via browser back or header ← button to see thread list.
- Composer on mobile: stays docked at bottom of viewport (position: sticky bottom-0)

---

### Bulk CSV Import Page (`/attorney/import`)

**Three-step flow:**

**Step 1 — Upload**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   [ ↑ ]  Drop CSV file here, or [Browse Files]       │
│                                                       │
│         Accepted format: .csv only                   │
│                                                       │
└─────────────────────────────────────────────────────┘
[Download sample CSV →]
Format: serial_number, client_email (header row required)
```
- Dashed border `--border`, 160px height, `--surface` background
- Drag-over state: Blue dashed border + `#EFF6FF` background
- `Browse Files` text: Blue `--primary` link weight

**Step 2 — Preview (after upload + TSDR batch)**

Progress during lookup:
- Header: "Looking up 3 of 40 trademarks…" with inline progress bar (Blue fill)
- Preview table renders as rows complete (streaming feel, not all-at-once)

Preview header row (counts):
> "40 rows parsed · 2 CSV duplicates removed · 3 already in portfolio · 1 client not found"

Preview table columns: Status | Serial # | Mark Name | Client Email | Notes

Status badge map for preview:
| Badge | Color | Meaning |
|-------|-------|---------|
| Ready | Green `#F0FDF4` / `#16A34A` | Will import |
| CSV Dup | Blue `#EFF6FF` / `#2563EB` | Duplicate in this CSV — skipped |
| In Portfolio | Amber `#FFFBEB` / `#D97706` | Already in DB for this client |
| Not Found | Red `#FEF2F2` / `#DC2626` | TSDR 404 or client not found |
| Error | Red `#FEF2F2` / `#DC2626` | TSDR timeout or other error |

CSV Dup and In Portfolio rows: 50% opacity on row, not clickable. Notes column shows skip reason.
Not Found + Error rows: full opacity, Notes column shows specific error message.

**Cap exceeded error banner** (if row count > tier limit):
- Red banner `#FEF2F2` / `#DC2626` at top of preview
- "This import has 45 trademarks. Your plan supports up to 40 per import. Remove 5 rows from your CSV and re-upload."
- No import button shown while cap is exceeded.

**Footer:**
```
[Cancel]                    [Import 34 trademarks →]
```
- Count shows only Ready rows (not CSV Dup, In Portfolio, error rows)
- Button disabled + tooltip "No trademarks ready to import" if count = 0

**Step 3 — Confirmation**
- Full-width success banner: "34 trademarks imported successfully."
- Body: "Your clients' portfolios have been updated."
- CTA: [View Clients →] primary Blue button

**Empty CSV (0 rows after parsing):**
- Preview step shows header: "0 rows found" and no table
- Yellow info banner: "Your CSV appears to be empty or has no valid rows. Download the sample CSV to see the expected format."
- Footer shows `[Cancel]` only, Import button absent

**Accessibility:**
- File input: `aria-label="Upload CSV file"`, visually hidden, triggered by upload zone click
- Progress bar during TSDR lookup: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`
- Preview table: `<thead>` with `scope="col"` on all headers
- Status badges in table: `aria-label` matching badge text

**Responsive:**
- Mobile (<768px): step indicator collapses to text only ("Step 2 of 3"). Preview table scrolls horizontally. Import is an attorney workflow — mobile is acceptable but not primary.

---

### Renewal Assistant Panel

Appears **inline below each qualifying row** in the founder's renewal timeline. One panel per mark where `expirationDate - today ≤ 90 days`. Dismiss-able per mark (session-only — no DB persistence in Phase 1).

**Panel anatomy:**
```
⚠  MARKMAN TECH  │  Due in 45 days     [Registered]
   Reg# 7123456  │  Class 42
┌────────────────────────────────────────────────────┐
│ ⚠ Renewal due in 45 days                        × │
│ Your trademark needs to be renewed to stay         │
│ active. File your §8 Declaration with the USPTO    │
│ by [expiration date]. Your attorney can handle     │
│ this for you.                                      │
│ [Learn more on USPTO ↗]                           │
└────────────────────────────────────────────────────┘
```

**Color by urgency:**
- 30–90 days: `#FFFBEB` background (warning amber), `#D97706` heading
- <30 days: `#FEF2F2` background (danger red), `#DC2626` heading

**Dismiss (×):** top-right, removes panel from view. Panel returns on page refresh (session-only).

**Multi-mark behavior:** each qualifying mark shows its own panel. No collapsing or aggregation.

---

### Stripe Upgrade Prompt

Applies to: PDF export button, Messages nav item (for founders without active subscription).

**Visual treatment:**
- The feature element is shown but disabled (`opacity: 0.6`, `cursor: not-allowed`)
- Disabled button shows lock icon: `Export Portfolio PDF 🔒`
- Messages nav item: shown normally (not locked-looking), but clicking opens the prompt

**Upgrade prompt (popover, not modal):**
```
┌──────────────────────────────────┐
│ Unlock with Markman Pro          │
│                                  │
│ $99/year — cancel anytime        │
│                                  │
│ [Subscribe →]       [Not now]    │
└──────────────────────────────────┘
```
- 280px wide, `--surface` background, `--border` 1px border, 8px border-radius
- Drop shadow: `0 4px 16px rgba(0,0,0,0.08)`
- Heading: 15px Instrument Sans 600
- Price: 14px Instrument Sans 400 `--text-muted`
- `[Subscribe →]`: primary Blue button → opens Stripe Checkout redirect
- `[Not now]`: ghost button (no background, `--text-muted`) → dismisses; session-level suppression (don't re-show for this session)
- Popover anchors below the triggering element with 8px gap

**Stripe checkout success return:**
- `success_url`: `/dashboard?subscribed=true`
- On load: detect `subscribed=true` query param. Show green success toast (bottom-right, 5s auto-dismiss):
  > "✓ Welcome to Markman Pro! Your subscription is active."
- Remove query param from URL after toast fires (via `router.replace('/dashboard')`)
- Gated features visually unlock immediately on next render (webhook will have fired; if not yet, optimistic unlock is acceptable — the API will still verify server-side)

---

### Attorney Client Detail Page (`/attorney/clients/[id]`)

**Purpose:** Attorney views a client's full trademark portfolio and can add marks on their behalf.

**Layout:**
```
SIDEBAR  │  [← Clients]  Jane Founder  jane@startup.com
─────────│──────────────────────────────────────────────
         │  BRAND HEALTH STRIP (same arc gauge as founder dashboard)
         │  Score for this client, sparkline
         │──────────────────────────────────────────────
         │  TRADEMARKS TABLE (same as founder dashboard)
         │  Status | Name | Serial # | Renewal | Action
         │──────────────────────────────────────────────
         │  [+ Add Trademark for Jane]  ← sidebar CTA style
```

- "← Clients" breadcrumb link back to `/attorney/clients`
- Arc gauge, marks table, and sparkline reuse the same components as the founder dashboard
- "Add Trademark for Jane" button opens the same TSDR serial number form; `founder_id` is pre-set to client's user ID (not editable)
- Empty state (client has 0 trademarks): shield icon + "Add Jane's first trademark" + [Add Trademark] CTA

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | EB Garamond logo-only + Instrument Sans for all UI | Garamond on panel/metric headers felt ornate and ceremonial in a utility dashboard. Logo-only usage makes the brand mark more precious. |
| 2026-03-25 | EB Garamond italic added to hero `<h1>` (Harvey strategy) | One dramatic display serif moment in the hero resolves the tension between the elegant wordmark and the functional UI. Harvey AI uses this exact pattern: expressive serif italic at large display size, then clean sans for all other text. Instrument Sans remains the UI font everywhere else. |
| 2026-03-25 | Navy #0A1628 + Blue #2563EB + White palette | Deliberate departure from legal tech navy/gold corporate palette |
| 2026-03-25 | Zero decoration, status colors only | "Quiet Authority" — restraint as a brand statement |
| 2026-03-25 | Arc gauge for brand health score | More expressive than a progress bar; communicates magnitude at a glance |
| 2026-03-25 | Status badge color map (5 states) | Maps to USPTO trademark status taxonomy; color = urgency |
| 2026-03-25 | Attorney urgency stat cards (color bg when count > 0) | Action signal without clutter |
| 2026-03-25 | Three-tier attorney staleness threshold | Hides stale data rather than misleading with old numbers |
| 2026-03-25 | Shared urgency hierarchy across founder/attorney | Consistent prioritization model for both user types |
| 2026-03-25 | Full-width score strip as dashboard hero | Score is the primary value signal; it earns the top position |
| 2026-03-25 | Empty states replace content (not overlay) | Reduces clutter; makes the next action unambiguous |
| 2026-03-25 | Three TSDR error state specs | Covers 404, timeout, and invalid format — no silent failures |
| 2026-03-25 | Chronological renewal timeline with urgency indicators | Sorts by consequence, not alphabetically |
| 2026-03-25 | Left sidebar navigation (shadcn Sidebar) | Dashboard-appropriate; persistent nav for multi-section app |
| 2026-03-25 | Minimal-functional motion | Legal software: reliability over delight. Micro-interactions only. |
| 2026-03-25 | Messages: full-page route (not slide-in panel) | Simpler layout, no second scroll context on mobile, predictable navigation |
| 2026-03-25 | Messages: transcript style (not chat bubbles) | Legal communication context — bubbles feel informal; transcript feels authoritative |
| 2026-03-25 | Renewal assistant: inline per qualifying mark | Contextual placement removes ambiguity about which mark needs action |
| 2026-03-25 | Stripe gate: disabled + popover (not hidden) | Feature discoverability drives upgrade conversion; hiding gated features kills it |
| 2026-03-25 | Bulk import preview: streaming row-by-row | Renders as TSDR results arrive — feels responsive vs. waiting for full batch |
