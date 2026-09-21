"use client";

import { useState, useSyncExternalStore } from "react";
import {
  addDay,
  addExercise,
  deleteDay,
  deleteExercise,
  getServerSnapshot,
  getSnapshot,
  moveDay,
  moveExercise,
  renameDay,
  subscribe,
  updateExercise,
} from "@/lib/store";
import type { DayDef } from "@/lib/types";

function ExerciseRow({ dayId, exercise }: { dayId: string; exercise: DayDef["exercises"][number] }) {
  return (
    <div className="ex-row">
      <input
        className="ex-row-name"
        value={exercise.name}
        onChange={(e) => updateExercise(dayId, exercise.id, { name: e.target.value })}
        placeholder="Naam oefening"
      />
      <div className="ex-row-fields">
        <label>
          sets
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={exercise.sets}
            onChange={(e) =>
              updateExercise(dayId, exercise.id, {
                sets: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
              })
            }
          />
        </label>
        <label>
          reps
          <input
            className="reps-target"
            inputMode="numeric"
            value={exercise.targetReps}
            onChange={(e) => updateExercise(dayId, exercise.id, { targetReps: e.target.value })}
          />
        </label>
      </div>
      <div className="row-actions">
        <button type="button" onClick={() => moveExercise(dayId, exercise.id, -1)} aria-label="Omhoog">
          &uarr;
        </button>
        <button type="button" onClick={() => moveExercise(dayId, exercise.id, 1)} aria-label="Omlaag">
          &darr;
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => deleteExercise(dayId, exercise.id)}
          aria-label="Verwijderen"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

function DayCard({ day, index, total }: { day: DayDef; index: number; total: number }) {
  const [newExercise, setNewExercise] = useState("");

  function submitExercise() {
    const name = newExercise.trim();
    if (!name) return;
    addExercise(day.id, name);
    setNewExercise("");
  }

  return (
    <div className="day-card">
      <div className="day-card-head">
        <input
          className="day-name-input"
          value={day.name}
          onChange={(e) => renameDay(day.id, e.target.value)}
          placeholder="Naam trainingsdag"
        />
        <div className="row-actions">
          <button type="button" onClick={() => moveDay(day.id, -1)} disabled={index === 0} aria-label="Dag omhoog">
            &uarr;
          </button>
          <button
            type="button"
            onClick={() => moveDay(day.id, 1)}
            disabled={index === total - 1}
            aria-label="Dag omlaag"
          >
            &darr;
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (confirm(`"${day.name}" verwijderen inclusief oefeningen?`)) deleteDay(day.id);
            }}
            aria-label="Dag verwijderen"
          >
            &times;
          </button>
        </div>
      </div>

      {day.exercises.length > 0 && (
        <div className="ex-list">
          {day.exercises.map((exercise) => (
            <ExerciseRow key={exercise.id} dayId={day.id} exercise={exercise} />
          ))}
        </div>
      )}

      <div className="add-row">
        <input
          value={newExercise}
          onChange={(e) => setNewExercise(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitExercise();
          }}
          placeholder="Nieuwe oefening..."
        />
        <button type="button" onClick={submitExercise}>
          + Toevoegen
        </button>
      </div>
    </div>
  );
}

export default function SchemaEditor() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [newDay, setNewDay] = useState("");

  function submitDay() {
    const name = newDay.trim();
    if (!name) return;
    addDay(name);
    setNewDay("");
  }

  return (
    <div className="wrap">
      <div className="brand-row">
        <h1>Schema</h1>
      </div>
      <p className="subtitle">Stel je eigen trainingsdagen en oefeningen samen.</p>

      {data.program.days.map((day, i) => (
        <DayCard key={day.id} day={day} index={i} total={data.program.days.length} />
      ))}

      <div className="add-row add-day-row">
        <input
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitDay();
          }}
          placeholder="Nieuwe trainingsdag (bijv. Push)..."
        />
        <button type="button" onClick={submitDay}>
          + Dag toevoegen
        </button>
      </div>
    </div>
  );
}
