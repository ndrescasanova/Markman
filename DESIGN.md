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

- **Logo / Wordmark only:** EB Garamond (Garamond), Georgia serif — used **exclusively** for the "Markman" wordmark in the top bar/nav. Nowhere else in the UI. Garamond's classical authority makes the brand mark distinctive and precious; its rarity in the interface is intentional. Do not use for headers, panel titles, or any functional UI text.
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
| Logo / Wordmark | any | 400 | EB Garamond (logo only) |
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
| `--accent` / Blue | `#2563EB` | CTAs only: primary buttons, links, active nav |
| `--success` | `#16A34A` | Score ≥80, Registered badge, positive states |
| `--warning` | `#D97706` | Score 50-79, <90d renewal, Pending badge |
| `--danger` | `#DC2626` | Score <50, <30d renewal, Abandoned/Office Action |
| `--bg` | `#FFFFFF` | Page background |
| `--surface` | `#FAFAFA` | Card backgrounds, sidebar |
| `--border` | `#E5E7EB` | All borders, dividers, table rules |

### Semantic Color Usage Rules
- **Blue** only appears on: primary CTA buttons, text links, active nav item, focus rings
- **Green/Warning/Red** only appear on: status badges, score gauge, urgency indicators, attorney stat cards when count > 0
- Never use color for decoration. If removing a color makes the UI clearer, remove it.

### Dark Mode Strategy
- Flip `--bg` to `#0A0A0F`, `--surface` to `#111118`, `--border` to `rgba(255,255,255,0.1)`
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

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | EB Garamond logo-only + Instrument Sans for all UI | Garamond on panel/metric headers felt ornate and ceremonial in a utility dashboard. Logo-only usage makes the brand mark more precious. |
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
