import { expect, type Page } from "@playwright/test";
import { MAPS } from "../../src/game/maps/mapRegistry";
import type { MapId } from "../../src/game/data/types";
async function pos(page: Page): Promise<[number, number]> {
  return page
    .locator(".minimap-button svg circle")
    .last()
    .evaluate((el) => [
      Number(el.getAttribute("cx")),
      Number(el.getAttribute("cy")),
    ]);
}
function route(start: [number, number], goal: [number, number], mapId: MapId) {
  const map = MAPS[mapId];
  const clear = (x: number, z: number) =>
    Math.hypot(x, z) < map.radius - 0.3 &&
    !map.obstacles.some(
      (o) => Math.hypot(x - o.position[0], z - o.position[1]) < o.radius + 0.8,
    );
  const line = (a: [number, number], b: [number, number]) => {
    const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) * 5);
    for (let i = 0; i <= n; i++) {
      const t = i / (n || 1);
      if (!clear(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        return false;
    }
    return true;
  };
  const segments = (
    a: [number, number],
    b: [number, number],
  ): [number, number][] => {
    const n = Math.max(
      1,
      Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2),
    );
    return Array.from({ length: n }, (_, i) => [
      a[0] + ((b[0] - a[0]) * (i + 1)) / n,
      a[1] + ((b[1] - a[1]) * (i + 1)) / n,
    ]);
  };
  if (line(start, goal)) return segments(start, goal);
  const s: [number, number] = [Math.round(start[0]), Math.round(start[1])];
  const queue: [number, number][] = [s],
    seen = new Map<string, [number, number] | null>([[s.join(","), null]]);
  let found: [number, number] | undefined;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (Math.hypot(p[0] - goal[0], p[1] - goal[1]) < 1.5 && line(p, goal)) {
      found = p;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const q: [number, number] = [p[0] + dx, p[1] + dz];
      if (!seen.has(q.join(",")) && clear(...q)) {
        seen.set(q.join(","), p);
        queue.push(q);
      }
    }
  }
  if (!found) throw Error(`No route ${start} -> ${goal}`);
  const path: [number, number][] = [goal];
  let cursor: [number, number] | null = found;
  while (cursor) {
    path.push(cursor);
    cursor = seen.get(cursor.join(","))!;
  }
  path.reverse();
  const smooth: [number, number][] = [];
  let from = start,
    index = 0;
  while (index < path.length) {
    let far = index;
    for (let j = index; j < path.length; j++) {
      if (line(from, path[j])) far = j;
      else break;
    }
    smooth.push(path[far]);
    from = path[far];
    index = far + 1;
  }
  return smooth.flatMap((p, i) => segments(i ? smooth[i - 1] : start, p));
}
export async function walk(page: Page, goal: [number, number], mapId: MapId) {
  for (const [x, z] of route(await pos(page), goal, mapId)) {
    const end = Date.now() + 22000;
    let held: string[] = [];
    let reached = false;
    try {
      while (Date.now() < end) {
        const [px, pz] = await pos(page),
          dx = x - px,
          dz = z - pz;
        if (Math.hypot(dx, dz) < 0.55) {
          reached = true;
          break;
        }
        const next = [
          ...(Math.abs(dx) > 0.25 ? [dx > 0 ? "d" : "a"] : []),
          ...(Math.abs(dz) > 0.25 ? [dz > 0 ? "s" : "w"] : []),
        ];
        for (const k of held) if (!next.includes(k)) await page.keyboard.up(k);
        for (const k of next)
          if (!held.includes(k)) await page.keyboard.down(k);
        held = next;
        await page.waitForTimeout(70);
      }
    } finally {
      for (const k of held) await page.keyboard.up(k);
    }
    expect(reached, `walk to ${x},${z}; actual ${await pos(page)}`).toBe(true);
  }
}
export async function interact(page: Page, id: string, mapId: MapId) {
  const o = MAPS[mapId].objects.find((o) => o.id === id)!;
  const map = MAPS[mapId];
  const candidate: [number, number][] = [
    o.position,
    ...[0.6, 1.2].flatMap((r) =>
      Array.from({ length: 8 }, (_, i): [number, number] => [
        o.position[0] + Math.cos((i * Math.PI) / 4) * r,
        o.position[1] + Math.sin((i * Math.PI) / 4) * r,
      ]),
    ),
  ];
  const goal = candidate.find(
    ([x, z]) =>
      Math.hypot(x, z) < map.radius - 0.3 &&
      !map.obstacles.some(
        (b) =>
          Math.hypot(x - b.position[0], z - b.position[1]) < b.radius + 0.8,
      ),
  );
  if (!goal) throw Error(`No approach to ${id}`);
  await walk(page, goal, mapId);
  await expect(page.locator(".interaction-prompt")).toContainText(o.name);
  await page.keyboard.press("e");
  if (o.kind === "quest" && o.description) {
    await expect(
      page.getByRole("dialog", { name: o.name, exact: true }),
    ).toContainText(o.description);
    await page
      .getByRole("button", { name: "Tutup", exact: true })
      .first()
      .click();
  }
}
