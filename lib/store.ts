import { todayIso } from "./date";
import { DEFAULT_PROGRAM } from "./defaultProgram";
import { DEFAULT_LIBRARY } from "./exerciseLibrary";
import { createId } from "./id";
import type {
  AppData,
  DayDef,
  DraftState,
  ExerciseDef,
  ExerciseRecord,
  LibraryExercise,
  Program,
  Settings,
  WorkoutSession,
} from "./types";

const STORAGE_KEY = "arc_app_data_v1";

const DEFAULT_DATA: AppData = {
  program: { days: [] },
  draft: {},
  sessionExtras: {},
  history: [],
  library: DEFAULT_LIBRARY,
  settings: {
    unit: "kg",
    onboarded: false,
    countdownEnabled: false,
    countdownStart: "2026-09-21",
    countdownEnd: "2026-12-31",
  },
};

// ---- Library linking ----
//
// Every exercise (day-schema or historical) is matched to a shared library
// entry by NAME. This never rewrites logged reps/kg/date — it only unifies
// the id used to group PRs and history, so exercises already logged before
// this feature existed become correctly linked instead of losing their data.

function buildLibrary(
  existingLibrary: LibraryExercise[],
  program: Program,
  history: WorkoutSession[],
): LibraryExercise[] {
  const byName = new Map<string, string>();
  for (const lib of existingLibrary) {
    if (!byName.has(lib.name)) byName.set(lib.name, lib.id);
  }
  for (const seed of DEFAULT_LIBRARY) {
    if (!byName.has(seed.name)) byName.set(seed.name, seed.id);
  }
  for (const day of program.days) {
    for (const ex of day.exercises) {
      if (!byName.has(ex.name)) byName.set(ex.name, createId());
    }
  }
  for (const session of history) {
    for (const ex of session.exercises) {
      if (!byName.has(ex.name)) byName.set(ex.name, createId());
    }
  }
  return Array.from(byName, ([name, id]) => ({ id, name }));
}

function linkLibrary(data: AppData): AppData {
  const library = buildLibrary(data.library, data.program, data.history);
  const nameToId = new Map(library.map((l) => [l.name, l.id]));

  const program: Program = {
    days: data.program.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        libraryId: ex.libraryId ?? nameToId.get(ex.name) ?? ex.id,
      })),
    })),
  };

  const history = data.history.map((session) => ({
    ...session,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      exerciseId: nameToId.get(ex.name) ?? ex.exerciseId,
    })),
  }));

  return { ...data, library, program, history };
}

function findOrCreateLibraryEntry(
  library: LibraryExercise[],
  name: string,
): { library: LibraryExercise[]; id: string } {
  const trimmed = name.trim();
  const existing = library.find((l) => l.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return { library, id: existing.id };
  const entry: LibraryExercise = { id: createId(), name: trimmed };
  return { library: [...library, entry], id: entry.id };
}

type Listener = () => void;

let currentState: AppData | null = null;
const listeners = new Set<Listener>();

function readFromStorage(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const base: AppData = {
      program: parsed.program ?? DEFAULT_DATA.program,
      draft: parsed.draft ?? {},
      sessionExtras: parsed.sessionExtras ?? {},
      history: parsed.history ?? [],
      library: parsed.library ?? [],
      // Data already existed on disk, so this device has used the app before —
      // never re-trigger onboarding just because the flag predates this field.
      settings: { ...DEFAULT_DATA.settings, onboarded: true, ...parsed.settings },
    };
    return linkLibrary(base);
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
  // Once the user has explicitly added/removed a set this session, the stored
  // length is authoritative; otherwise auto-size (and never shrink) to the schema.
  const length = rec?.customSets ? Math.max(1, existing.length) : Math.max(targetSets, existing.length);
  const sets = Array.from({ length }, (_, i) => ({
    reps: existing[i]?.reps || exercise.targetReps,
    kg: existing[i]?.kg,
  }));
  return { done: rec?.done ?? false, sets, customSets: rec?.customSets };
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
    // All sets filled in? Check the exercise off automatically. Never auto-uncheck —
    // a manual uncheck (e.g. to redo a set) always stays respected.
    const allFilled = sets.every((s) => s.reps && s.kg);
    return {
      ...prev,
      draft: {
        ...prev.draft,
        [exerciseKey(dayId, exercise.id)]: { ...rec, sets, done: allFilled ? true : rec.done },
      },
    };
  });
}

export function addDraftSet(dayId: string, exercise: ExerciseDef): void {
  update((prev) => {
    const rec = getRecord(prev.draft, dayId, exercise);
    const sets = [...rec.sets, { reps: exercise.targetReps }];
    return {
      ...prev,
      draft: { ...prev.draft, [exerciseKey(dayId, exercise.id)]: { ...rec, sets, customSets: true } },
    };
  });
}

export function removeDraftSet(dayId: string, exercise: ExerciseDef, setIdx: number): void {
  update((prev) => {
    const rec = getRecord(prev.draft, dayId, exercise);
    if (rec.sets.length <= 1) return prev;
    const sets = rec.sets.filter((_, i) => i !== setIdx);
    return {
      ...prev,
      draft: { ...prev.draft, [exerciseKey(dayId, exercise.id)]: { ...rec, sets, customSets: true } },
    };
  });
}

/** Adds an exercise for today's session only — the day's saved schema is untouched. */
export function addSessionExercise(dayId: string, name: string): void {
  update((prev) => {
    const { library, id: libraryId } = findOrCreateLibraryEntry(prev.library, name);
    const exercise: ExerciseDef = {
      id: createId(),
      libraryId,
      name: name.trim(),
      sets: 3,
      targetReps: "12",
    };
    const existing = prev.sessionExtras[dayId] ?? [];
    return {
      ...prev,
      library,
      sessionExtras: { ...prev.sessionExtras, [dayId]: [...existing, exercise] },
    };
  });
}

export function removeSessionExercise(dayId: string, exerciseId: string): void {
  update((prev) => {
    const existing = prev.sessionExtras[dayId] ?? [];
    const nextDraft = { ...prev.draft };
    delete nextDraft[exerciseKey(dayId, exerciseId)];
    return {
      ...prev,
      draft: nextDraft,
      sessionExtras: { ...prev.sessionExtras, [dayId]: existing.filter((e) => e.id !== exerciseId) },
    };
  });
}

/** Archives the filled-in sets for this day (schema + ad-hoc additions) into history, then resets the draft. */
export function finishWorkout(day: DayDef): void {
  pushUndo("Workout opgeslagen");
  update((prev) => {
    const extras = prev.sessionExtras[day.id] ?? [];
    const allExercises = [...day.exercises, ...extras];

    const loggedExercises = allExercises
      .map((exercise) => {
        const rec = getRecord(prev.draft, day.id, exercise);
        const filled = rec.sets.filter((s) => s.reps && s.kg) as { reps: string; kg: string }[];
        return filled.length ? { exerciseId: exercise.libraryId, name: exercise.name, sets: filled } : null;
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
      nextDraft[exerciseKey(day.id, exercise.id)] = { ...rec, done: false, customSets: false };
    });
    // Ad-hoc exercises are session-only: drop their draft state once archived.
    extras.forEach((exercise) => {
      delete nextDraft[exerciseKey(day.id, exercise.id)];
    });

    const nextSessionExtras = { ...prev.sessionExtras };
    delete nextSessionExtras[day.id];

    return { ...prev, draft: nextDraft, history: nextHistory, sessionExtras: nextSessionExtras };
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
  update((prev) => {
    const { library, id: libraryId } = findOrCreateLibraryEntry(prev.library, name);
    return {
      ...prev,
      library,
      program: {
        days: prev.program.days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  { id: createId(), libraryId, name: name.trim(), sets: 3, targetReps: "12" },
                ],
              }
            : d,
        ),
      },
    };
  });
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

// ---- Exercise library ----

export function addLibraryExercise(name: string): void {
  update((prev) => {
    const { library } = findOrCreateLibraryEntry(prev.library, name);
    return { ...prev, library };
  });
}

export function deleteLibraryExercise(libraryId: string): void {
  pushUndo("Oefening uit bibliotheek verwijderd");
  update((prev) => ({ ...prev, library: prev.library.filter((l) => l.id !== libraryId) }));
}

// ---- History editing ----

export function updateHistorySet(
  sessionId: string,
  exerciseId: string,
  setIdx: number,
  field: "reps" | "kg",
  value: string,
): void {
  update((prev) => ({
    ...prev,
    history: prev.history.map((session) =>
      session.id !== sessionId
        ? session
        : {
            ...session,
            exercises: session.exercises.map((ex) =>
              ex.exerciseId !== exerciseId
                ? ex
                : { ...ex, sets: ex.sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s)) },
            ),
          },
    ),
  }));
}

// ---- Settings ----

export function setUnit(unit: Settings["unit"]): void {
  update((prev) => ({ ...prev, settings: { ...prev.settings, unit } }));
}

export function setCountdownEnabled(enabled: boolean): void {
  update((prev) => ({ ...prev, settings: { ...prev.settings, countdownEnabled: enabled } }));
}

export function setCountdownRange(startDate: string, endDate: string): void {
  update((prev) => ({
    ...prev,
    settings: { ...prev.settings, countdownStart: startDate, countdownEnd: endDate },
  }));
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
  commit(
    linkLibrary({
      program: data.program ?? DEFAULT_DATA.program,
      draft: data.draft ?? {},
      sessionExtras: data.sessionExtras ?? {},
      history: data.history ?? [],
      library: data.library ?? [],
      settings: { ...DEFAULT_DATA.settings, ...data.settings },
    }),
  );
  return { ok: true };
}

export function resetAllData(): void {
  pushUndo("Alle data gewist");
  commit(DEFAULT_DATA);
}
