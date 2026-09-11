import { describe, expect, it } from "vitest";
import {
  activeMission,
  applyProgress,
  freshProgress,
} from "../src/game/missions/progress";
import { getQuiz } from "../src/game/data/quizzes";
import { initialSave, validSave } from "../src/game/utils/storage";
import {
  canStand,
  moveWithCollision,
  groundHeight,
  safeCamera,
} from "../src/game/player/physics";
import type { Progress } from "../src/game/data/types";
function scienceReady(): Progress {
  let p = applyProgress(freshProgress(), { type: "start" });
  p = applyProgress(p, { type: "complete", id: "welcome" });
  for (const id of ["rock", "leaf", "shell"] as const)
    p = applyProgress(p, { type: "item", id });
  return p;
}
describe("Krakatau mission rules", () => {
  it("requires the teacher before collection and does not allow skipping missions", () => {
    const p = freshProgress();
    expect(applyProgress(p, { type: "item", id: "rock" })).toEqual(p);
    expect(applyProgress(p, { type: "complete", id: "science" })).toEqual(p);
    expect(applyProgress(p, { type: "complete", id: "count" })).toEqual(p);
    expect(applyProgress(p, { type: "star", id: "star-0" })).toEqual(p);
    expect(applyProgress(p, { type: "lab" })).toEqual(p);
  });
  it("rewards a complete expedition once and unlocks the lab", () => {
    let p = scienceReady();
    expect(p.points).toBe(8);
    expect(applyProgress(p, { type: "item", id: "rock" })).toEqual(p);
    expect(activeMission(p).target).toBe("teacher");
    p = applyProgress(p, { type: "complete", id: "science" });
    expect(p.unlocked).toContain("lab");
    expect(applyProgress(p, { type: "complete", id: "science" })).toEqual(p);
    p = applyProgress(p, { type: "complete", id: "letters" });
    for (let i = 0; i < 5; i++)
      p = applyProgress(p, { type: "star", id: `star-${i}` });
    expect(applyProgress(p, { type: "star", id: "star-0" })).toEqual(p);
    expect(applyProgress(p, { type: "star", id: "star-99" })).toEqual(p);
    p = applyProgress(p, { type: "complete", id: "count" });
    expect(p.points).toBe(28);
    expect(p.badges).toHaveLength(4);
    expect(p.completed).toHaveLength(4);
    expect(activeMission(p).target).toBe("lab");
    const save = initialSave();
    save.profiles.dinar.maps.krakatau = p;
    expect(validSave(JSON.parse(JSON.stringify(save)))).toBe(true);
    expect(save.profiles.delisha.maps.krakatau.points).toBe(0);
  });
  it("keeps an unfinished science quiz recoverable after refresh", () => {
    const p = JSON.parse(JSON.stringify(scienceReady()));
    expect(activeMission(p).target).toBe("teacher");
    expect(p.completed).not.toContain("science");
    expect(applyProgress(p, { type: "complete", id: "science" }).points).toBe(
      13,
    );
  });
});
describe("age-adjusted learning and save validation", () => {
  it("uses matching for Delisha and word construction for Dinar", () => {
    expect(getQuiz("delisha", "letters").options).toContain("🍎 Apel");
    expect(getQuiz("dinar", "letters").order).toBe(true);
    expect(getQuiz("dinar", "count").answer).toBe("12");
    expect(getQuiz("delisha", "count").answer).toBe("5");
    expect(getQuiz("dinar", "lab", 0).answer).toBe("8");
    expect(getQuiz("dinar", "lab", 1).answer).toBe("6");
    expect(getQuiz("delisha", "lab", 1).answer).toBe("Lingkaran");
  });
  it("rejects corrupted, duplicated, or impossible progress", () => {
    const s = initialSave();
    expect(validSave(s)).toBe(true);
    expect(validSave({ ...s, version: 99 })).toBe(false);
    expect(
      validSave({
        ...s,
        profiles: { ...s.profiles, dinar: { ...s.profiles.dinar, avatar: 3 } },
      }),
    ).toBe(false);
    expect(
      validSave({
        ...s,
        profiles: {
          ...s.profiles,
          dinar: {
            ...s.profiles.dinar,
            maps: {
              ...s.profiles.dinar.maps,
              krakatau: {
                ...s.profiles.dinar.maps.krakatau,
                items: ["rock", "rock"],
              },
            },
          },
        },
      }),
    ).toBe(false);
    expect(
      validSave({
        ...s,
        profiles: {
          ...s.profiles,
          dinar: {
            ...s.profiles.dinar,
            maps: {
              ...s.profiles.dinar.maps,
              krakatau: {
                ...s.profiles.dinar.maps.krakatau,
                completed: ["count"],
              },
            },
          },
        },
      }),
    ).toBe(false);
  });
});
describe("safe movement and camera", () => {
  it("stays on the island and blocks solid buildings", () => {
    expect(canStand(28, 0, 0)).toBe(false);
    expect(canStand(-12, 3, 0)).toBe(false);
    expect(moveWithCollision(26.9, 0, 1, 0, 0)).toEqual([26.9, 0]);
    expect(canStand(0, 11, 0)).toBe(true);
  });
  it("permits jumping onto a low rock but not walking through it", () => {
    expect(canStand(6, 4, 0)).toBe(false);
    expect(canStand(6, 4, 1)).toBe(true);
    expect(groundHeight(6, 4, 1)).toBe(0.6);
    expect(groundHeight(8, 4, 1)).toBe(0);
  });
  it("shortens the camera sight line before a house", () => {
    const camera = safeCamera({ x: -12, y: 1.4, z: 8 }, { x: -12, y: 4, z: 0 });
    expect(camera.z).toBeGreaterThan(5.9);
    expect(camera.y).toBeGreaterThanOrEqual(1.5);
  });
});
