import { describe, it, expect } from "vitest";
import { computeBrandHealthScore, MAX_SCORE } from "./score";

/**
 * Score system (0-100 scale):
 *   Start: 100
 *   ABANDONED/CANCELLED: -25 each, cap at -50 total (2 marks)
 *   Renewal < 30 days:   -25
 *   Renewal 30–90 days:  -15
 *   Floor: 0
 */

// Helpers to generate expiry dates relative to today (UTC, consistent with score function)
function daysFromNow(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
}

describe("computeBrandHealthScore", () => {
  // ── Edge cases ─────────────────────────────────────────────

  it("returns null for empty trademark array (no score yet)", () => {
    expect(computeBrandHealthScore([])).toBeNull();
  });

  it("returns 100 for a single registered mark with expiry far away (no deductions)", () => {
    const result = computeBrandHealthScore([
      { status: "REGISTERED", expiration_date: daysFromNow(365) },
    ]);
    expect(result).toBe(MAX_SCORE); // 100
  });

  it("returns 100 for a PENDING mark (no expiry, no deductions)", () => {
    expect(
      computeBrandHealthScore([{ status: "PENDING", expiration_date: null }])
    ).toBe(MAX_SCORE); // 100
  });

  // ── ABANDONED deductions (-25 each, cap -50) ───────────────

  it("deducts 25 for a single ABANDONED mark", () => {
    expect(
      computeBrandHealthScore([{ status: "ABANDONED", expiration_date: null }])
    ).toBe(75); // 100 - 25
  });

  it("deducts 50 for two ABANDONED marks", () => {
    expect(
      computeBrandHealthScore([
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
      ])
    ).toBe(50); // 100 - 25 - 25
  });

  it("caps ABANDONED deduction at -50 even with three ABANDONED marks", () => {
    expect(
      computeBrandHealthScore([
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
      ])
    ).toBe(50); // 100 - 25 - 25, third mark capped
  });

  it("treats CANCELLED the same as ABANDONED (deducts 25)", () => {
    expect(
      computeBrandHealthScore([{ status: "CANCELLED", expiration_date: null }])
    ).toBe(75); // 100 - 25
  });

  it("caps combined ABANDONED + CANCELLED deduction at -50", () => {
    expect(
      computeBrandHealthScore([
        { status: "ABANDONED", expiration_date: null },
        { status: "CANCELLED", expiration_date: null },
        { status: "CANCELLED", expiration_date: null },
      ])
    ).toBe(50); // capped at -50
  });

  // ── Renewal proximity deductions ─────────────────────────

  it("deducts 25 for a mark expiring in 10 days (< 30 days: critical)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(10) },
      ])
    ).toBe(75); // 100 - 25
  });

  it("deducts 25 for a mark expiring in 29 days (< 30 days boundary: critical)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(29) },
      ])
    ).toBe(75); // 100 - 25
  });

  it("deducts 15 for a mark expiring in 30 days (30-90 days: warning)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(30) },
      ])
    ).toBe(85); // 100 - 15
  });

  it("deducts 15 for a mark expiring in 89 days (within 90-day window)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(89) },
      ])
    ).toBe(85); // 100 - 15
  });

  it("does NOT deduct for a mark expiring in exactly 90 days", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(90) },
      ])
    ).toBe(MAX_SCORE); // 100 — no deduction at exactly 90 days
  });

  it("does NOT deduct for a mark expiring in 91+ days", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(200) },
      ])
    ).toBe(MAX_SCORE); // 100
  });

  it("deducts renewal for PENDING mark with expiry set (defensive handling)", () => {
    // PENDING marks shouldn't normally have expiry, but handle defensively
    expect(
      computeBrandHealthScore([
        { status: "PENDING", expiration_date: daysFromNow(10) },
      ])
    ).toBe(75); // PENDING is not ABANDONED/CANCELLED, but expiry check still applies
  });

  // ── Floor ─────────────────────────────────────────────────

  it("caps at 0 — never goes negative", () => {
    const result = computeBrandHealthScore([
      { status: "ABANDONED", expiration_date: null },   // -25 → 75
      { status: "ABANDONED", expiration_date: null },   // -25 → 50 (cap reached)
      { status: "REGISTERED", expiration_date: daysFromNow(5) },   // -25 → 25
      { status: "REGISTERED", expiration_date: daysFromNow(10) },  // -25 → 0
      { status: "REGISTERED", expiration_date: daysFromNow(45) },  // -15 → would be -15
    ]);
    expect(result).toBe(0);
    expect(result).not.toBeLessThan(0);
  });

  it("never exceeds 100 (even with perfect portfolio)", () => {
    const result = computeBrandHealthScore([
      { status: "REGISTERED", expiration_date: daysFromNow(200) },
      { status: "REGISTERED", expiration_date: daysFromNow(300) },
    ]);
    expect(result).toBe(MAX_SCORE); // 100
    expect(result).not.toBeGreaterThan(MAX_SCORE);
  });

  // ── Combined deductions ───────────────────────────────────

  it("combines ABANDONED + renewal deductions correctly", () => {
    const result = computeBrandHealthScore([
      { status: "ABANDONED", expiration_date: null },           // -25 → 75
      { status: "REGISTERED", expiration_date: daysFromNow(15) }, // -25 → 50
    ]);
    expect(result).toBe(50);
  });

  it("handles mixed portfolio: PENDING + REGISTERED + expiry far away = no deductions", () => {
    expect(
      computeBrandHealthScore([
        { status: "PENDING", expiration_date: null },
        { status: "REGISTERED", expiration_date: daysFromNow(180) },
        { status: "REGISTERED", expiration_date: daysFromNow(365) },
      ])
    ).toBe(MAX_SCORE); // 100
  });

  it("deducts 15 each for two marks in 30-90d window (two independent deductions)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(45) }, // -15 → 85
        { status: "REGISTERED", expiration_date: daysFromNow(60) }, // -15 → 70
      ])
    ).toBe(70);
  });

  // ── Determinism ───────────────────────────────────────────

  it("returns the same score when called twice with the same input (pure function)", () => {
    const trademarks = [
      { status: "REGISTERED" as const, expiration_date: daysFromNow(45) },
      { status: "ABANDONED" as const, expiration_date: null },
    ];
    expect(computeBrandHealthScore(trademarks)).toBe(
      computeBrandHealthScore(trademarks)
    );
  });

  // ── UNKNOWN / OFFICE_ACTION ───────────────────────────────

  it("does not deduct for UNKNOWN status (no expiry)", () => {
    expect(
      computeBrandHealthScore([{ status: "UNKNOWN", expiration_date: null }])
    ).toBe(MAX_SCORE); // 100
  });

  it("does not deduct for OFFICE_ACTION status (no expiry)", () => {
    expect(
      computeBrandHealthScore([{ status: "OFFICE_ACTION", expiration_date: null }])
    ).toBe(MAX_SCORE); // 100 — office actions are tracked but not penalized in Phase 1
  });
});
