import type { HealthBand } from "../domain/models";

interface ScoreRingProps {
  score: number;
  band: HealthBand;
  size?: "card" | "detail" | "focus";
}

const RING_DIMENSIONS = { card: 48, detail: 62, focus: 132 } as const;
const RING_RADIUS = { card: 20, detail: 26, focus: 58 } as const;
const RING_STROKE = { card: 3.5, detail: 4, focus: 8 } as const;

export function ScoreRing({ score, band, size = "card" }: ScoreRingProps) {
  const dimensions = RING_DIMENSIONS[size];
  const radius = RING_RADIUS[size];
  const strokeWidth = RING_STROKE[size];
  const center = dimensions / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className={`score-ring score-ring-${size} health-${band}`} aria-label={`Resiliency score ${score}`}>
      <svg width={dimensions} height={dimensions} viewBox={`0 0 ${dimensions} ${dimensions}`} aria-hidden="true">
        <circle className="score-ring-track" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="score-ring-value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span>{score}</span>
    </div>
  );
}
