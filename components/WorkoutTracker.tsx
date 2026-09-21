"use client";

import { useState, useSyncExternalStore } from "react";
import { DAYS, defaultSets, exerciseKey } from "@/lib/days";
import { getServerSnapshot, getSnapshot, setWorkoutState, subscribe } from "@/lib/store";
import type { ExerciseRecord, WorkoutState } from "@/lib/types";
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

function getRecord(state: WorkoutState, dayKey: string, exName: string): ExerciseRecord {
  const key = exerciseKey(dayKey, exName);
  const rec = state[key];
  if (!rec || !Array.isArray(rec.sets)) {
    return { done: rec?.done ?? false, sets: defaultSets().map((s) => ({ ...s })) };
  }
  return {
    done: rec.done,
    sets: rec.sets.map((s) => ({ reps: s.reps || "12", kg: s.kg })),
  };
}

export default function WorkoutTracker() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [activeDay, setActiveDay] = useState(0);

  function toggleDone(dayKey: string, exName: string) {
    setWorkoutState((prev) => {
      const rec = getRecord(prev, dayKey, exName);
      return { ...prev, [exerciseKey(dayKey, exName)]: { ...rec, done: !rec.done } };
    });
  }

  function commitSetField(
    dayKey: string,
    exName: string,
    setIdx: number,
    field: "reps" | "kg",
    value: string,
  ) {
    setWorkoutState((prev) => {
      const rec = getRecord(prev, dayKey, exName);
      const sets = rec.sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
      return { ...prev, [exerciseKey(dayKey, exName)]: { ...rec, sets } };
    });
  }

  function resetDay(dayKey: string) {
    const day = DAYS.find((d) => d.key === dayKey);
    if (!day) return;
    setWorkoutState((prev) => {
      const next = { ...prev };
      day.exercises.forEach((exName) => {
        const rec = getRecord(next, dayKey, exName);
        next[exerciseKey(dayKey, exName)] = { ...rec, done: false };
      });
      return next;
    });
  }

  const day = DAYS[activeDay];
  const doneCount = day.exercises.filter((exName) => getRecord(state, day.key, exName).done).length;
  const total = day.exercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="wrap">
      <div className="brand-row">
        <h1>Trainingslog</h1>
        <span className="active-day-tag">{day.letter}</span>
      </div>
      <p className="subtitle">3x per week full body — tik af, log gewicht, bouw op</p>

      <div className="plate-row">
        {DAYS.map((d, i) => (
          <button
            key={d.key}
            type="button"
            className={`plate${i === activeDay ? " active" : ""}`}
            onClick={() => setActiveDay(i)}
          >
            <div className="plate-ring">{d.letter}</div>
            <div className="plate-day">{d.name}</div>
          </button>
        ))}
      </div>

      <div className="segments">
        {day.exercises.map((exName) => {
          const rec = getRecord(state, day.key, exName);
          return <div key={exName} className={`segment${rec.done ? " filled" : ""}`} />;
        })}
      </div>
      <div className="progress-caption">
        <span>
          {doneCount}/{total} gedaan
        </span>
        <span>{pct}%</span>
      </div>

      <div>
        {day.exercises.map((exName) => {
          const rec = getRecord(state, day.key, exName);
          const lastFilled = rec.sets.filter((s) => s.reps && s.kg);

          return (
            <div key={`${day.key}-${exName}`} className={`exercise${rec.done ? " done" : ""}`}>
              <div className="ex-head">
                <div className="ex-name-block">
                  <div className="ex-name">{exName}</div>
                  <div className="ex-last">
                    {lastFilled.length ? (
                      <>
                        vorige keer:{" "}
                        <b>{lastFilled.map((s) => `${s.reps}×${s.kg}kg`).join(", ")}</b>
                      </>
                    ) : (
                      " "
                    )}
                  </div>
                </div>
                <div
                  className="check"
                  role="checkbox"
                  aria-checked={rec.done}
                  tabIndex={0}
                  onClick={() => toggleDone(day.key, exName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleDone(day.key, exName);
                    }
                  }}
                >
                  <CheckIcon />
                </div>
              </div>

              <div className="set-rows">
                {rec.sets.map((setRec, setIdx) => {
                  const resetKey = `${day.key}-${exName}-${setIdx}`;
                  return (
                    <div className="set-row" key={setIdx}>
                      <div className="set-num">{setIdx + 1}.</div>
                      <RepsInput
                        resetKey={resetKey}
                        value={setRec.reps}
                        onCommit={(v) => commitSetField(day.key, exName, setIdx, "reps", v)}
                      />
                      <KgInput
                        resetKey={resetKey}
                        placeholder={setRec.kg || "kg"}
                        onCommit={(v) => commitSetField(day.key, exName, setIdx, "kg", v)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="actions">
        <button type="button" className="reset-btn" onClick={() => resetDay(day.key)}>
          Vink alles uit voor deze dag
        </button>
      </div>

      <p className="note">
        Gewicht en reps worden lokaal op dit toestel onthouden als richtlijn voor je volgende sessie.
      </p>
    </div>
  );
}
