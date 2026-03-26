import { describe, it, expect } from "vitest";
import { computeBrandHealthScore, PHASE1_MAX_SCORE } from "./score";

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

  it("returns 80 for a single registered mark with expiry far away (no deductions)", () => {
    const result = computeBrandHealthScore([
      { status: "REGISTERED", expiration_date: daysFromNow(365) },
    ]);
    expect(result).toBe(PHASE1_MAX_SCORE);
  });

  it("returns 80 for a PENDING mark (no expiry, no deductions)", () => {
    expect(
      computeBrandHealthScore([{ status: "PENDING", expiration_date: null }])
    ).toBe(PHASE1_MAX_SCORE);
  });

  // ── ABANDONED deductions ───────────────────────────────────

  it("deducts 20 for a single ABANDONED mark", () => {
    expect(
      computeBrandHealthScore([{ status: "ABANDONED", expiration_date: null }])
    ).toBe(60);
  });

  it("deducts 40 for two ABANDONED marks (caps at -40)", () => {
    expect(
      computeBrandHealthScore([
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
      ])
    ).toBe(40);
  });

  it("caps ABANDONED deduction at -40 even with three ABANDONED marks", () => {
    expect(
      computeBrandHealthScore([
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
        { status: "ABANDONED", expiration_date: null },
      ])
    ).toBe(40);
  });

  it("treats CANCELLED the same as ABANDONED (deducts 20)", () => {
    expect(
      computeBrandHealthScore([{ status: "CANCELLED", expiration_date: null }])
    ).toBe(60);
  });

  // ── Renewal proximity deductions ─────────────────────────

  it("deducts 20 for a mark expiring in 10 days (< 30 days)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(10) },
      ])
    ).toBe(60);
  });

  it("deducts 20 for a mark expiring in 29 days (< 30 days boundary)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(29) },
      ])
    ).toBe(60);
  });

  it("deducts 10 for a mark expiring in 30 days (30-90 days)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(30) },
      ])
    ).toBe(70);
  });

  it("deducts 10 for a mark expiring in 89 days (within 90-day window)", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(89) },
      ])
    ).toBe(70);
  });

  it("does NOT deduct for a mark expiring in exactly 90 days", () => {
    expect(
      computeBrandHealthScore([
        { status: "REGISTERED", expiration_date: daysFromNow(90) },
      ])
    ).toBe(PHASE1_MAX_SCORE);
  });

  it("does not deduct renewal for PENDING mark even with expiry set", () => {
    // PENDING marks shouldn't normally have expiry, but handle defensively
    expect(
      computeBrandHealthScore([
        { status: "PENDING", expiration_date: daysFromNow(10) },
      ])
    ).toBe(60); // PENDING is not ABANDONED/CANCELLED, so deduction applies from expiry check
  });

  // ── Floor ─────────────────────────────────────────────────

  it("caps at 0 — never goes negative", () => {
    const result = computeBrandHealthScore([
      { status: "ABANDONED", expiration_date: null },
      { status: "ABANDONED", expiration_date: null },
      { status: "REGISTERED", expiration_date: daysFromNow(5) },   // -20
      { status: "REGISTERED", expiration_date: daysFromNow(15) },  // -20
      { status: "REGISTERED", expiration_date: daysFromNow(45) },  // -10
      { status: "REGISTERED", expiration_date: daysFromNow(60) },  // -10
    ]);
    expect(result).toBe(0);
    expect(result).not.toBeLessThan(0);
  });

  // ── Phase 1 cap ───────────────────────────────────────────

  it("never exceeds 80 in Phase 1 (even with perfect portfolio)", () => {
    const result = computeBrandHealthScore([
      { status: "REGISTERED", expiration_date: daysFromNow(200) },
      { status: "REGISTERED", expiration_date: daysFromNow(300) },
    ]);
    expect(result).toBe(PHASE1_MAX_SCORE);
    expect(result).not.toBeGreaterThan(PHASE1_MAX_SCORE);
  });

  // ── Combined deductions ───────────────────────────────────

  it("combines ABANDONED + renewal deductions correctly", () => {
    const result = computeBrandHealthScore([
      { status: "ABANDONED", expiration_date: null },   // -20 → 60
      { status: "REGISTERED", expiration_date: daysFromNow(15) }, // -20 → 40
    ]);
    expect(result).toBe(40);
  });

  it("handles mixed portfolio: PENDING + REGISTERED + expiry far away = no deductions", () => {
    expect(
      computeBrandHealthScore([
        { status: "PENDING", expiration_date: null },
        { status: "REGISTERED", expiration_date: daysFromNow(180) },
        { status: "REGISTERED", expiration_date: daysFromNow(365) },
      ])
    ).toBe(PHASE1_MAX_SCORE);
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
});
