import { todayIso } from "./date";
import { DEFAULT_PROGRAM } from "./defaultProgram";
import { createId } from "./id";
import type {
  AppData,
  DayDef,
  DraftState,
  ExerciseDef,
  ExerciseRecord,
  Program,
  Settings,
  WorkoutSession,
} from "./types";

const STORAGE_KEY = "arc_app_data_v1";

const DEFAULT_DATA: AppData = {
  program: { days: [] },
  draft: {},
  history: [],
  settings: { unit: "kg", onboarded: false },
};

type Listener = () => void;

let currentState: AppData | null = null;
const listeners = new Set<Listener>();

function readFromStorage(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      program: parsed.program ?? DEFAULT_DATA.program,
      draft: parsed.draft ?? {},
      history: parsed.history ?? [],
      // Data already existed on disk, so this device has used the app before —
      // never re-trigger onboarding just because the flag predates this field.
      settings: { ...DEFAULT_DATA.settings, onboarded: true, ...parsed.settings },
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function getState(): AppData {
  if (currentState === null) currentState = readFromStorage();
  return currentState;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AppData {
  return getState();
}

export function getServerSnapshot(): AppData {
  return DEFAULT_DATA;
}

function commit(next: AppData): void {
  currentState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode, quota) — silently ignore
    }
  }
  listeners.forEach((listener) => listener());
}

function update(updater: (prev: AppData) => AppData): void {
  commit(updater(getState()));
}

// ---- Undo ----

export interface UndoSnapshot {
  message: string;
  token: number;
}

let undoData: AppData | null = null;
// Separate from undoData so getUndoSnapshot can return a referentially stable
// value to useSyncExternalStore — a fresh object literal on every call would
// make React think the store changes on every render, causing an infinite loop.
let publicUndoSnapshot: UndoSnapshot | null = null;
let undoTokenSeq = 0;
const undoListeners = new Set<Listener>();

function notifyUndo(): void {
  undoListeners.forEach((listener) => listener());
}

/** Captures the current state under `message` before a destructive action, so it can be undone briefly. */
function pushUndo(message: string): void {
  const token = ++undoTokenSeq;
  undoData = getState();
  publicUndoSnapshot = { message, token };
  notifyUndo();
  setTimeout(() => {
    if (publicUndoSnapshot?.token === token) {
      undoData = null;
      publicUndoSnapshot = null;
      notifyUndo();
    }
  }, 6000);
}

export function subscribeUndo(listener: Listener): () => void {
  undoListeners.add(listener);
  return () => undoListeners.delete(listener);
}

export function getUndoSnapshot(): UndoSnapshot | null {
  return publicUndoSnapshot;
}

export function getUndoServerSnapshot(): UndoSnapshot | null {
  return null;
}

export function undoLast(): void {
  if (!undoData) return;
  commit(undoData);
  undoData = null;
  publicUndoSnapshot = null;
  notifyUndo();
}

export function dismissUndo(): void {
  if (!publicUndoSnapshot) return;
  undoData = null;
  publicUndoSnapshot = null;
  notifyUndo();
}

export function exerciseKey(dayId: string, exerciseId: string): string {
  return `${dayId}__${exerciseId}`;
}

export function getRecord(
  draft: DraftState,
  dayId: string,
  exercise: ExerciseDef,
): ExerciseRecord {
  const key = exerciseKey(dayId, exercise.id);
  const rec = draft[key];
  const targetSets = Math.max(1, exercise.sets);
  const existing = rec?.sets ?? [];
  const sets = Array.from({ length: targetSets }, (_, i) => ({
    reps: existing[i]?.reps || exercise.targetReps,
    kg: existing[i]?.kg,
  }));
  return { done: rec?.done ?? false, sets };
}

// ---- Draft (today's session) ----

export function toggleDone(dayId: string, exercise: ExerciseDef): void {
  update((prev) => {
    const rec = getRecord(prev.draft, dayId, exercise);
    return {
      ...prev,
      draft: { ...prev.draft, [exerciseKey(dayId, exercise.id)]: { ...rec, done: !rec.done } },
    };
  });
}

export function commitSetField(
  dayId: string,
  exercise: ExerciseDef,
  setIdx: number,
  field: "reps" | "kg",
  value: string,
): void {
  update((prev) => {
    const rec = getRecord(prev.draft, dayId, exercise);
    const sets = rec.sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
    return {
      ...prev,
      draft: { ...prev.draft, [exerciseKey(dayId, exercise.id)]: { ...rec, sets } },
    };
  });
}

/** Archives the filled-in sets for this day into history, then clears the "done" flags. */
export function finishWorkout(day: DayDef): void {
  pushUndo("Workout opgeslagen");
  update((prev) => {
    const loggedExercises = day.exercises
      .map((exercise) => {
        const rec = getRecord(prev.draft, day.id, exercise);
        const filled = rec.sets.filter((s) => s.reps && s.kg) as { reps: string; kg: string }[];
        return filled.length ? { exerciseId: exercise.id, name: exercise.name, sets: filled } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    let nextHistory = prev.history;
    if (loggedExercises.length) {
      const session: WorkoutSession = {
        id: createId(),
        dayId: day.id,
        dayName: day.name,
        date: todayIso(),
        exercises: loggedExercises,
      };
      nextHistory = [session, ...prev.history];
    }

    const nextDraft = { ...prev.draft };
    day.exercises.forEach((exercise) => {
      const rec = getRecord(nextDraft, day.id, exercise);
      nextDraft[exerciseKey(day.id, exercise.id)] = { ...rec, done: false };
    });

    return { ...prev, draft: nextDraft, history: nextHistory };
  });
}

// ---- Program editing ----

export function addDay(name: string): void {
  update((prev) => ({
    ...prev,
    program: { days: [...prev.program.days, { id: createId(), name, exercises: [] }] },
  }));
}

export function renameDay(dayId: string, name: string): void {
  update((prev) => ({
    ...prev,
    program: {
      days: prev.program.days.map((d) => (d.id === dayId ? { ...d, name } : d)),
    },
  }));
}

export function deleteDay(dayId: string): void {
  pushUndo("Dag verwijderd");
  update((prev) => ({
    ...prev,
    program: { days: prev.program.days.filter((d) => d.id !== dayId) },
  }));
}

export function moveDay(dayId: string, direction: -1 | 1): void {
  update((prev) => {
    const days = [...prev.program.days];
    const idx = days.findIndex((d) => d.id === dayId);
    const target = idx + direction;
    if (idx === -1 || target < 0 || target >= days.length) return prev;
    [days[idx], days[target]] = [days[target], days[idx]];
    return { ...prev, program: { days } };
  });
}

export function addExercise(dayId: string, name: string): void {
  update((prev) => ({
    ...prev,
    program: {
      days: prev.program.days.map((d) =>
        d.id === dayId
          ? { ...d, exercises: [...d.exercises, { id: createId(), name, sets: 3, targetReps: "12" }] }
          : d,
      ),
    },
  }));
}

export function updateExercise(
  dayId: string,
  exerciseId: string,
  patch: Partial<Pick<ExerciseDef, "name" | "sets" | "targetReps">>,
): void {
  update((prev) => ({
    ...prev,
    program: {
      days: prev.program.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)),
            }
          : d,
      ),
    },
  }));
}

export function deleteExercise(dayId: string, exerciseId: string): void {
  pushUndo("Oefening verwijderd");
  update((prev) => ({
    ...prev,
    program: {
      days: prev.program.days.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) } : d,
      ),
    },
  }));
}

export function moveExercise(dayId: string, exerciseId: string, direction: -1 | 1): void {
  update((prev) => ({
    ...prev,
    program: {
      days: prev.program.days.map((d) => {
        if (d.id !== dayId) return d;
        const exercises = [...d.exercises];
        const idx = exercises.findIndex((e) => e.id === exerciseId);
        const target = idx + direction;
        if (idx === -1 || target < 0 || target >= exercises.length) return d;
        [exercises[idx], exercises[target]] = [exercises[target], exercises[idx]];
        return { ...d, exercises };
      }),
    },
  }));
}

// ---- Settings ----

export function setUnit(unit: Settings["unit"]): void {
  update((prev) => ({ ...prev, settings: { ...prev.settings, unit } }));
}

// ---- Onboarding ----

export function chooseProgram(program: Program): void {
  update((prev) => ({ ...prev, program, settings: { ...prev.settings, onboarded: true } }));
}

export function chooseDefaultProgram(): void {
  chooseProgram(DEFAULT_PROGRAM);
}

export function chooseBlankProgram(): void {
  chooseProgram({ days: [] });
}

// ---- Data management ----

export function exportData(): string {
  return JSON.stringify(getState(), null, 2);
}

export function importData(json: string): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Ongeldig JSON-bestand." };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("program" in parsed) ||
    !("draft" in parsed) ||
    !("history" in parsed)
  ) {
    return { ok: false, error: "Dit bestand bevat geen geldige Arc-data." };
  }
  const data = parsed as Partial<AppData>;
  commit({
    program: data.program ?? DEFAULT_DATA.program,
    draft: data.draft ?? {},
    history: data.history ?? [],
    settings: { ...DEFAULT_DATA.settings, ...data.settings },
  });
  return { ok: true };
}

export function resetAllData(): void {
  pushUndo("Alle data gewist");
  commit(DEFAULT_DATA);
}
