import type { WorkoutSession } from "./types";

export interface ExerciseOption {
  id: string;
  name: string;
}

/** History is stored newest-first, so the first match per id is the most recently used name. */
export function listLoggedExercises(history: WorkoutSession[]): ExerciseOption[] {
  const seen = new Map<string, string>();
  for (const session of history) {
    for (const ex of session.exercises) {
      if (!seen.has(ex.exerciseId)) seen.set(ex.exerciseId, ex.name);
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

export interface SeriesPoint {
  date: string;
  maxKg: number;
}

export function exerciseSeries(history: WorkoutSession[], exerciseId: string): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const session of history) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const weights = ex.sets.map((s) => parseFloat(s.kg)).filter((n) => !Number.isNaN(n));
    if (!weights.length) continue;
    points.push({ date: session.date, maxKg: Math.max(...weights) });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}
