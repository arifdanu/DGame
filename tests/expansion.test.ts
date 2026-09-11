import { describe, expect, it } from "vitest";
import { MAPS, mapUnlocked } from "../src/game/maps/mapRegistry";
import { ORIGINAL_RADIUS } from "../src/game/maps/mapTypes";
import { OBSTACLES, OBJECTS } from "../src/game/data/world";
import { freshProgress, applyProgress } from "../src/game/missions/progress";
import { MISSIONS } from "../src/game/missions/missionRegistry";
import {
  executeMissionCommand as command,
  missionStatus,
} from "../src/game/missions/MissionManager";
import {
  initialSave,
  migrateLegacy,
  validSave,
  freshPlayer,
} from "../src/game/utils/storage";
import { canStand } from "../src/game/player/physics";

describe("data-driven expansion", () => {
  it("preserves the original world and expands walkable footprint approximately fourfold", () => {
    for (const original of OBJECTS)
      expect(MAPS.krakatau.objects).toContainEqual(original);
    let oldArea = 0,
      newArea = 0;
    for (let x = -39; x <= 39; x += 0.5)
      for (let z = -39; z <= 39; z += 0.5) {
        if (
          canStand(x, z, 0, {
            radius: ORIGINAL_RADIUS,
            obstacles: OBSTACLES,
            ground: () => 0,
          })
        )
          oldArea++;
        for (const map of Object.values(MAPS))
          if (canStand(x, z, map.ground(x, z), map)) newArea++;
      }
    expect(newArea / oldArea).toBeGreaterThan(3.8);
    expect(newArea / oldArea).toBeLessThan(4.5);
    expect(MAPS.krakatau.areas).toHaveLength(8);
    expect(MAPS["raja-ampat"].areas).toHaveLength(7);
  });
  it("all new objectives and NPCs are inside the world and reachable on a connected walking grid", () => {
    for (const map of Object.values(MAPS)) {
      expect(new Set(map.objects.map((o) => o.id)).size).toBe(
        map.objects.length,
      );
      const seen = new Set<string>();
      const queue: [number, number][] = [[0, 11]];
      seen.add("0,11");
      for (let index = 0; index < queue.length; index++) {
        const [x, z] = queue[index];
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            nz = z + dz,
            key = `${nx},${nz}`;
          if (!seen.has(key) && canStand(nx, nz, map.ground(nx, nz), map)) {
            seen.add(key);
            queue.push([nx, nz]);
          }
        }
      }
      for (const o of map.objects.filter((o) =>
        ["npc", "quest", "bonus", "board"].includes(o.kind),
      )) {
        expect(Math.hypot(...o.position), o.id).toBeLessThan(map.radius);
        expect(
          queue.some(
            ([x, z]) => Math.hypot(x - o.position[0], z - o.position[1]) < 1.5,
          ),
          o.id,
        ).toBe(true);
      }
    }
  });
  for (const profile of ["dinar", "delisha"] as const)
    for (const mapId of ["krakatau", "raja-ampat"] as const) {
      it(`${profile} completes every expansion mission on ${mapId} once, with gated rewards`, () => {
        let p = freshProgress();
        if (mapId === "krakatau")
          p = {
            ...p,
            completed: ["welcome", "science"],
            items: ["rock", "leaf", "shell"],
          };
        for (const m of MISSIONS.filter((m) => m.mapId === mapId)) {
          expect(missionStatus(m, p)).toBe("available");
          expect(MAPS[mapId].objects.find((o) => o.id === m.npcId)?.kind).toBe(
            "npc",
          );
          expect(MAPS[mapId].areas.some((a) => a.id === m.areaId)).toBe(true);
          for (const q of Object.values(m.quiz))
            expect(q.options).toContain(q.answer);
          expect(m.quiz.dinar.prompt).not.toBe(m.quiz.delisha.prompt);
          expect(
            command(
              p,
              { type: "interact", objectId: m.objectives[0] },
              mapId,
              profile,
            ),
          ).toBe(p);
          p = command(p, { type: "accept", missionId: m.id }, mapId, profile);
          expect(missionStatus(m, p)).toBe("active");
          expect(
            command(
              p,
              {
                type: "answer",
                missionId: m.id,
                answer: m.quiz[profile].answer,
              },
              mapId,
              profile,
            ),
          ).toBe(p);
          for (const objectId of m.objectives) {
            p = command(p, { type: "interact", objectId }, mapId, profile);
            expect(
              command(p, { type: "interact", objectId }, mapId, profile),
            ).toBe(p);
          }
          expect(
            command(
              p,
              { type: "answer", missionId: m.id, answer: "wrong" },
              mapId,
              profile,
            ),
          ).toBe(p);
          const before = p.points;
          p = command(
            p,
            { type: "answer", missionId: m.id, answer: m.quiz[profile].answer },
            mapId,
            profile,
          );
          expect(p.points).toBe(before + m.reward.stars);
          expect(missionStatus(m, p)).toBe("completed");
          expect(
            command(
              p,
              {
                type: "answer",
                missionId: m.id,
                answer: m.quiz[profile].answer,
              },
              mapId,
              profile,
            ),
          ).toBe(p);
          const save = initialSave();
          save.profiles[profile].maps[mapId] = p;
          expect(validSave(save)).toBe(true);
        }
        if (mapId === "raja-ampat") expect(p.badges).toContain("Penjaga Laut");
      });
    }
  it("rejects locked and cross-map commands and awards bonuses once", () => {
    let p = freshProgress();
    expect(
      command(
        p,
        { type: "accept", missionId: "ra-water" },
        "raja-ampat",
        "dinar",
      ),
    ).toBe(p);
    expect(
      command(
        p,
        { type: "accept", missionId: "ra-clean" },
        "krakatau",
        "dinar",
      ),
    ).toBe(p);
    expect(
      command(
        p,
        { type: "interact", objectId: "ra-clean-1" },
        "krakatau",
        "dinar",
      ),
    ).toBe(p);
    p = command(
      p,
      { type: "interact", objectId: "ra-bonus-0" },
      "raja-ampat",
      "dinar",
    );
    expect(p.points).toBe(1);
    expect(
      command(
        p,
        { type: "interact", objectId: "ra-bonus-0" },
        "raja-ampat",
        "dinar",
      ),
    ).toBe(p);
  });
  it("migrates both v1 profiles without losing stars, avatars, lab rounds, or original data", () => {
    const p = {
      ...freshProgress(),
      started: true,
      avatar: 2,
      completed: ["welcome", "science", "letters", "count"],
      items: ["rock", "leaf", "shell"],
      stars: ["star-0", "star-1", "star-2", "star-3", "star-4"],
      points: 34,
      labRound: 3,
      badges: ["Peneliti Alam"],
      unlocked: ["lab"],
    };
    const legacy = {
      version: 1,
      active: "delisha",
      muted: true,
      profiles: { dinar: p, delisha: { ...freshProgress(), avatar: 1 } },
    };
    const original = JSON.stringify(legacy);
    const next = migrateLegacy(legacy)!;
    expect(validSave(next)).toBe(true);
    expect(next.profiles.dinar.maps.krakatau).toEqual(p);
    expect(next.profiles.dinar.avatar).toBe(2);
    expect(next.profiles.delisha.avatar).toBe(1);
    expect(next.profiles.dinar.maps["raja-ampat"].points).toBe(0);
    expect(JSON.stringify(legacy)).toBe(original);
    expect(migrateLegacy({ ...legacy, version: 99 })).toBeNull();
  });
  it("unlocks per profile and keeps map reset isolated", () => {
    const p = freshPlayer();
    expect(mapUnlocked("raja-ampat", p)).toBe(false);
    p.maps.krakatau = applyProgress(
      { ...p.maps.krakatau, started: true },
      { type: "complete", id: "welcome" },
    );
    expect(mapUnlocked("raja-ampat", p)).toBe(true);
    expect(mapUnlocked("raja-ampat", freshPlayer())).toBe(false);
    p.maps["raja-ampat"] = { ...freshProgress(), points: 10 };
    p.maps["raja-ampat"] = freshProgress();
    expect(p.maps.krakatau.points).toBe(5);
  });
});
