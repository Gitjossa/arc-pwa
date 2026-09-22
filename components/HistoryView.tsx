"use client";

import { useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  currentStreakWeeks,
  exerciseSeries,
  listLoggedExercises,
  personalRecords,
  sessionDates,
  sessionVolume,
  thisWeekVolume,
} from "@/lib/history";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";
import HistoryCalendar from "./HistoryCalendar";
import ProgressChart from "./ProgressChart";

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

function pctChange(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% t.o.v. vorige week`;
}

export default function HistoryView() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { history, settings } = data;
  const exerciseOptions = useMemo(() => listLoggedExercises(history), [history]);
  const [selected, setSelected] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeExerciseId = selected || exerciseOptions[0]?.id || "";
  const series = activeExerciseId ? exerciseSeries(history, activeExerciseId) : [];
  const records = useMemo(() => personalRecords(history), [history]);
  const activePr = activeExerciseId ? records.get(activeExerciseId) : undefined;

  const streak = useMemo(() => currentStreakWeeks(history), [history]);
  const volume = useMemo(() => thisWeekVolume(history), [history]);
  const dates = useMemo(() => sessionDates(history), [history]);
  const volumeChange = pctChange(volume.current, volume.previous);

  const visibleSessions = selectedDate ? history.filter((s) => s.date === selectedDate) : history;

  if (history.length === 0) {
    return (
      <div className="wrap">
        <div className="brand-row">
          <h1>Historie</h1>
        </div>
        <p className="empty-state">
          Nog geen sessies afgerond.
          <br />
          Rond een workout af via &ldquo;Vandaag&rdquo; om hier je voortgang te zien.
        </p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="brand-row">
        <h1>Historie</h1>
      </div>
      <p className="subtitle">Voortgang, records en je afgeronde sessies.</p>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-value">
            {streak} {streak === 1 ? "week" : "weken"}
          </div>
          <div className="stat-label">op rij getraind</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{Math.round(volume.current).toLocaleString("nl-NL")}</div>
          <div className="stat-label">
            {settings.unit} volume deze week
            {volumeChange && <span className="stat-sub">{volumeChange}</span>}
          </div>
        </div>
      </div>

      <HistoryCalendar sessionDates={dates} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {exerciseOptions.length > 0 && (
        <div className="chart-card">
          <select
            className="exercise-select"
            value={activeExerciseId}
            onChange={(e) => setSelected(e.target.value)}
          >
            {exerciseOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          {activePr && (
            <p className="pr-line">
              🏆 PR: <b>{activePr.reps}×{activePr.weight}{settings.unit}</b> op {formatDateLong(activePr.date)}
            </p>
          )}
          {series.length > 0 ? (
            <ProgressChart points={series} unit={settings.unit} />
          ) : (
            <p className="empty-state small">Geen gewicht gelogd voor deze oefening.</p>
          )}
        </div>
      )}

      <h2 className="section-title">Sessies</h2>
      <div className="session-list">
        {visibleSessions.map((session) => (
          <div key={session.id} className="session-card">
            <div className="session-head">
              <span className="session-day">{session.dayName}</span>
              <span className="session-date">{formatDateLong(session.date)}</span>
            </div>
            <div className="session-exercises">
              {session.exercises.map((ex) => (
                <div key={ex.exerciseId} className="session-exercise">
                  <span className="session-exercise-name">{ex.name}</span>
                  <span className="session-exercise-sets">
                    {ex.sets.map((s) => `${s.reps}×${s.kg}${settings.unit}`).join(", ")}
                  </span>
                </div>
              ))}
            </div>
            <div className="session-volume">
              Volume: {Math.round(sessionVolume(session)).toLocaleString("nl-NL")} {settings.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
