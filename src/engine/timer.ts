import type { Profile, IslandId } from "../types";
export function jakartaDay(now: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function remaining(p: Profile, now = Date.now()): number {
  return Math.max(0, p.limit * 60000 - (p.usage[jakartaDay(now)] ?? 0));
}
export function charge(
  p: Profile,
  start: number,
  end: number,
  island?: IslandId,
): Profile {
  if (end <= start) return p;
  const usage = { ...p.usage };
  let cursor = start,
    total = 0;
  while (cursor < end) {
    const day = jakartaDay(cursor);
    const midnight = Date.parse(`${day}T00:00:00+07:00`) + 86400000;
    const stop = Math.min(end, midnight);
    const amount = Math.min(
      stop - cursor,
      Math.max(0, p.limit * 60000 - (usage[day] ?? 0)),
    );
    usage[day] = (usage[day] ?? 0) + amount;
    total += amount;
    cursor = stop;
  }
  return {
    ...p,
    usage,
    ...(island
      ? {
          skillMs: {
            ...p.skillMs,
            [island]: (p.skillMs?.[island] ?? 0) + total,
          },
        }
      : {}),
    session: p.session
      ? { ...p.session, durationMs: p.session.durationMs + total }
      : null,
  };
}
export class ActiveClock {
  private last: number | null = null;
  constructor(private commit: (start: number, end: number) => void) {}
  setActive(active: boolean, now: number) {
    this.flush(now);
    this.last = active ? now : null;
  }
  flush(now: number) {
    if (this.last !== null) {
      if (now > this.last) this.commit(this.last, now);
      this.last = now;
    }
  }
}
