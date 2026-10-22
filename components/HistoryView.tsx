"use client";

import { useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  currentStreakWeeks,
  exerciseSeries,
  listLoggedExercises,
  personalRecords,
  prNamesForSession,
  sessionDates,
  sessionVolume,
  thisWeekVolume,
} from "@/lib/history";
import {
  deleteHistorySession,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  updateHistorySet,
} from "@/lib/store";
import type { WorkoutSession } from "@/lib/types";
import HistoryCalendar from "./HistoryCalendar";
import ProgressChart from "./ProgressChart";
import ShareCardModal from "./ShareCardModal";

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

function EditableStat({
  value,
  suffix,
  onCommit,
}: {
  value: string;
  suffix: string;
  onCommit: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <div className="hist-edit-field">
      <input
        value={text}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text && text !== value) onCommit(text);
        }}
      />
      <span>{suffix}</span>
    </div>
  );
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
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [shareSession, setShareSession] = useState<WorkoutSession | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(sessionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }

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
        {visibleSessions.map((session) => {
          const isEditing = editingSessionId === session.id;
          const isOpen = isEditing || expandedIds.has(session.id);
          const volumeLabel = Math.round(sessionVolume(session)).toLocaleString("nl-NL");
          return (
            <div key={session.id} className={`session-card${isOpen ? " open" : ""}`}>
              <button
                type="button"
                className="session-toggle"
                aria-expanded={isOpen}
                onClick={() => toggleExpanded(session.id)}
              >
                <span className="session-toggle-main">
                  <span className="session-day">{session.dayName}</span>
                  <span className="session-summary">
                    {session.exercises.length} {session.exercises.length === 1 ? "oefening" : "oefeningen"} ·{" "}
                    {volumeLabel} {settings.unit}
                  </span>
                </span>
                <span className="session-date">{formatDateLong(session.date)}</span>
                <span className="session-chevron" aria-hidden="true">
                  &#8964;
                </span>
              </button>
              {isOpen && (
                <>
                  <div className="session-exercises">
                    {session.exercises.map((ex) =>
                      isEditing ? (
                        <div key={ex.exerciseId} className="session-exercise-edit">
                          <span className="session-exercise-name">{ex.name}</span>
                          <div className="hist-edit-rows">
                            {ex.sets.map((s, setIdx) => (
                              <div className="hist-edit-row" key={setIdx}>
                                <EditableStat
                                  value={s.reps}
                                  suffix="reps"
                                  onCommit={(v) => updateHistorySet(session.id, ex.exerciseId, setIdx, "reps", v)}
                                />
                                <EditableStat
                                  value={s.kg}
                                  suffix={settings.unit}
                                  onCommit={(v) => updateHistorySet(session.id, ex.exerciseId, setIdx, "kg", v)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={ex.exerciseId} className="session-exercise">
                          <span className="session-exercise-name">{ex.name}</span>
                          <span className="session-exercise-sets">
                            {ex.sets.map((s) => `${s.reps}×${s.kg}${settings.unit}`).join(", ")}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-edit-btn"
                      onClick={() => setShareSession(session)}
                      aria-label="Bekijk en deel overzicht"
                    >
                      Delen
                    </button>
                    <button
                      type="button"
                      className="session-edit-btn"
                      onClick={() => setEditingSessionId(isEditing ? null : session.id)}
                    >
                      {isEditing ? "Klaar" : "Bewerken"}
                    </button>
                    <button
                      type="button"
                      className="session-edit-btn session-delete-btn"
                      onClick={() => {
                        if (confirm(`"${session.dayName}" van ${formatDateLong(session.date)} verwijderen?`)) {
                          deleteHistorySession(session.id);
                        }
                      }}
                    >
                      Verwijderen
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {shareSession && (
        <ShareCardModal
          session={shareSession}
          unit={settings.unit}
          newPrNames={prNamesForSession(history, shareSession)}
          streakWeeks={currentStreakWeeks(history, shareSession.date)}
          onClose={() => setShareSession(null)}
        />
      )}
    </div>
  );
}
