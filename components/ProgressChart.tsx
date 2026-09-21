import type { SeriesPoint } from "@/lib/history";
import type { Unit } from "@/lib/types";

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function ProgressChart({ points, unit }: { points: SeriesPoint[]; unit: Unit }) {
  if (points.length === 0) return null;

  const weights = points.map((p) => p.maxKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? PAD_X + plotWidth / 2 : PAD_X + (i / (points.length - 1)) * plotWidth;
    const y = PAD_TOP + (1 - (p.maxKg - min) / range) * plotHeight;
    return { x, y, point: p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${PAD_TOP + plotHeight} L${coords[0].x.toFixed(1)},${PAD_TOP + plotHeight} Z`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="progress-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartFill)" />
      <path d={linePath} fill="none" stroke="url(#chartLine)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3.2} fill="var(--bg)" stroke="var(--accent-2)" strokeWidth={2} />
      ))}
      <text x={PAD_X} y={HEIGHT - 8} className="chart-label" textAnchor="start">
        {formatDate(points[0].date)}
      </text>
      <text x={WIDTH - PAD_X} y={HEIGHT - 8} className="chart-label" textAnchor="end">
        {formatDate(points[points.length - 1].date)}
      </text>
      <text x={PAD_X} y={PAD_TOP + 2} className="chart-label" textAnchor="start">
        {max}
        {unit}
      </text>
      {min !== max && (
        <text x={PAD_X} y={PAD_TOP + plotHeight} className="chart-label" textAnchor="start">
          {min}
          {unit}
        </text>
      )}
    </svg>
  );
}
