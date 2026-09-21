"use client";

import { useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { exerciseSeries, listLoggedExercises } from "@/lib/history";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";
import ProgressChart from "./ProgressChart";

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

export default function HistoryView() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { history, settings } = data;
  const exerciseOptions = useMemo(() => listLoggedExercises(history), [history]);
  const [selected, setSelected] = useState<string>("");

  const activeExerciseId = selected || exerciseOptions[0]?.id || "";
  const series = activeExerciseId ? exerciseSeries(history, activeExerciseId) : [];

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
      <p className="subtitle">Voortgang per oefening en je afgeronde sessies.</p>

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
          {series.length > 0 ? (
            <ProgressChart points={series} unit={settings.unit} />
          ) : (
            <p className="empty-state small">Geen gewicht gelogd voor deze oefening.</p>
          )}
        </div>
      )}

      <h2 className="section-title">Sessies</h2>
      <div className="session-list">
        {history.map((session) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
