import type { HealthBand } from "../domain/models";

interface ScoreRingProps {
  score: number;
  band: HealthBand;
  size?: "card" | "detail";
}

export function ScoreRing({ score, band, size = "card" }: ScoreRingProps) {
  const dimensions = size === "detail" ? 62 : 48;
  const radius = size === "detail" ? 26 : 20;
  const strokeWidth = size === "detail" ? 4 : 3.5;
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
