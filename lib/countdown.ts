import { todayIso } from "./date";

export interface CountdownProgress {
  pct: number;
  daysLeft: number;
  totalDays: number;
}

function toDays(iso: string): number {
  return Math.floor(new Date(iso + "T00:00:00").getTime() / 86400000);
}

export function countdownProgress(startDate: string, endDate: string): CountdownProgress {
  const start = toDays(startDate);
  const end = toDays(endDate);
  const now = toDays(todayIso());

  const totalDays = Math.max(1, end - start);
  const elapsed = Math.min(Math.max(now - start, 0), totalDays);
  const pct = Math.round((elapsed / totalDays) * 100);
  const daysLeft = Math.max(0, end - now);

  return { pct, daysLeft, totalDays };
}
