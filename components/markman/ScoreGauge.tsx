"use client";

import { scoreLabel, scoreColor } from "@/lib/brand-health/score";

interface Props {
  score: number | null;
}

/**
 * Arc gauge widget — SVG semi-circle per DESIGN.md spec.
 * Null score → "Add your first trademark to see your score"
 */
export function ScoreGauge({ score }: Props) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-32 h-16 rounded-t-full border-4 border-[#E5E7EB] border-b-0 mb-4" />
        <p className="text-sm text-[#6B7280]">Add your first trademark to see your score</p>
      </div>
    );
  }

  const label = scoreLabel(score);
  const colorClass = scoreColor(score);

  // SVG arc — semi-circle from left to right
  // Score 0 = all gray, score 80 = full arc
  const RADIUS = 80;
  const STROKE = 12;
  const viewSize = (RADIUS + STROKE) * 2;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const circumference = Math.PI * RADIUS; // semi-circle circumference
  const fill = (score / 80) * circumference;
  const gap = circumference - fill;

  // Arc color based on score
  const arcColor =
    score >= 70
      ? "#16A34A"   // success green
      : score >= 50
      ? "#D97706"   // warning amber
      : "#DC2626";  // danger red

  // Semi-circle path: start at left, end at right, going through top
  const startX = cx - RADIUS;
  const startY = cy;
  const endX = cx + RADIUS;
  const endY = cy;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={viewSize}
          height={cy + STROKE}
          viewBox={`0 0 ${viewSize} ${cy + STROKE}`}
          overflow="visible"
        >
          {/* Background track */}
          <path
            d={`M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {/* Score fill */}
          <path
            d={`M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${gap}`}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
        </svg>

        {/* Score number centered below arc */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span
            className={`font-mono text-5xl font-normal leading-none ${colorClass}`}
            style={{ fontFamily: "var(--font-geist-mono, 'Geist Mono')" }}
          >
            {score}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      </div>
    </div>
  );
}
