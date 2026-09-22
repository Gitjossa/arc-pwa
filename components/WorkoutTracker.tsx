"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { personalRecords } from "@/lib/history";
import { haptic } from "@/lib/haptics";
import {
  commitSetField,
  finishWorkout,
  getRecord,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleDone,
} from "@/lib/store";
import type { DayDef, ExerciseDef } from "@/lib/types";
import { KgInput, RepsInput } from "./SetInputs";

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
  const [activeDay, setActiveDay] = useState(0);
  const records = useMemo(() => personalRecords(data.history), [data.history]);

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
  const doneCount = day.exercises.filter((ex) => getRecord(data.draft, day.id, ex).done).length;
  const total = day.exercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const unit = data.settings.unit;

  function handleToggleDone(exercise: ExerciseDef) {
    haptic(12);
    toggleDone(day.id, exercise);
  }

  function handleKgCommit(exercise: ExerciseDef, setIdx: number, value: string) {
    commitSetField(day.id, exercise, setIdx, "kg", value);
    const pr = records.get(exercise.id);
    const isPr = Number(value) > (pr?.weight ?? 0);
    haptic(isPr ? [15, 60, 15, 60, 15] : 10);
  }

  function handleFinish() {
    haptic([10, 40, 10]);
    finishWorkout(day);
  }

  return (
    <div className="wrap">
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

      {total === 0 ? (
        <p className="empty-state">
          Deze dag heeft nog geen oefeningen.
          <br />
          <Link href="/schema">Oefeningen toevoegen &rarr;</Link>
        </p>
      ) : (
        <>
          <div className="segments">
            {day.exercises.map((ex) => {
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
            {day.exercises.map((exercise) => {
              const rec = getRecord(data.draft, day.id, exercise);
              const lastFilled = rec.sets.filter((s) => s.reps && s.kg);
              const pr = records.get(exercise.id);

              return (
                <div
                  key={`${day.id}-${exercise.id}`}
                  className={`exercise${rec.done ? " done" : ""}`}
                >
                  <div className="ex-head">
                    <div className="ex-name-block">
                      <div className="ex-name">{exercise.name}</div>
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
                      onClick={() => handleToggleDone(exercise)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleDone(exercise);
                        }
                      }}
                    >
                      <CheckIcon />
                    </div>
                  </div>

                  <div className="set-rows">
                    {rec.sets.map((setRec, setIdx) => {
                      const resetKey = `${day.id}-${exercise.id}-${setIdx}`;
                      const isPr = Boolean(setRec.kg) && Number(setRec.kg) > (pr?.weight ?? 0);
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
                            onCommit={(v) => handleKgCommit(exercise, setIdx, v)}
                          />
                          {isPr && (
                            <span className="pr-badge" title="Nieuw persoonlijk record">
                              🏆
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

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

          <p className="note">
            Gewicht en reps worden lokaal op dit toestel onthouden als richtlijn voor je volgende
            sessie.
          </p>
        </>
      )}
    </div>
  );
}
