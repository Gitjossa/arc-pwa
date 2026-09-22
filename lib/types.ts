export interface ExerciseDef {
  id: string;
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

export interface SetEntry {
  reps: string;
  kg?: string;
}

export interface ExerciseRecord {
  done: boolean;
  sets: SetEntry[];
}

/** Key is `${dayId}__${exerciseId}`. Holds the in-progress state for a day until it's finished. */
export type DraftState = Record<string, ExerciseRecord>;

export interface LoggedSet {
  reps: string;
  kg: string;
}

export interface LoggedExercise {
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
  history: WorkoutSession[];
  settings: Settings;
}
