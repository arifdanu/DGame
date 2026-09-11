import type {
  Activity,
  AnswerRecord,
  Draft,
  IslandId,
  Level,
  Profile,
} from "../types";
import { LEVELS } from "../content/levels";
export const freshRecord = (): AnswerRecord => ({
  attempts: 0,
  help: 0,
  guided: false,
  firstCorrect: false,
  completed: false,
});
export const freshDraft = (): Draft => ({
  index: 0,
  input: [],
  feedback: "none",
  records: {},
});
export function move(
  position: number,
  direction: string,
  size: number,
  blocked: number[],
): number {
  const offsets: Record<string, number> = {
    atas: -size,
    bawah: size,
    kiri: -1,
    kanan: 1,
  };
  const next = position + (offsets[direction] ?? 0);
  if (
    next < 0 ||
    next >= size * size ||
    blocked.includes(next) ||
    (direction === "kiri" && position % size === 0) ||
    (direction === "kanan" && position % size === size - 1)
  )
    return position;
  return next;
}
export function correct(a: Activity, input: string[]): boolean {
  const t = a.interaction;
  switch (t.kind) {
    case "story":
    case "choice":
      return input.length === 1 && input[0] === t.answer;
    case "order":
      return JSON.stringify(input) === JSON.stringify(t.answer);
    case "count":
      return (
        new Set(input).size === t.target &&
        input.every((i) => /^\d+$/.test(i) && Number(i) < t.objects.length)
      );
    case "number":
      return (
        input.length === 1 &&
        /^\d+$/.test(input[0]) &&
        Number(input[0]) === t.answer
      );
    case "grid":
      return (
        input.every((d) => ["atas", "bawah", "kiri", "kanan"].includes(d)) &&
        input.reduce((pos, d) => move(pos, d, t.size, t.blocked), t.start) ===
          t.goal
      );
  }
}
export function solution(a: Activity): string[] {
  const t = a.interaction;
  switch (t.kind) {
    case "story":
    case "choice":
      return [t.answer];
    case "order":
      return t.answer;
    case "count":
      return Array.from({ length: t.target }, (_, i) => String(i));
    case "number":
      return [String(t.answer)];
    case "grid":
      return t.solution;
  }
}
export function answer(a: Activity, draft: Draft): Draft {
  const old = draft.records[a.id] ?? freshRecord();
  if (old.completed || draft.feedback === "guided") return draft;
  const ok = correct(a, draft.input),
    attempts = old.attempts + 1;
  const guided = !ok && attempts >= 2;
  return {
    ...draft,
    feedback: ok ? "correct" : guided ? "guided" : "wrong",
    records: {
      ...draft.records,
      [a.id]: {
        ...old,
        attempts,
        firstCorrect: ok && attempts === 1,
        completed: ok,
        guided,
      },
    },
  };
}
export function acceptGuide(a: Activity, draft: Draft): Draft {
  const record = draft.records[a.id];
  if (!record?.guided || record.completed) return draft;
  return {
    ...draft,
    input: solution(a),
    feedback: "correct",
    records: {
      ...draft.records,
      [a.id]: { ...record, completed: true, firstCorrect: false },
    },
  };
}
export function unlocked(p: Profile, l: Level): boolean {
  return (
    l.rank === 1 || p.badges.includes(`${l.profile}-${l.island}-${l.rank - 1}`)
  );
}
export function completeLevel(p: Profile, l: Level, d: Draft): Profile {
  if (!l.activities.every((a) => d.records[a.id]?.completed)) return p;
  const results = { ...p.results };
  for (const a of l.activities) {
    if (!results[a.id]?.completed) results[a.id] = d.records[a.id];
  }
  const drafts = { ...p.drafts };
  delete drafts[l.id];
  const newlyCompleted = Boolean(p.drafts[l.id]);
  const session = p.session
    ? {
        ...p.session,
        completed:
          newlyCompleted && p.session.completed.length < 3
            ? [...p.session.completed, l.id]
            : p.session.completed,
      }
    : null;
  if (session && session.completed.length >= 3) session.ended = true;
  return {
    ...p,
    results,
    drafts,
    badges: [...new Set([...p.badges, l.id])],
    session,
  };
}
export function stats(p: Profile, island?: IslandId) {
  const ids = new Set(
    LEVELS.filter((l) => !island || l.island === island).flatMap((l) =>
      l.activities.map((a) => a.id),
    ),
  );
  const records = { ...p.results };
  for (const d of Object.values(p.drafts))
    for (const [id, r] of Object.entries(d.records))
      if (!records[id]?.completed) records[id] = r;
  const rs = Object.entries(records)
    .filter(([id]) => ids.has(id))
    .map(([, r]) => r);
  const done = rs.filter((r) => r.completed);
  return {
    completed: done.length,
    attempts: rs.reduce((n, r) => n + r.attempts, 0),
    help: rs.reduce((n, r) => n + r.help, 0),
    guided: done.filter((r) => r.guided).length,
    firstCorrect: done.filter((r) => r.firstCorrect).length,
    accuracy: done.length
      ? Math.round(
          (100 * done.filter((r) => r.firstCorrect).length) / done.length,
        )
      : null,
  };
}
export function validateContent(): string[] {
  const errors: string[] = [],
    ids = new Set<string>();
  for (const l of LEVELS) {
    if (l.activities.length !== 5) errors.push(l.id + " jumlah aktivitas");
    for (const a of l.activities) {
      if (ids.has(a.id)) errors.push(a.id + " duplikat");
      ids.add(a.id);
      if (
        !a.hint ||
        !a.explanation ||
        !a.objective ||
        !a.instruction ||
        a.profile !== l.profile ||
        a.island !== l.island ||
        a.level !== l.rank
      )
        errors.push(a.id + " metadata");
      if (!correct(a, solution(a))) errors.push(a.id + " kunci");
      if (
        (a.interaction.kind === "choice" || a.interaction.kind === "story") &&
        (new Set(a.interaction.options).size !== a.interaction.options.length ||
          !a.interaction.options.includes(a.interaction.answer))
      )
        errors.push(a.id + " pilihan");
      const interaction = a.interaction;
      if (
        interaction.kind === "story" &&
        interaction.options.some((o) => !interaction.branches[o])
      )
        errors.push(a.id + " cabang cerita");
      if (
        a.interaction.kind === "order" &&
        JSON.stringify([...a.interaction.pieces].sort()) !==
          JSON.stringify([...a.interaction.answer].sort())
      )
        errors.push(a.id + " urutan");
    }
  }
  return errors;
}
