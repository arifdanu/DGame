import type { WorldObject } from "../../data/types";
import { OBJECTS, OBSTACLES, SPAWN, ZONES } from "../../data/world";
import {
  area,
  path,
  objects,
  npc,
  scatterTrees,
  directionSigns,
} from "../factories";
import { EXPANDED_RADIUS, type MapDefinition, type Area } from "../mapTypes";
const extra: Area[] = [
  area(
    "hill",
    "Bukit Observasi",
    [-13, -30],
    "⌕",
    "#a9b282",
    "Amati awan, burung, dan gunung dari bukit.",
    7,
  ),
  area(
    "bay",
    "Teluk Konservasi",
    [30, -10],
    "♧",
    "#73b9af",
    "Bersihkan teluk dan jaga rumah hewan pantai.",
    8,
  ),
  area(
    "trail",
    "Jalur Gunung",
    [10, -31],
    "△",
    "#ba9c86",
    "Kenali gunung api dari jalur kaki bukit yang aman.",
    7,
  ),
];
const areas: Area[] = [
  ...ZONES.map((z, i) => ({
    ...z,
    id: ["village", "beach", "forest", "lab"][i],
    radius: 8,
  })),
  area(
    "garden",
    "Taman Bintang",
    [-10, 14],
    "☆",
    "#d7b570",
    "Lima bintang untuk belajar berhitung.",
    6,
  ),
  ...extra,
];
const additions: WorldObject[] = [
  npc(
    "k-ranger",
    "Kak Rimba",
    [-12, -23],
    "Yuk naik ke Bukit Observasi! Kita mengamati alam tanpa mengganggunya.",
    2,
  ),
  npc(
    "k-coast",
    "Bu Lestari",
    [25, -7],
    "Benda yang kita buang bisa terbawa ke laut. Mari rawat Teluk Konservasi.",
  ),
  npc(
    "k-geologist",
    "Pak Bumi",
    [6, -26],
    "Krakatau ada di seberang. Jalur aman ini membantu kita mengenal batu dan tanah.",
    0,
  ),
  ...objects(
    "k-observe",
    "observe",
    ["Amati awan", "Amati burung", "Amati Krakatau"],
    [
      [-17, -29],
      [-13, -33],
      [-9, -29],
    ],
    true,
  ),
  ...objects(
    "k-clean",
    "trash",
    ["Botol plastik", "Bungkus makanan", "Kertas bekas"],
    [
      [28, -8],
      [32, -13],
      [29, -17],
    ],
  ),
  ...objects(
    "k-volcano",
    "observe",
    ["Papan batuan", "Papan kawah", "Papan tanah subur"],
    [
      [7, -30],
      [11, -34],
      [15, -29],
    ],
    true,
  ),
  {
    id: "k-board",
    name: "Papan misi Krakatau",
    kind: "board" as const,
    position: [-3, 9] as [number, number],
  },
  {
    id: "k-falls",
    name: "Air Terjun Pelangi",
    kind: "info" as const,
    position: [-31, -3] as [number, number],
    description:
      "Air mengalir dari tempat tinggi ke tempat rendah. Jaga sungai bersih agar hewan dan tumbuhan tetap sehat.",
  },
  {
    id: "k-lighthouse",
    name: "Mercusuar Teluk",
    kind: "info" as const,
    position: [30, 15] as [number, number],
    description:
      "Cahaya mercusuar membantu kapal mengenali pantai. Kita tetap di jalur darat yang aman.",
  },
  ...directionSigns(extra, "k"),
  ...[
    [-31, 4],
    [31, 19],
    [-22, -27],
  ].map((position, i) => ({
    id: `k-bonus-${i}`,
    name: "Bintang penjelajah",
    kind: "bonus" as const,
    position: position as [number, number],
  })),
];
const trees = scatterTrees(
  extra,
  72,
  25,
  [...OBJECTS, ...additions],
  EXPANDED_RADIUS,
);
const knowledge: Record<string, string> = {
  "k-observe-1":
    "Awan adalah kumpulan titik air atau kristal es kecil di langit. Coba perhatikan bentuknya dari bukit.",
  "k-observe-2":
    "Burung memakai sayap untuk bergerak. Kita mengamati dari jauh agar hewan tidak terganggu.",
  "k-observe-3":
    "Krakatau berada di seberang laut. Menara pulau ini membantu kita mengamati dari jarak aman.",
  "k-volcano-1":
    "Lava yang mendingin dan membeku dapat menjadi batuan. Batuan menyimpan cerita tentang bumi.",
  "k-volcano-2":
    "Kawah adalah bagian gunung api tempat gas dapat keluar. Pada permainan ini terlihat asap kecil; kita tetap di pulau pengamatan.",
  "k-volcano-3":
    "Material gunung api yang melapuk dapat menambah mineral tanah. Tumbuhan juga membutuhkan air, udara, dan cahaya.",
};
export const krakatauData: MapDefinition = {
  id: "krakatau",
  name: "Krakatau Pintar",
  description: "Dari desa yang akrab menuju bukit, teluk, dan penemuan baru.",
  theme: "#7fa874",
  radius: EXPANDED_RADIUS,
  spawn: SPAWN,
  ground: (x, z) => 3 * Math.max(0, 1 - Math.hypot(x + 13, z + 30) / 8),
  areas,
  objects: [
    ...OBJECTS,
    ...additions.map((o) => ({
      ...o,
      description: knowledge[o.id] || o.description,
    })),
  ],
  trees,
  obstacles: [
    ...OBSTACLES,
    ...trees.map((t) => ({ position: t.position, radius: 0.45, height: 4 })),
  ],
  paths: [
    path([0, -8], [0, -23]),
    path([0, -23], [-12, -23]),
    path([-12, -23], [-13, -30]),
    path([0, -23], [10, -31]),
    path([12, -6], [25, -7]),
    path([25, -7], [30, -13]),
    path([19, 13], [30, 15]),
    path([30, 15], [25, -7]),
    path([-14, -9], [-29, -8]),
    path([-29, -8], [-31, -3], "wood"),
    path([-29, -8], [-12, -23]),
    path([-19, 12], [-30, 7]),
  ],
  landmarks: [
    {
      id: "k-tower",
      name: "Menara Observasi",
      kind: "tower",
      position: [-13, -30],
    },
    {
      id: "k-beacon",
      name: "Mercusuar",
      kind: "lighthouse",
      position: [31, 12],
    },
    {
      id: "k-waterfall",
      name: "Air Terjun Pelangi",
      kind: "waterfall",
      position: [-33, -7],
    },
  ],
  missionIds: [
    "welcome",
    "science",
    "letters",
    "count",
    "k-observe",
    "k-clean",
    "k-volcano",
  ],
};
