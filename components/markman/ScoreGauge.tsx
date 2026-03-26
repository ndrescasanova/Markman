"use client";

import { scoreLabel } from "@/lib/brand-health/score";

interface Props {
  score: number | null;
  /** Compact mode — smaller SVG, used inline in strips */
  compact?: boolean;
}

/**
 * Arc gauge — SVG semi-circle per DESIGN.md spec.
 * Score number overlaid INSIDE the arc, 52px Instrument Sans 600.
 * Null score → "Add your first trademark to see your score"
 *
 * Color thresholds:
 *   ≥80 → Success green  #16A34A
 *   50–79 → Warning amber #D97706
 *   <50  → Danger red    #DC2626
 */
export function ScoreGauge({ score, compact = false }: Props) {
  // Empty state
  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
        <svg width="180" height="90" viewBox="0 0 180 90" fill="none">
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            stroke="#E5E7EB"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-[13px] text-[#9CA3AF] -mt-4">
          Add your first trademark to see your score
        </p>
      </div>
    );
  }

  const label = scoreLabel(score);

  // Color by score (DESIGN.md thresholds)
  const arcColor =
    score >= 80 ? "#16A34A" :
    score >= 50 ? "#D97706" :
    "#DC2626";

  const textColor =
    score >= 80 ? "#16A34A" :
    score >= 50 ? "#D97706" :
    "#DC2626";

  // SVG dimensions — per DESIGN.md: 200px wide, 110px height
  const W = compact ? 160 : 200;
  const H = compact ? 88 : 110;
  const cx = W / 2;
  const cy = H - 10; // arc baseline a bit above the SVG bottom
  const R = cx - 12; // radius fits inside width with padding

  const STROKE = compact ? 9 : 11;

  // Circumference of a semi-circle
  const circumference = Math.PI * R;
  const fill = Math.min(1, Math.max(0, score / 100)) * circumference;
  const gap = circumference - fill;

  // Arc path: left → top → right
  const x0 = cx - R;
  const x1 = cx + R;
  const y = cy;

  // Score number: font size scales with compact mode
  const scoreSize = compact ? 40 : 52;
  // Position score visually centered inside arc — y above the baseline
  const scoreY = cy - 6;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: W, height: H }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          aria-label={`Brand health score: ${score} out of 100`}
          role="img"
        >
          {/* Track */}
          <path
            d={`M ${x0} ${y} A ${R} ${R} 0 0 1 ${x1} ${y}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={`M ${x0} ${y} A ${R} ${R} 0 0 1 ${x1} ${y}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${gap}`}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
          {/* Score number — inside arc */}
          <text
            x={cx}
            y={scoreY}
            textAnchor="middle"
            dominantBaseline="auto"
            fontSize={scoreSize}
            fontWeight={600}
            letterSpacing="-0.04em"
            fill={textColor}
            fontFamily="var(--font-instrument-sans, 'Instrument Sans'), -apple-system, sans-serif"
          >
            {score}
          </text>
        </svg>
      </div>

      {/* Label below gauge */}
      <div className="mt-1 text-center">
        <p className="text-[13px] text-[#6B7280] font-[500]">
          Brand Health Score
        </p>
        <p
          className="text-[13px] font-[500] mt-0.5"
          style={{ color: textColor }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
