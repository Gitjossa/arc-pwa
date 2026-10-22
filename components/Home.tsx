"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { backupReminder } from "@/lib/backup";
import { countdownProgress } from "@/lib/countdown";
import { todayIso } from "@/lib/date";
import { currentStreakWeeks, sessionDates, thisWeekVolume } from "@/lib/history";
import { getServerSnapshot, getSnapshot, snoozeBackupReminder, subscribe } from "@/lib/store";
import type { DayDef, WorkoutSession } from "@/lib/types";
import { SettingsIcon } from "./icons";

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

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgoLabel(dateIso: string): string {
  const diff = Math.round(
    (new Date(todayIso() + "T00:00:00").getTime() - new Date(dateIso + "T00:00:00").getTime()) / 86400000,
  );
  if (diff <= 0) return "vandaag";
  if (diff === 1) return "gisteren";
  return `${diff} dagen geleden`;
}

/** The day after the most recently trained one in the schema's order. */
function nextDay(days: DayDef[], history: WorkoutSession[]): DayDef | undefined {
  if (days.length === 0) return undefined;
  const last = history[0];
  const idx = last ? days.findIndex((d) => d.id === last.dayId) : -1;
  return days[(idx + 1) % days.length];
}

const WEEKDAYS = ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"];

export default function Home() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { history } = data;
  const days = data.program.days;
  const streak = useMemo(() => currentStreakWeeks(history), [history]);
  const volume = useMemo(() => thisWeekVolume(history), [history]);
  const trained = useMemo(() => sessionDates(history), [history]);
  const countdown = useMemo(
    () => countdownProgress(data.settings.countdownStart, data.settings.countdownEnd),
    [data.settings.countdownStart, data.settings.countdownEnd],
  );
  const runningDay = days.find((d) => d.id === data.activeWorkout?.dayId);
  const upcoming = nextDay(days, history);
  const lastOfUpcoming = upcoming ? history.find((s) => s.dayId === upcoming.id) : undefined;
  const backup = backupReminder(data);

  const today = todayIso();
  const monday = new Date(today + "T00:00:00");
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = WEEKDAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, num: d.getDate(), iso: iso(d) };
  });

  return (
    <div className="wrap home-wrap">
      <Link href="/instellingen" className="home-settings-btn" aria-label="Instellingen">
        <SettingsIcon active />
      </Link>
      <div className="home-header">
        <p className="home-greeting">{greeting()}</p>
        <h1>Klaar om te trainen?</h1>
      </div>

      {backup.due && (
        <div className="backup-banner">
          <div className="backup-text">
            <b>Tijd voor je maandelijkse back-up</b>
            <span>
              {backup.daysSince !== null
                ? `Je laatste back-up is ${backup.daysSince} dagen oud.`
                : "Je data staat alleen op dit toestel."}
            </span>
          </div>
          <div className="backup-actions">
            <Link href="/instellingen" className="backup-primary">
              Exporteer
            </Link>
            <button type="button" onClick={() => snoozeBackupReminder(7)}>
              Later
            </button>
          </div>
        </div>
      )}

      {runningDay ? (
        <Link href="/vandaag" className="next-card running">
          <div>
            <div className="next-label">Workout bezig</div>
            <div className="next-name">{runningDay.name}</div>
            <div className="next-meta">Ga verder waar je gebleven was</div>
          </div>
          <span className="next-play">&#9654;</span>
        </Link>
      ) : upcoming ? (
        <Link href={`/vandaag?day=${upcoming.id}`} className="next-card">
          <div>
            <div className="next-label">Volgende workout</div>
            <div className="next-name">{upcoming.name}</div>
            <div className="next-meta">
              {lastOfUpcoming ? `Laatst gedaan ${daysAgoLabel(lastOfUpcoming.date)}` : "Nog niet eerder gedaan"}
            </div>
          </div>
          <span className="next-play">&#9654;</span>
        </Link>
      ) : null}

      <div className="week-card">
        <div className="week-title">Deze week</div>
        <div className="week-strip">
          {week.map((d) => (
            <div key={d.iso} className="week-day">
              <span className="week-label">{d.label}</span>
              <span
                className={`week-num${trained.has(d.iso) ? " trained" : ""}${d.iso === today ? " today" : ""}`}
              >
                {d.num}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">{streak === 1 ? "week" : "weken"} op rij</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{Math.round(volume.current).toLocaleString("nl-NL")}</div>
          <div className="stat-label">{data.settings.unit} deze week</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">sessies totaal</div>
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
        <>
          <h2 className="section-title">Alle workouts</h2>
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
        </>
      )}
    </div>
  );
}
