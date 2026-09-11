import { describe, expect, it } from "vitest";
import { ISLANDS, LEVELS, OFFLINE } from "../src/content/levels";
import {
  acceptGuide,
  answer,
  completeLevel,
  correct,
  freshDraft,
  freshRecord,
  move,
  solution,
  stats,
  unlocked,
  validateContent,
} from "../src/engine/game";
import { blankProfile, initialData } from "../src/storage/store";
import type { Draft } from "../src/types";
const level = LEVELS[0];
function finished(): Draft {
  return {
    ...freshDraft(),
    records: Object.fromEntries(
      level.activities.map((a) => [
        a.id,
        { ...freshRecord(), attempts: 1, firstCorrect: true, completed: true },
      ]),
    ),
  };
}
describe("bank konten", () => {
  it("24 level, 120 ID unik, lima aktivitas per level, 12 ide offline", () => {
    expect(LEVELS).toHaveLength(24);
    expect(
      new Set(LEVELS.flatMap((l) => l.activities.map((a) => a.id))).size,
    ).toBe(120);
    expect(OFFLINE).toHaveLength(12);
    expect(validateContent()).toEqual([]);
    for (const profile of ["dinar", "delisha"])
      for (const island of ISLANDS)
        expect(
          LEVELS.filter(
            (l) => l.profile === profile && l.island === island.id,
          ).map((l) => l.rank),
        ).toEqual([1, 2, 3]);
  });
  it.each(LEVELS)(
    "$id seluruh kunci dapat dimainkan, jawaban kosong ditolak",
    (l) => {
      for (const a of l.activities) {
        expect(correct(a, solution(a))).toBe(true);
        expect(correct(a, [])).toBe(false);
      }
    },
  );
  it("memeriksa hasil matematika secara independen", () => {
    expect(
      LEVELS.find((l) => l.id === "dinar-angka-1")!.activities.map(
        (a) => solution(a)[0],
      ),
    ).toEqual(["37", "32", "63 bekal", "45", "35"]);
    expect(
      LEVELS.find((l) => l.id === "dinar-angka-3")!
        .activities.slice(0, 4)
        .map((a) => solution(a)[0]),
    ).toEqual(["3000", "2000", "Roti seharga Rp3.000", "4000"]);
    for (const a of LEVELS.flatMap((l) => l.activities)) {
      const t = a.interaction;
      if (t.kind === "number" && t.groups)
        expect(t.answer).toBe(t.groups.count * t.groups.size);
    }
  });
  it("grid tidak bisa keluar, menembus batu, atau membungkus baris", () => {
    expect(move(0, "atas", 3, [])).toBe(0);
    expect(move(2, "kanan", 3, [])).toBe(2);
    expect(move(3, "kiri", 3, [])).toBe(3);
    expect(move(0, "kanan", 3, [1])).toBe(0);
  });
});
describe("progres dan umpan balik", () => {
  it("semua pulau terbuka, level bertahap, hadiah idempotent", () => {
    let p = blankProfile();
    for (const l of LEVELS.filter((l) => l.profile === "delisha"))
      expect(unlocked(p, l)).toBe(l.rank === 1);
    p = completeLevel(p, level, finished());
    p = completeLevel(p, level, finished());
    expect(p.badges).toEqual([level.id]);
    expect(unlocked(p, LEVELS[1])).toBe(true);
    expect(completeLevel(blankProfile(), level, freshDraft()).badges).toEqual(
      [],
    );
  });
  it("progres profil tidak bercampur", () => {
    const data = initialData();
    data.profiles.delisha = completeLevel(
      data.profiles.delisha,
      level,
      finished(),
    );
    expect(data.profiles.dinar.badges).toEqual([]);
  });
  it("dua kesalahan memberi contoh dan statistik terbimbing bukan benar pertama", () => {
    const a = level.activities[0];
    let d = answer(a, { ...freshDraft(), input: ["0"] });
    expect(d.feedback).toBe("wrong");
    d = answer(a, d);
    expect(d.feedback).toBe("guided");
    expect(d.records[a.id].completed).toBe(false);
    d = acceptGuide(a, d);
    expect(d.records[a.id]).toMatchObject({
      guided: true,
      firstCorrect: false,
      attempts: 2,
      completed: true,
    });
    const p = { ...blankProfile(), drafts: { [level.id]: d } };
    expect(stats(p)).toMatchObject({
      completed: 1,
      guided: 1,
      firstCorrect: 0,
      accuracy: 0,
    });
    expect(acceptGuide(a, d)).toEqual(d);
  });
  it("bantuan dan percobaan pertama tercatat terpisah", () => {
    const a = level.activities[0];
    const d = answer(a, {
      ...freshDraft(),
      input: solution(a),
      records: { [a.id]: { ...freshRecord(), help: 2 } },
    });
    expect(
      stats({ ...blankProfile(), drafts: { [level.id]: d } }),
    ).toMatchObject({ help: 2, firstCorrect: 1, accuracy: 100, attempts: 1 });
    expect(answer(a, d)).toEqual(d);
  });
  it("maksimal tiga penyelesaian per sesi termasuk pengulangan", () => {
    let p = {
      ...blankProfile(),
      session: {
        id: "test",
        completed: [],
        ended: false,
        startedAt: 0,
        durationMs: 0,
      },
    } as ReturnType<typeof blankProfile>;
    for (let i = 0; i < 3; i++) {
      const d = finished();
      p = { ...p, drafts: { [level.id]: d } };
      p = completeLevel(p, level, d);
    }
    expect(p.session?.completed).toHaveLength(3);
    expect(p.session?.ended).toBe(true);
    expect(p.badges).toHaveLength(1);
  });
});
