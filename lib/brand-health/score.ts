/**
 * Brand health score — pure function, no I/O, no side effects.
 * Scale: 0–100.
 *
 * HOW THE SCORE WORKS (no AI — pure formula):
 *
 *  Start at 100 (perfect portfolio).
 *  Deductions come from two signals, both pulled directly from USPTO data:
 *
 *  1. Dead marks (-25 each, max -50)
 *     ABANDONED or CANCELLED marks drag the score down. Two dead marks cap
 *     the abandonment penalty. A portfolio with only dead marks floors at 0.
 *
 *  2. Renewal urgency (per mark)
 *     US trademarks renew every 10 years. If a mark is expiring soon:
 *       < 30 days  →  -25  (critical — act now)
 *       30–90 days →  -15  (warning — start renewal)
 *     Marks with no expiration date (pending/unknown) get no deduction.
 *
 *  Score floor is 0 — never goes negative.
 *
 *  Labels:
 *    80–100  Excellent  (green)
 *    60–79   Good       (green)
 *    40–59   At Risk    (amber)
 *    0–39    Critical   (red)
 *
 * Returns null when the trademark array is empty — the UI displays
 * "Add your first trademark to see your score".
 *
 * Called by:
 *  - Founder dashboard (on render, from cached trademarks)
 *  - app/api/cron/daily-sync — after each trademark update
 *  - app/api/trademarks POST/DELETE — after any trademark write
 */

export type TrademarkStatus =
  | "PENDING"
  | "REGISTERED"
  | "ABANDONED"
  | "OFFICE_ACTION"
  | "CANCELLED"
  | "UNKNOWN";

export interface ScoredTrademark {
  status: TrademarkStatus;
  expiration_date: string | null; // ISO date string or null
}

export const MAX_SCORE = 100;

export function computeBrandHealthScore(
  trademarks: ScoredTrademark[]
): number | null {
  if (trademarks.length === 0) return null;

  let score = MAX_SCORE;
  // Use UTC midnight for consistent day-boundary calculations across timezones
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  // Track total deduction from ABANDONED/CANCELLED marks (cap at -50)
  let abandonedDeduction = 0;

  for (const tm of trademarks) {
    // ABANDONED / CANCELLED: -25 each, max -50 total
    if (tm.status === "ABANDONED" || tm.status === "CANCELLED") {
      if (abandonedDeduction < 50) {
        const deduct = Math.min(25, 50 - abandonedDeduction);
        abandonedDeduction += deduct;
        score -= deduct;
      }
      continue;
    }

    // Renewal proximity — only for marks with an expiration date
    if (tm.expiration_date) {
      const expiry = new Date(tm.expiration_date);
      const expiryMs = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
      const daysUntilExpiry = Math.floor((expiryMs - todayMs) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 30) {
        score -= 25; // < 30 days: critical
      } else if (daysUntilExpiry < 90) {
        score -= 15; // 30–90 days: warning
      }
    }
  }

  // Floor at 0 — never go negative
  return Math.max(0, score);
}

/** Human-readable label for a score value */
export function scoreLabel(score: number): "Excellent" | "Good" | "At Risk" | "Critical" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "At Risk";
  return "Critical";
}

/** Tailwind color class for a score value */
export function scoreColor(score: number): string {
  if (score >= 60) return "text-[#16A34A]"; // success green
  if (score >= 40) return "text-[#D97706]"; // warning amber
  return "text-[#DC2626]";                   // danger red
}
