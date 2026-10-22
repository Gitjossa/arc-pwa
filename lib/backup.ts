import { todayIso } from "./date";
import type { AppData } from "./types";

const DAY_MS = 86400000;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((new Date(toIso + "T00:00:00").getTime() - new Date(fromIso + "T00:00:00").getTime()) / DAY_MS);
}

/** A backup is due when the last export (or, if never exported, the oldest session) is 30+ days old. */
export function backupReminder(data: AppData): { due: boolean; daysSince: number | null } {
  const today = todayIso();
  if (data.history.length === 0) return { due: false, daysSince: null };
  const oldest = data.history.reduce((min, s) => (s.date < min ? s.date : min), data.history[0].date);
  const reference = data.settings.lastBackupAt ?? oldest;
  const daysSince = daysBetween(reference, today);
  const snoozed = data.settings.backupSnoozedUntil !== undefined && data.settings.backupSnoozedUntil > today;
  return { due: daysSince >= 30 && !snoozed, daysSince: data.settings.lastBackupAt ? daysSince : null };
}
