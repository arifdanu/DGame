import { COMMUNITY_MISSIONS } from "../missions/communityMissions";
import type { MapDefinition, LandmarkData } from "./mapTypes";
import type { Point, WorldObject } from "../data/types";
import { area, npc, path } from "./factories";
/** Adds a populated outer loop while leaving every existing objective in place. */
export function withCommunityLayout(base: MapDefinition): MapDefinition {
  const missions = COMMUNITY_MISSIONS.filter((m) => m.mapId === base.id);
  const additions: WorldObject[] = missions.flatMap((m, index) => [
    npc(
      m.npcId,
      m.npcName,
      m.position,
      m.instruction,
      (index % 3) as 0 | 1 | 2,
    ),
    ...m.objectNames.map((name, i): WorldObject => ({
      id: m.objectives[i],
      name,
      kind: "quest",
      missionId: m.id,
      visual: m.visual,
      position: [
        m.position[0] + ((i % 3) - 1) * 3,
        m.position[1] + 4 + Math.floor(i / 3) * 3,
      ],
      keepAfterCollect: m.type !== "cleanup",
    })),
    ...(m.type === "cleanup"
      ? [
          {
            id: `${m.id}-bin`,
            name: "Pos sampah terpilah",
            kind: "info" as const,
            position: [m.position[0] + 3, m.position[1]] as Point,
            description:
              "Bawa empat sampah permainan ke Umi Dini di sebelah pos ini. Pilih tempat sampah saat kuis untuk menyelesaikan tugas.",
          },
        ]
      : []),
  ]);
  const landmarks: LandmarkData[] = missions
    .filter((m) => ["reading", "sequence"].includes(m.type))
    .map((m) => ({
      id: `${m.id}-hut`,
      name: m.areaName,
      kind: "house",
      position: [m.position[0] - 4, m.position[1] - 3],
      color: "#d3b479",
    }));
  const obstacles = [
    ...base.obstacles,
    ...landmarks.map((l) => ({ position: l.position, radius: 2.4, height: 4 })),
  ];
  const spawnPoints: Point[] = [base.spawn];
  // Deterministic safe seats; neither trees nor nearby task markers occupy them.
  for (const z of [11, 14, 17, 20])
    for (const x of [-3, 0, 3, -6, 6]) {
      const candidate: Point = [x, z];
      if (spawnPoints.length >= 4) break;
      if (
        spawnPoints.every((p) => Math.hypot(p[0] - x, p[1] - z) >= 2.8) &&
        obstacles.every(
          (o) =>
            Math.hypot(o.position[0] - x, o.position[1] - z) > o.radius + 1,
        ) &&
        base.objects.every(
          (o) => Math.hypot(o.position[0] - x, o.position[1] - z) > 2.8,
        )
      )
        spawnPoints.push(candidate);
    }
  return {
    ...base,
    spawnPoints,
    obstacles,
    areas: [
      ...base.areas,
      ...missions.map((m) =>
        area(
          m.areaId,
          m.areaName,
          m.position,
          "✦",
          "#abd29b",
          m.instruction,
          6,
        ),
      ),
    ],
    objects: [
      ...base.objects,
      ...additions,
      ...(base.id === "krakatau"
        ? [
            {
              id: "k-safe-route",
              name: "Rambu titik kumpul",
              kind: "info" as const,
              position: [19, -42] as Point,
              description:
                "Ini latihan mengenal rambu: berjalan tenang bersama pendamping mengikuti jalur menuju pos sekolah. Gunung berada di pulau terpisah dan tidak bisa dimasuki.",
            },
          ]
        : []),
    ],
    missionIds: [...base.missionIds, ...missions.map((m) => m.id)],
    landmarks: [...base.landmarks, ...landmarks],
    paths: [
      ...base.paths.map((p) => ({ ...p, width: Math.max(4, p.width) })),
      ...missions.flatMap((m, i) => [
        path(
          [m.position[0] * 0.64, m.position[1] * 0.64],
          m.position,
          base.id === "raja-ampat" ? "wood" : "sand",
          4.5,
        ),
        path(
          m.position,
          missions[(i + 1) % missions.length].position,
          "sand",
          4.5,
        ),
      ]),
    ],
  };
}
