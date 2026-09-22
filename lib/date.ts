export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function weekBucket(dateIso: string): number {
  const ms = new Date(dateIso + "T00:00:00").getTime();
  const days = Math.floor(ms / 86400000);
  return Math.floor(days / 7);
}
