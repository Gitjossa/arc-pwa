"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  addDay,
  addExercise,
  deleteDay,
  deleteExercise,
  getServerSnapshot,
  getSnapshot,
  moveDay,
  renameDay,
  reorderExercise,
  subscribe,
  updateExercise,
} from "@/lib/store";
import type { DayDef, LibraryExercise } from "@/lib/types";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

const ROW_GAP = 8;

function GripIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="4" r="1.6" />
      <circle cx="10" cy="4" r="1.6" />
      <circle cx="4" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="4" cy="16" r="1.6" />
      <circle cx="10" cy="16" r="1.6" />
    </svg>
  );
}

function ExerciseRow({
  dayId,
  exercise,
  style,
  className,
  onHandleDown,
}: {
  dayId: string;
  exercise: DayDef["exercises"][number];
  style?: React.CSSProperties;
  className?: string;
  onHandleDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div className={`ex-row${className ? ` ${className}` : ""}`} style={style}>
      <div className="ex-row-line">
        <div className="drag-handle" onPointerDown={onHandleDown} aria-label="Sleep om te herordenen" role="button">
          <GripIcon />
        </div>
        <div className="ex-row-main">
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
            <div className="row-actions">
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
        </div>
      </div>
    </div>
  );
}

type DragState = { from: number; to: number; dy: number; step: number };
type DragMeasure = { from: number; startY: number; tops: number[]; heights: number[]; to: number };

function DayCard({
  day,
  index,
  total,
  library,
}: {
  day: DayDef;
  index: number;
  total: number;
  library: LibraryExercise[];
}) {
  const [open, setOpen] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<DragMeasure | null>(null);

  function submitExercise() {
    const name = newExercise.trim();
    if (!name) return;
    addExercise(day.id, name);
    setNewExercise("");
  }

  function startDrag(e: React.PointerEvent, from: number) {
    const list = listRef.current;
    if (!list) return;
    e.preventDefault();
    const rects = (Array.from(list.children) as HTMLElement[]).map((el) => el.getBoundingClientRect());
    const measure: DragMeasure = {
      from,
      startY: e.clientY,
      tops: rects.map((r) => r.top),
      heights: rects.map((r) => r.height),
      to: from,
    };
    measureRef.current = measure;
    const step = measure.heights[from] + ROW_GAP;
    setDrag({ from, to: from, dy: 0, step });

    const last = rects.length - 1;
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - measure.startY;
      const center = measure.tops[from] + measure.heights[from] / 2 + dy;
      let to = from;
      if (center < measure.tops[0]) to = 0;
      else if (center >= measure.tops[last] + measure.heights[last]) to = last;
      else {
        for (let i = 0; i <= last; i++) {
          if (center >= measure.tops[i] && center < measure.tops[i] + measure.heights[i] + ROW_GAP) {
            to = i;
            break;
          }
        }
      }
      measure.to = to;
      setDrag({ from, to, dy, step });
    };
    const onEnd = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      measureRef.current = null;
      setDrag(null);
      if (measure.to !== from) reorderExercise(day.id, from, measure.to);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  function rowStyle(i: number): { style?: React.CSSProperties; className?: string } {
    if (!drag) return {};
    const step = drag.step;
    if (i === drag.from) {
      return { style: { transform: `translateY(${drag.dy}px)` }, className: "dragging" };
    }
    if (drag.from < drag.to && i > drag.from && i <= drag.to) {
      return { style: { transform: `translateY(${-step}px)` }, className: "shifting" };
    }
    if (drag.from > drag.to && i >= drag.to && i < drag.from) {
      return { style: { transform: `translateY(${step}px)` }, className: "shifting" };
    }
    return { className: "shifting" };
  }

  return (
    <div className={`day-card${open ? " open" : ""}`}>
      <div className="day-card-head">
        {open ? (
          <input
            className="day-name-input"
            value={day.name}
            onChange={(e) => renameDay(day.id, e.target.value)}
            placeholder="Naam trainingsdag"
          />
        ) : (
          <button type="button" className="day-toggle" onClick={() => setOpen(true)}>
            <span className="day-name-input day-name-static">{day.name || "Naamloos"}</span>
            <span className="day-toggle-count">
              {day.exercises.length} {day.exercises.length === 1 ? "oefening" : "oefeningen"}
            </span>
          </button>
        )}
        {open && (
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
        )}
        <button
          type="button"
          className="day-chevron-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Inklappen" : "Uitklappen"}
          aria-expanded={open}
        >
          <span className="day-chevron" aria-hidden="true">
            &#8964;
          </span>
        </button>
      </div>

      {open && (
        <>
          {day.exercises.length > 0 && (
            <div ref={listRef} className={`ex-list${drag ? " is-dragging" : ""}`}>
              {day.exercises.map((exercise, i) => {
                const { style, className } = rowStyle(i);
                return (
                  <ExerciseRow
                    key={exercise.id}
                    dayId={day.id}
                    exercise={exercise}
                    style={style}
                    className={className}
                    onHandleDown={(e) => startDrag(e, i)}
                  />
                );
              })}
            </div>
          )}

          <ExerciseAutocomplete
            library={library}
            value={newExercise}
            onChange={setNewExercise}
            onSubmit={submitExercise}
            placeholder="Oefening uit bibliotheek of nieuw..."
          />
        </>
      )}
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
      <p className="subtitle">Je trainingsdagen en de oefeningen daarin. Sleep om de volgorde aan te passen.</p>

      {data.program.days.map((day, i) => (
        <DayCard key={day.id} day={day} index={i} total={data.program.days.length} library={data.library} />
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
