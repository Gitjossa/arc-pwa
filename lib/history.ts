import { todayIso, weekBucket } from "./date";
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

// ---- Personal records ----

export interface PersonalRecord {
  exerciseId: string;
  name: string;
  weight: number;
  reps: string;
  date: string;
}

/** Best logged weight per exercise across all history, keyed by exerciseId. */
export function personalRecords(history: WorkoutSession[]): Map<string, PersonalRecord> {
  const map = new Map<string, PersonalRecord>();
  for (const session of history) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        const weight = parseFloat(set.kg);
        if (Number.isNaN(weight)) continue;
        const current = map.get(ex.exerciseId);
        if (!current || weight > current.weight) {
          map.set(ex.exerciseId, {
            exerciseId: ex.exerciseId,
            name: ex.name,
            weight,
            reps: set.reps,
            date: session.date,
          });
        }
      }
    }
  }
  return map;
}

// ---- Volume ----

export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce((setSum, set) => {
        const kg = parseFloat(set.kg);
        const reps = parseFloat(set.reps);
        return setSum + (Number.isNaN(kg) || Number.isNaN(reps) ? 0 : kg * reps);
      }, 0),
    0,
  );
}

export function volumeForWeek(history: WorkoutSession[], bucket: number): number {
  return history
    .filter((s) => weekBucket(s.date) === bucket)
    .reduce((sum, s) => sum + sessionVolume(s), 0);
}

export function thisWeekVolume(history: WorkoutSession[]): { current: number; previous: number } {
  const currentBucket = weekBucket(todayIso());
  return {
    current: volumeForWeek(history, currentBucket),
    previous: volumeForWeek(history, currentBucket - 1),
  };
}

// ---- Streak ----

/** Consecutive weeks (allowing the reference week to still be empty) with at least one session. */
export function currentStreakWeeks(history: WorkoutSession[], asOfDate: string = todayIso()): number {
  if (history.length === 0) return 0;
  const buckets = new Set(history.map((s) => weekBucket(s.date)));
  const todayBucket = weekBucket(asOfDate);
  let cursor = buckets.has(todayBucket) ? todayBucket : todayBucket - 1;
  if (!buckets.has(cursor)) return 0;
  let streak = 0;
  while (buckets.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}

// ---- Calendar ----

/** Set of yyyy-mm-dd dates that have at least one logged session. */
export function sessionDates(history: WorkoutSession[]): Set<string> {
  return new Set(history.map((s) => s.date));
}
