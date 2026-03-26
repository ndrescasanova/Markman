/**
 * Brand health score — pure function, no I/O, no side effects.
 * Phase 1 max: 80 (conflict monitoring not yet live)
 *
 * Returns null when the trademark array is empty — the UI displays
 * "Add your first trademark to see your score" (F-22).
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

export const PHASE1_MAX_SCORE = 80;

export function computeBrandHealthScore(
  trademarks: ScoredTrademark[]
): number | null {
  if (trademarks.length === 0) return null;

  let score = PHASE1_MAX_SCORE;
  // Use UTC midnight for consistent day-boundary calculations across timezones
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  // Track total deduction from ABANDONED marks (cap at -40)
  let abandonedDeduction = 0;

  for (const tm of trademarks) {
    // ABANDONED: -20 each, max -40 total
    if (tm.status === "ABANDONED" || tm.status === "CANCELLED") {
      if (abandonedDeduction < 40) {
        const deduct = Math.min(20, 40 - abandonedDeduction);
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
        score -= 20; // < 30 days: critical
      } else if (daysUntilExpiry < 90) {
        score -= 10; // 30-90 days: warning
      }
    }
  }

  // Floor at 0 — never go negative
  return Math.max(0, score);
}

/** Human-readable label for a score value */
export function scoreLabel(score: number): "Excellent" | "Good" | "At Risk" | "Critical" {
  if (score >= 70) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 30) return "At Risk";
  return "Critical";
}

/** Tailwind color class for a score value */
export function scoreColor(score: number): string {
  if (score >= 70) return "text-[#16A34A]"; // success green
  if (score >= 50) return "text-[#D97706]"; // warning amber
  return "text-[#DC2626]";                   // danger red
}
