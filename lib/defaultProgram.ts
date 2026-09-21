import type { DayDef, ExerciseDef, Program } from "./types";

function ex(dayId: string, idx: number, name: string): ExerciseDef {
  return { id: `${dayId}-ex${idx}`, name, sets: 3, targetReps: "12" };
}

function day(id: string, name: string, exercises: string[]): DayDef {
  return { id, name, exercises: exercises.map((n, i) => ex(id, i + 1, n)) };
}

export const DEFAULT_PROGRAM: Program = {
  days: [
    day("wo", "Woensdag", [
      "Bench press",
      "Cable row",
      "Leg press",
      "Incline DB press",
      "Leg curl",
      "Lateral raise",
      "Biceps",
      "Triceps",
    ]),
    day("vr", "Vrijdag", [
      "Smith incline bench",
      "Lat pulldown",
      "Leg extension",
      "DB shoulder press",
      "Seated leg curl",
      "Cable row",
      "Biceps",
      "Triceps",
    ]),
    day("zo", "Zondag", [
      "Bench/incline press",
      "Cable row",
      "Leg press of hack squat",
      "Lat pulldown",
      "Leg curl",
      "Lateral raise",
      "Biceps",
      "Triceps",
    ]),
  ],
};
