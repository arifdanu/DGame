import { OBSTACLES, WORLD_RADIUS } from "../data/world";
export function canStand(x: number, z: number, feet: number) {
  return (
    Math.hypot(x, z) <= WORLD_RADIUS &&
    !OBSTACLES.some(
      (o) =>
        Math.hypot(x - o.position[0], z - o.position[1]) < o.radius + 0.36 &&
        feet < o.height,
    )
  );
}
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  feet: number,
) {
  // Axis separation permits sliding along walls without walking through them.
  const nx = canStand(x + dx, z, feet) ? x + dx : x;
  const nz = canStand(nx, z + dz, feet) ? z + dz : z;
  return [nx, nz] as const;
}
export function groundHeight(x: number, z: number, previousFeet: number) {
  let ground = 0;
  for (const o of OBSTACLES)
    if (
      o.height < 1.5 &&
      previousFeet >= o.height &&
      Math.hypot(x - o.position[0], z - o.position[1]) < o.radius + 0.36
    )
      ground = Math.max(ground, o.height);
  return ground;
}
export function safeCamera(
  target: { x: number; y: number; z: number },
  desired: { x: number; y: number; z: number },
) {
  // Sample the sight line against the same solid proxies as player collision.
  for (let step = 1; step <= 32; step++) {
    const t = step / 32,
      x = target.x + (desired.x - target.x) * t,
      y = target.y + (desired.y - target.y) * t,
      z = target.z + (desired.z - target.z) * t;
    if (
      OBSTACLES.some(
        (o) =>
          y < o.height + 0.25 &&
          Math.hypot(x - o.position[0], z - o.position[1]) < o.radius + 0.25,
      )
    ) {
      const safe = Math.max(0, (step - 2) / 32);
      return {
        x: target.x + (desired.x - target.x) * safe,
        y: Math.max(1.5, target.y + (desired.y - target.y) * safe),
        z: target.z + (desired.z - target.z) * safe,
      };
    }
  }
  return desired;
}
