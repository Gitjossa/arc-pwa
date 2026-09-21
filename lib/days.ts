import type { Day } from "./types";

export const DAYS: Day[] = [
  {
    key: "wo",
    name: "Woensdag",
    short: "Wo",
    letter: "A",
    exercises: [
      "Bench press",
      "Cable row",
      "Leg press",
      "Incline DB press",
      "Leg curl",
      "Lateral raise",
      "Biceps",
      "Triceps",
    ],
  },
  {
    key: "vr",
    name: "Vrijdag",
    short: "Vr",
    letter: "B",
    exercises: [
      "Smith incline bench",
      "Lat pulldown",
      "Leg extension",
      "DB shoulder press",
      "Seated leg curl",
      "Cable row",
      "Biceps",
      "Triceps",
    ],
  },
  {
    key: "zo",
    name: "Zondag",
    short: "Zo",
    letter: "C",
    exercises: [
      "Bench/incline press",
      "Cable row",
      "Leg press of hack squat",
      "Lat pulldown",
      "Leg curl",
      "Lateral raise",
      "Biceps",
      "Triceps",
    ],
  },
];

export const STORAGE_KEY = "fullbody_tracker_v2";

export function exerciseKey(dayKey: string, exerciseName: string): string {
  return `${dayKey}__${exerciseName}`;
}

export function defaultSets(): { reps: string }[] {
  return [{ reps: "12" }, { reps: "12" }, { reps: "12" }];
}
