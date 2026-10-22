"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  beatsRecord,
  bestSetOf,
  currentStreakWeeks,
  lastPerformance,
  personalRecords,
  prNamesForSession,
} from "@/lib/history";
import {
  addDraftSet,
  addSessionExercise,
  cancelWorkout,
  commitSetField,
  finishWorkout,
  getRecord,
  getServerSnapshot,
  getSnapshot,
  getSuggestion,
  hideSessionExercise,
  removeDraftSet,
  removeSessionExercise,
  setExerciseCollapsed,
  startWorkout,
  subscribe,
  toggleDone,
} from "@/lib/store";
import type { DayDef, WorkoutSession } from "@/lib/types";
import ExerciseAutocomplete from "./ExerciseAutocomplete";
import FinishCelebration from "./FinishCelebration";
import { KgInput, RepsInput } from "./SetInputs";
import ShareCardModal from "./ShareCardModal";
import SwipeToSkip from "./SwipeToSkip";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12.5L9.5 18L20 6"
        stroke="#08090a"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function dayLabel(day: DayDef): string {
  return day.name.trim().charAt(0).toUpperCase() || "?";
}

export default function WorkoutTracker() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const days = data.program.days;
  const searchParams = useSearchParams();
  const requestedDayId = searchParams.get("day");
  const [activeDay, setActiveDay] = useState(() => {
    const idx = days.findIndex((d) => d.id === requestedDayId);
    return idx >= 0 ? idx : 0;
  });
  const records = useMemo(() => personalRecords(data.history), [data.history]);
  const [celebrating, setCelebrating] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [shareSession, setShareSession] = useState<WorkoutSession | null>(null);
  const [sharePrNames, setSharePrNames] = useState<string[]>([]);
  const [shareStreakWeeks, setShareStreakWeeks] = useState(0);

  if (days.length === 0) {
    return (
      <div className="wrap">
        <div className="brand-row">
          <h1>Trainingslog</h1>
        </div>
        <p className="empty-state">
          Je hebt nog geen trainingsdagen ingesteld.
          <br />
          <Link href="/schema">Stel je schema samen &rarr;</Link>
        </p>
      </div>
    );
  }

  // While a workout is running the tracker is locked to that day.
  const active = data.activeWorkout ?? null;
  const activeIdx = active ? days.findIndex((d) => d.id === active.dayId) : -1;
  const isActive = active !== null && activeIdx >= 0;
  const dayIdx = isActive ? activeIdx : Math.min(activeDay, days.length - 1);
  const day = days[dayIdx];
  const collapsedIds = new Set(isActive && active ? active.collapsed : []);

  const extras = data.sessionExtras[day.id] ?? [];
  const extraIds = new Set(extras.map((e) => e.id));
  const hiddenIds = new Set(data.sessionHidden[day.id] ?? []);
  const visibleSchemaExercises = day.exercises.filter((ex) => !hiddenIds.has(ex.id));
  const allExercises = isActive ? [...visibleSchemaExercises, ...extras] : day.exercises;
  const doneCount = allExercises.filter((ex) => getRecord(data, day.id, ex).done).length;
  const total = allExercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const unit = data.settings.unit;
  const canFinish = allExercises.some((ex) =>
    getRecord(data, day.id, ex).sets.some((s) => s.reps && s.kg),
  );

  function handleFinish() {
    const audio = new Audio("/sfx-letsgo.mp3");
    audio.play().catch(() => {
      // autoplay blocked or unsupported — the visual celebration still plays
    });
    setCelebrating(true);
    const session = finishWorkout(day);
    if (session) {
      const history = [session, ...data.history];
      const newPrNames = prNamesForSession(history, session);
      const streakWeeks = currentStreakWeeks(history);
      setTimeout(() => {
        setShareSession(session);
        setSharePrNames(newPrNames);
        setShareStreakWeeks(streakWeeks);
      }, 1900);
    }
    setTimeout(() => setCelebrating(false), 1900);
  }

  function handleCancel() {
    if (
      confirm(
        "Workout annuleren? Alles wat je in deze sessie hebt ingevuld wordt weggegooid. Je historie blijft bewaard.",
      )
    ) {
      cancelWorkout();
    }
  }

  function handleAddExercise() {
    const name = newExerciseName.trim();
    if (!name) return;
    addSessionExercise(day.id, name);
    setNewExerciseName("");
  }

  return (
    <div className="wrap">
      <FinishCelebration show={celebrating} />
      {shareSession && (
        <ShareCardModal
          session={shareSession}
          unit={unit}
          newPrNames={sharePrNames}
          streakWeeks={shareStreakWeeks}
          onClose={() => setShareSession(null)}
        />
      )}
      <div className="brand-row">
        <h1>{isActive ? "Workout" : "Start"}</h1>
        <span className="active-day-tag">{dayLabel(day)}</span>
      </div>
      <p className="subtitle">
        {isActive ? `${day.name} — workout bezig, log je sets` : `${day.name} — kies je dag en start je workout`}
      </p>

      <div className="plate-row">
        {days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className={`plate${i === dayIdx ? " active" : ""}${isActive && i !== dayIdx ? " locked" : ""}`}
            disabled={isActive && i !== dayIdx}
            onClick={() => setActiveDay(i)}
          >
            <div className="plate-ring">{dayLabel(d)}</div>
            <div className="plate-day">{d.name}</div>
          </button>
        ))}
      </div>

      {total === 0 && (
        <p className="empty-state">
          {day.exercises.length > 0
            ? "Je hebt alle oefeningen van vandaag overgeslagen."
            : "Deze dag heeft nog geen oefeningen."}
          <br />
          <Link href="/schema">Voeg oefeningen toe aan je schema</Link>
          {isActive ? ", of voeg er hieronder één toe voor vandaag." : "."}
        </p>
      )}

      {!isActive && total > 0 && (
        <>
          <button type="button" className="begin-workout-btn begin-top" onClick={() => startWorkout(day.id)}>
            &#9654; Start workout
          </button>
          <div className="preview-list">
            {day.exercises.map((exercise) => {
              const last = lastPerformance(data.history, exercise.libraryId);
              return (
                <div key={exercise.id} className="exercise-preview">
                  <div className="exercise-preview-name">{exercise.name}</div>
                  <div className="exercise-preview-meta">
                    {last
                      ? `vorige keer: ${last.map((s) => `${s.reps}×${s.kg}${unit}`).join(", ")}`
                      : `${exercise.sets} sets × ${exercise.targetReps} reps`}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {isActive && total > 0 && (
        <>
          <div className="segments">
            {allExercises.map((ex) => {
              const rec = getRecord(data, day.id, ex);
              return <div key={ex.id} className={`segment${rec.done ? " filled" : ""}`} />;
            })}
          </div>
          <div className="progress-caption">
            <span>
              {doneCount}/{total} gedaan
            </span>
            <span>{pct}%</span>
          </div>

          <div>
            {allExercises.map((exercise) => {
              const rec = getRecord(data, day.id, exercise);
              const last = lastPerformance(data.history, exercise.libraryId);
              const typedSets = rec.sets.filter((s) => s.reps && s.kg);
              const best = bestSetOf(rec.sets);
              const isNewPr = best !== null && beatsRecord(best.weight, best.reps, records.get(exercise.libraryId));
              const prSetIdx = isNewPr && best ? best.index : -1;
              const isExtra = extraIds.has(exercise.id);
              const isCollapsed = collapsedIds.has(exercise.id);

              return (
                <SwipeToSkip
                  key={`${day.id}-${exercise.id}`}
                  label="Overslaan"
                  onSkip={() =>
                    isExtra
                      ? removeSessionExercise(day.id, exercise.id)
                      : hideSessionExercise(day.id, exercise.id)
                  }
                >
                  {isCollapsed ? (
                    <div
                      className="exercise exercise-collapsed done"
                      role="button"
                      tabIndex={0}
                      onClick={() => setExerciseCollapsed(day.id, exercise.id, false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExerciseCollapsed(day.id, exercise.id, false);
                        }
                      }}
                    >
                      <div className="ex-collapsed-row">
                        <div
                          className="check"
                          role="checkbox"
                          aria-checked={rec.done}
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDone(day.id, exercise);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleDone(day.id, exercise);
                            }
                          }}
                        >
                          <CheckIcon />
                        </div>
                        <div className="ex-collapsed-info">
                          <span className="ex-collapsed-name">
                            {exercise.name}
                            {isNewPr && <span className="ex-pr-tag">PR</span>}
                          </span>
                          {typedSets.length > 0 && (
                            <span className="ex-collapsed-summary">
                              {typedSets.map((s) => `${s.reps}×${s.kg}${unit}`).join(", ")}
                            </span>
                          )}
                        </div>
                        <span className="ex-collapsed-chevron" aria-hidden="true">
                          &#8964;
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={`exercise${rec.done ? " done" : ""}`}>
                      <div className="ex-head">
                        <div className="ex-name-block">
                          <div className="ex-name">
                            {exercise.name}
                            {isNewPr && <span className="ex-pr-tag">PR</span>}
                          </div>
                          <div className="ex-last">
                            {last ? (
                              <>
                                vorige keer: <b>{last.map((s) => `${s.reps}×${s.kg}${unit}`).join(", ")}</b>
                              </>
                            ) : (
                              " "
                            )}
                          </div>
                        </div>
                        <div
                          className="check"
                          role="checkbox"
                          aria-checked={rec.done}
                          tabIndex={0}
                          onClick={() => toggleDone(day.id, exercise)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleDone(day.id, exercise);
                            }
                          }}
                        >
                          <CheckIcon />
                        </div>
                      </div>

                      <div className="set-rows">
                        {rec.sets.map((setRec, setIdx) => {
                          const resetKey = `${day.id}-${exercise.id}-${setIdx}`;
                          const suggestion = getSuggestion(data.history, exercise, setIdx);
                          const isPr = setIdx === prSetIdx;
                          return (
                            <div className={`set-row${isPr ? " is-pr" : ""}`} key={setIdx}>
                              <div className="set-num">{setIdx + 1}.</div>
                              <RepsInput
                                resetKey={resetKey}
                                value={setRec.reps ?? ""}
                                placeholder={suggestion?.reps ?? exercise.targetReps}
                                onCommit={(v) => commitSetField(day.id, exercise, setIdx, "reps", v)}
                              />
                              <KgInput
                                resetKey={resetKey}
                                unit={unit}
                                value={setRec.kg ?? ""}
                                placeholder={suggestion?.kg ?? unit}
                                onCommit={(v) => commitSetField(day.id, exercise, setIdx, "kg", v)}
                              />
                              {isPr && (
                                <span className="pr-badge" title="Nieuw persoonlijk record">
                                  PR
                                </span>
                              )}
                              {rec.sets.length > 1 && (
                                <button
                                  type="button"
                                  className="set-remove"
                                  aria-label={`Set ${setIdx + 1} verwijderen`}
                                  onClick={() => removeDraftSet(day.id, exercise, setIdx)}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="set-actions">
                        <button
                          type="button"
                          className="add-set-btn"
                          onClick={() => addDraftSet(day.id, exercise)}
                        >
                          + Set toevoegen
                        </button>
                      </div>
                    </div>
                  )}
                </SwipeToSkip>
              );
            })}
          </div>
        </>
      )}

      {isActive && (
        <>
          <ExerciseAutocomplete
            library={data.library}
            value={newExerciseName}
            onChange={setNewExerciseName}
            onSubmit={handleAddExercise}
            placeholder="Oefening toevoegen voor vandaag..."
          />

          <div className="actions">
            <button type="button" className="finish-btn" onClick={handleFinish} disabled={!canFinish}>
              Workout afronden &amp; opslaan in historie
            </button>
          </div>
          <button type="button" className="cancel-workout-btn" onClick={handleCancel}>
            Workout annuleren
          </button>
        </>
      )}

      <p className="note">
        {isActive
          ? "Grijze cijfers zijn je waarden van de vorige keer — vul ze zelf in om te loggen."
          : "Je workout wordt pas gelogd nadat je hem start en afrondt."}
      </p>
    </div>
  );
}
