export interface ExerciseDef {
  id: string;
  /** Links this schedule slot to a shared LibraryExercise for cross-day history/PR matching. */
  libraryId: string;
  name: string;
  sets: number;
  targetReps: string;
}

export interface DayDef {
  id: string;
  name: string;
  exercises: ExerciseDef[];
}

export interface Program {
  days: DayDef[];
}

export interface LibraryExercise {
  id: string;
  name: string;
}

export interface SetEntry {
  reps: string;
  kg?: string;
}

export interface ExerciseRecord {
  done: boolean;
  sets: SetEntry[];
  /** Once true, the set count for this session is user-controlled and no longer auto-sized to the schema. */
  customSets?: boolean;
}

/** Key is `${dayId}__${exerciseId}`. Holds the in-progress state for a day until it's finished. */
export type DraftState = Record<string, ExerciseRecord>;

/** Exercises added ad-hoc during a session, keyed by dayId. Cleared once that day's workout is finished. */
export type SessionExtras = Record<string, ExerciseDef[]>;

export interface LoggedSet {
  reps: string;
  kg: string;
}

export interface LoggedExercise {
  /** A LibraryExercise id, so the same exercise unifies across days/sessions. */
  exerciseId: string;
  name: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  dayId: string;
  dayName: string;
  date: string; // yyyy-mm-dd
  exercises: LoggedExercise[];
}

export type Unit = "kg" | "lbs";

export interface Settings {
  unit: Unit;
  onboarded: boolean;
  countdownEnabled: boolean;
  countdownStart: string; // yyyy-mm-dd
  countdownEnd: string; // yyyy-mm-dd
}

export interface AppData {
  program: Program;
  draft: DraftState;
  sessionExtras: SessionExtras;
  history: WorkoutSession[];
  library: LibraryExercise[];
  settings: Settings;
}
