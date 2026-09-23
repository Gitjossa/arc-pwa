import type { LibraryExercise } from "./types";

export function libraryIdForName(name: string): string {
  return `lib-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

// A broad set of common gym strength-training exercises, so the library is
// useful from the very first launch instead of starting empty.
const SEED_NAMES = [
  // Borst
  "Bench press",
  "Incline bench press",
  "Decline bench press",
  "Dumbbell bench press",
  "Incline dumbbell press",
  "Dumbbell flyes",
  "Cable flyes",
  "Pec deck",
  "Push-ups",
  "Dips",
  "Machine chest press",
  "Smith incline bench",
  // Rug
  "Deadlift",
  "Pull-ups",
  "Chin-ups",
  "Lat pulldown",
  "Cable row",
  "Barbell row",
  "Dumbbell row",
  "T-bar row",
  "Face pull",
  "Straight arm pulldown",
  "Rack pulls",
  "Back extension",
  "Shrugs",
  // Benen
  "Squat",
  "Front squat",
  "Leg press",
  "Leg extension",
  "Leg curl",
  "Seated leg curl",
  "Romanian deadlift",
  "Bulgarian split squat",
  "Walking lunges",
  "Hack squat",
  "Leg press of hack squat",
  "Calf raises",
  "Seated calf raises",
  "Hip thrust",
  "Goblet squat",
  "Sumo deadlift",
  "Glute bridge",
  "Adductor machine",
  "Abductor machine",
  // Schouders
  "Overhead press",
  "DB shoulder press",
  "Arnold press",
  "Lateral raise",
  "Front raise",
  "Rear delt fly",
  "Upright row",
  "Machine shoulder press",
  "Incline DB press",
  // Armen
  "Barbell curl",
  "Dumbbell curl",
  "Hammer curl",
  "Preacher curl",
  "Concentration curl",
  "Cable curl",
  "Triceps pushdown",
  "Overhead triceps extension",
  "Skull crushers",
  "Close-grip bench press",
  "Cable kickback",
  "Biceps",
  "Triceps",
  // Core
  "Plank",
  "Crunches",
  "Cable crunch",
  "Hanging leg raise",
  "Russian twist",
  "Ab wheel rollout",
  "Sit-ups",
  "Leg raise",
  "Side plank",
  // Functioneel
  "Power clean",
  "Kettlebell swing",
  "Farmer's walk",
  // Overig (matcht de bestaande voorbeeldschema's)
  "Bench/incline press",
];

export const DEFAULT_LIBRARY: LibraryExercise[] = SEED_NAMES.map((name) => ({
  id: libraryIdForName(name),
  name,
}));
