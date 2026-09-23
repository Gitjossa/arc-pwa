"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { currentStreakWeeks, personalRecords } from "@/lib/history";
import {
  addDraftSet,
  addSessionExercise,
  commitSetField,
  finishWorkout,
  getRecord,
  getServerSnapshot,
  getSnapshot,
  hideSessionExercise,
  removeDraftSet,
  removeSessionExercise,
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

  const day = days[Math.min(activeDay, days.length - 1)];
  const extras = data.sessionExtras[day.id] ?? [];
  const extraIds = new Set(extras.map((e) => e.id));
  const hiddenIds = new Set(data.sessionHidden[day.id] ?? []);
  const visibleSchemaExercises = day.exercises.filter((ex) => !hiddenIds.has(ex.id));
  const allExercises = [...visibleSchemaExercises, ...extras];
  const doneCount = allExercises.filter((ex) => getRecord(data.draft, day.id, ex).done).length;
  const total = allExercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const unit = data.settings.unit;

  function handleFinish() {
    const audio = new Audio("/sfx-letsgo.mp3");
    audio.play().catch(() => {
      // autoplay blocked or unsupported — the visual celebration still plays
    });
    setCelebrating(true);
    const session = finishWorkout(day);
    if (session) {
      const newPrNames = session.exercises
        .filter((ex) => {
          const weights = ex.sets.map((s) => Number(s.kg)).filter((w) => !Number.isNaN(w));
          const sessionBest = weights.length ? Math.max(...weights) : 0;
          return sessionBest > (records.get(ex.exerciseId)?.weight ?? 0);
        })
        .map((ex) => ex.name);
      const streakWeeks = currentStreakWeeks([session, ...data.history]);
      setTimeout(() => {
        setShareSession(session);
        setSharePrNames(newPrNames);
        setShareStreakWeeks(streakWeeks);
      }, 1900);
    }
    setTimeout(() => setCelebrating(false), 1900);
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
        <h1>Trainingslog</h1>
        <span className="active-day-tag">{dayLabel(day)}</span>
      </div>
      <p className="subtitle">{day.name} — tik af, log gewicht, bouw op</p>

      <div className="plate-row">
        {days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className={`plate${i === activeDay ? " active" : ""}`}
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
          <Link href="/schema">Voeg oefeningen toe aan je schema</Link>, of voeg er hieronder één toe
          voor vandaag.
        </p>
      )}

      {total > 0 && (
        <>
          <div className="segments">
            {allExercises.map((ex) => {
              const rec = getRecord(data.draft, day.id, ex);
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
              const rec = getRecord(data.draft, day.id, exercise);
              const lastFilled = rec.sets.filter((s) => s.reps && s.kg);
              const historicalBest = records.get(exercise.libraryId)?.weight ?? 0;
              const filledWeights = rec.sets
                .map((s) => (s.kg ? Number(s.kg) : null))
                .filter((w): w is number => w !== null);
              const sessionBest = filledWeights.length ? Math.max(...filledWeights) : 0;
              const isNewPr = sessionBest > historicalBest;
              const isExtra = extraIds.has(exercise.id);

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
                  <div className={`exercise${rec.done ? " done" : ""}`}>
                    <div className="ex-head">
                      <div className="ex-name-block">
                        <div className="ex-name">
                          {exercise.name}
                          {isNewPr && <span className="ex-pr-tag">PR</span>}
                        </div>
                        <div className="ex-last">
                          {lastFilled.length ? (
                            <>
                              vorige keer: <b>{lastFilled.map((s) => `${s.reps}×${s.kg}${unit}`).join(", ")}</b>
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
                        const weight = setRec.kg ? Number(setRec.kg) : null;
                        const isPr = isNewPr && weight !== null && weight === sessionBest;
                        return (
                          <div className={`set-row${isPr ? " is-pr" : ""}`} key={setIdx}>
                            <div className="set-num">{setIdx + 1}.</div>
                            <RepsInput
                              resetKey={resetKey}
                              value={setRec.reps}
                              onCommit={(v) => commitSetField(day.id, exercise, setIdx, "reps", v)}
                            />
                            <KgInput
                              resetKey={resetKey}
                              unit={unit}
                              placeholder={setRec.kg || unit}
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
                </SwipeToSkip>
              );
            })}
          </div>
        </>
      )}

      <ExerciseAutocomplete
        library={data.library}
        value={newExerciseName}
        onChange={setNewExerciseName}
        onSubmit={handleAddExercise}
        placeholder="Oefening toevoegen voor vandaag..."
      />

      {total > 0 && (
        <div className="actions">
          <button
            type="button"
            className="finish-btn"
            onClick={handleFinish}
            disabled={doneCount === 0}
          >
            Workout afronden &amp; opslaan in historie
          </button>
        </div>
      )}

      <p className="note">
        Gewicht en reps worden lokaal op dit toestel onthouden als richtlijn voor je volgende
        sessie.
      </p>
    </div>
  );
}
