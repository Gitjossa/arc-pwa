export interface SetEntry {
  reps: string;
  kg?: string;
}

export interface ExerciseRecord {
  done: boolean;
  sets: SetEntry[];
}

export type WorkoutState = Record<string, ExerciseRecord>;

export interface Day {
  key: string;
  name: string;
  short: string;
  letter: string;
  exercises: string[];
}
