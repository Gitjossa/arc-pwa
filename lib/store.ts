import { STORAGE_KEY } from "./days";
import type { WorkoutState } from "./types";

type Listener = () => void;

const EMPTY_STATE: WorkoutState = {};

let currentState: WorkoutState | null = null;
const listeners = new Set<Listener>();

function readFromStorage(): WorkoutState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WorkoutState) : {};
  } catch {
    return {};
  }
}

function getState(): WorkoutState {
  if (currentState === null) currentState = readFromStorage();
  return currentState;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): WorkoutState {
  return getState();
}

export function getServerSnapshot(): WorkoutState {
  return EMPTY_STATE;
}

export function setWorkoutState(updater: (prev: WorkoutState) => WorkoutState): void {
  const next = updater(getState());
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
