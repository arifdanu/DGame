import type { Point, WorldObject } from "../data/types";
import type { Area, PathData, TreeData } from "./mapTypes";
export function area(
  id: string,
  name: string,
  position: Point,
  icon: string,
  color: string,
  text: string,
  radius = 9,
): Area {
  return { id, name, position, icon, color, text, radius };
}
export function path(
  a: Point,
  b: Point,
  kind: PathData["kind"] = "sand",
  width = 3,
): PathData {
  return { a, b, kind, width };
}
export function objects(
  missionId: string,
  visual: WorldObject["visual"],
  names: string[],
  points: Point[],
  keep = false,
): WorldObject[] {
  return points.map((position, i) => ({
    id: `${missionId}-${i + 1}`,
    name: names[i],
    kind: "quest",
    position,
    visual,
    missionId,
    keepAfterCollect: keep,
  }));
}
export function npc(
  id: string,
  name: string,
  position: Point,
  description: string,
  npcAvatar: 0 | 1 | 2 = 1,
): WorldObject {
  return { id, name, position, description, npcAvatar, kind: "npc" };
}
export function scatterTrees(
  areas: Area[],
  seed: number,
  count: number,
  avoid: WorldObject[],
  radius: number,
): TreeData[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const result: TreeData[] = [];
  for (let i = 0; i < count * 15 && result.length < count; i++) {
    const zone = areas[Math.floor(random() * areas.length)],
      angle = random() * Math.PI * 2,
      r = zone.radius * (0.6 + random() * 0.6);
    const position: Point = [
      zone.position[0] + Math.cos(angle) * r,
      zone.position[1] + Math.sin(angle) * r,
    ];
    if (
      Math.hypot(...position) > radius - 1 ||
      avoid.some(
        (o) =>
          Math.hypot(o.position[0] - position[0], o.position[1] - position[1]) <
          3,
      ) ||
      result.some(
        (t) =>
          Math.hypot(t.position[0] - position[0], t.position[1] - position[1]) <
          2.8,
      )
    )
      continue;
    result.push({
      position,
      scale: 0.7 + random() * 0.5,
      kind: zone.id.includes("mangrove")
        ? "mangrove"
        : zone.id.includes("beach") || zone.id.includes("village")
          ? "palm"
          : "tree",
    });
  }
  return result;
}
export function directionSigns(areas: Area[], prefix: string): WorldObject[] {
  return areas.map((a) => ({
    id: `${prefix}-sign-${a.id}`,
    name: `Petunjuk ${a.name}`,
    kind: "info",
    position: [a.position[0] + 2, a.position[1] + 3],
    description: `${a.name}. ${a.text} Buka peta untuk melihat tujuan misimu.`,
  }));
}
