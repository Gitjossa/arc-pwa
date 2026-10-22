"use client";

import { useState } from "react";
import type { SeriesPoint } from "@/lib/history";
import type { Unit } from "@/lib/types";

const WIDTH = 320;
const HEIGHT = 150;
const PAD_X = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function ProgressChart({ points, unit }: { points: SeriesPoint[]; unit: Unit }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (points.length === 0) return null;

  if (points.length === 1) {
    return (
      <p className="chart-empty">
        Nog maar één meting:{" "}
        <b>
          {points[0].maxKg}
          {unit}
        </b>{" "}
        op {formatDate(points[0].date)}. Na je volgende sessie verschijnt hier je grafiek.
      </p>
    );
  }

  const weights = points.map((p) => p.maxKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const prIndex = weights.lastIndexOf(max);

  const plotWidth = WIDTH - PAD_X - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // X follows real calendar time, so the whole span from the first to the last logged set is visible.
  const t0 = new Date(points[0].date).getTime();
  const span = new Date(points[points.length - 1].date).getTime() - t0;
  const coords = points.map((p, i) => {
    const frac = span > 0 ? (new Date(p.date).getTime() - t0) / span : i / (points.length - 1);
    return { x: PAD_X + frac * plotWidth, y: PAD_TOP + (1 - (p.maxKg - min) / range) * plotHeight };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const baseline = PAD_TOP + plotHeight;
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`;
  const active = selected ?? points.length - 1;
  const mid = (min + max) / 2;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="progress-chart">
        <defs>
          <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[max, mid, min].map((v, i) => {
          const y = PAD_TOP + (1 - (v - min) / range) * plotHeight;
          return (
            <g key={i}>
              <line x1={PAD_X} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="var(--card-border)" strokeDasharray="3 4" />
              <text x={PAD_X - 6} y={y + 4} className="chart-label" textAnchor="end">
                {Math.round(v * 10) / 10}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#chartFill)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <g key={i} onClick={() => setSelected(i)} style={{ cursor: "pointer" }}>
            <circle cx={c.x} cy={c.y} r={14} fill="transparent" />
            <circle
              cx={c.x}
              cy={c.y}
              r={i === active ? 5.5 : 3.6}
              fill={i === prIndex ? "var(--pop)" : "var(--bg)"}
              stroke={i === prIndex ? "var(--pop)" : "var(--accent)"}
              strokeWidth={2}
            />
          </g>
        ))}
        <text x={PAD_X} y={HEIGHT - 6} className="chart-label" textAnchor="start">
          {formatDate(points[0].date)}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} className="chart-label" textAnchor="end">
          {formatDate(points[points.length - 1].date)}
        </text>
      </svg>
      <p className="chart-readout">
        {formatDate(points[active].date)} ·{" "}
        <b>
          {points[active].maxKg}
          {unit}
        </b>
        {active === prIndex && <span className="chart-pr"> PR</span>}
        <span className="chart-hint"> — tik op een punt voor details</span>
      </p>
    </div>
  );
}
