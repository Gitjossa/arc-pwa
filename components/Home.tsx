"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { countdownProgress } from "@/lib/countdown";
import { currentStreakWeeks, thisWeekVolume } from "@/lib/history";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";
import type { DayDef } from "@/lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Nog wakker?";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

function dayLabel(day: DayDef): string {
  return day.name.trim().charAt(0).toUpperCase() || "?";
}

export default function Home() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { history } = data;
  const days = data.program.days;
  const streak = useMemo(() => currentStreakWeeks(history), [history]);
  const volume = useMemo(() => thisWeekVolume(history), [history]);
  const countdown = useMemo(
    () => countdownProgress(data.settings.countdownStart, data.settings.countdownEnd),
    [data.settings.countdownStart, data.settings.countdownEnd],
  );

  return (
    <div className="wrap home-wrap">
      <div className="home-header">
        <p className="home-greeting">{greeting()}</p>
        <h1>Klaar om te trainen?</h1>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-value">
            {streak} {streak === 1 ? "week" : "weken"}
          </div>
          <div className="stat-label">op rij getraind</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{Math.round(volume.current).toLocaleString("nl-NL")}</div>
          <div className="stat-label">{data.settings.unit} volume deze week</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">sessies gelogd</div>
        </div>
      </div>

      {data.settings.countdownEnabled && (
        <div className="countdown-card">
          <div className="countdown-head">
            <span className="countdown-title">AYCE-countdown</span>
            <span className="countdown-pct">{countdown.pct}%</span>
          </div>
          <div className="countdown-track">
            <div className="countdown-fill" style={{ width: `${countdown.pct}%` }} />
          </div>
          <p className="countdown-caption">
            {countdown.daysLeft === 0
              ? "Laatste dag!"
              : `Nog ${countdown.daysLeft} ${countdown.daysLeft === 1 ? "dag" : "dagen"} te gaan`}
          </p>
        </div>
      )}

      {days.length === 0 ? (
        <Link href="/schema" className="start-btn">
          Stel je schema samen
        </Link>
      ) : (
        <div className="day-start-list">
          {days.map((day) => (
            <Link key={day.id} href={`/vandaag?day=${day.id}`} className="day-start-btn">
              <span className="day-start-badge">{dayLabel(day)}</span>
              <span className="day-start-name">{day.name}</span>
              <svg viewBox="0 0 24 24" fill="none" className="day-start-arrow">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
