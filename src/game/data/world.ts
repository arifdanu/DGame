import type { WorldObject, Point } from "./types";
export const PROFILES = {
  dinar: {
    name: "Dinar",
    age: "7 tahun",
    level: "Kelas 2 SD",
    note: "Kata, hitungan & penemuan sains",
    icon: "🚀",
  },
  delisha: {
    name: "Delisha",
    age: "5 tahun",
    level: "Siap masuk SD",
    note: "Huruf, bentuk & angka pertama",
    icon: "🌼",
  },
};
export const AVATARS = [
  {
    name: "Si Penjelajah",
    role: "Anak laki-laki penjelajah",
    tag: "Selalu siap menemukan hal baru",
    color: "#e7a14a",
    hat: "#edcd86",
  },
  {
    name: "Si Peneliti",
    role: "Anak perempuan peneliti",
    tag: "Penuh ide dan rasa ingin tahu",
    color: "#e98783",
    hat: "#ca6980",
  },
  {
    name: "Si Ahli Alam",
    role: "Anak kecil ahli alam",
    tag: "Sahabat tumbuhan dan hewan",
    color: "#64b394",
    hat: "#428e6f",
  },
] as const;
export const ZONES = [
  {
    name: "Desa Belajar",
    icon: "⌂",
    text: "Teman baru, cerita baru.",
    position: [-12, 5] as Point,
    color: "#e6ab69",
  },
  {
    name: "Pantai Sains",
    icon: "◈",
    text: "Temukan keajaiban alam.",
    position: [19, 13] as Point,
    color: "#63b9cc",
  },
  {
    name: "Hutan Bahasa",
    icon: "♧",
    text: "Setiap huruf punya cerita.",
    position: [-14, -9] as Point,
    color: "#76a978",
  },
  {
    name: "Pusat Sains",
    icon: "⚗",
    text: "Ide kecil, penemuan besar.",
    position: [12, -8] as Point,
    color: "#b2a1c6",
  },
];
export const OBJECTS: WorldObject[] = [
  { id: "guide", name: "Pak Guru Alam", kind: "guide", position: [18, -12] },
  { id: "teacher", name: "Bu Guru Sains", kind: "teacher", position: [0, 3] },
  { id: "sign", name: "Peta petualangan", kind: "sign", position: [3, 9] },
  { id: "rock", name: "Batu", kind: "item", position: [15, 13] },
  { id: "leaf", name: "Daun", kind: "item", position: [19, 9] },
  { id: "shell", name: "Kerang", kind: "item", position: [22, 14] },
  {
    id: "letters",
    name: "Papan Hutan Huruf",
    kind: "letters",
    position: [-14, -9],
  },
  {
    id: "count",
    name: "Taman Hitung Bintang",
    kind: "count",
    position: [-9, 12],
  },
  ...[
    [-6, 12],
    [-8, 15],
    [-11, 16],
    [-14, 14],
    [-13, 10],
  ].map((position, i) => ({
    id: `star-${i}`,
    name: `Bintang ${i + 1}`,
    kind: "star" as const,
    position: position as Point,
  })),
  { id: "door", name: "Pintu Pusat Sains", kind: "door", position: [12, -6] },
  { id: "lab", name: "Meja eksperimen", kind: "lab", position: [17, -8] },
];
export interface Obstacle {
  position: Point;
  radius: number;
  height: number;
}
export const OBSTACLES: Obstacle[] = [
  { position: [-12, 3], radius: 2.9, height: 5 },
  { position: [-19, 0], radius: 2.7, height: 4.5 },
  { position: [-9, -3], radius: 2.5, height: 4.5 },
  { position: [12, -10], radius: 3, height: 5 },
  { position: [17, -8], radius: 0.8, height: 1.3 },
  { position: [6, 4], radius: 0.85, height: 0.6 },
];
export const TREES: { position: Point; scale: number; palm: boolean }[] = [
  [-23, -5],
  [-21, -10],
  [-22, -15],
  [-17, -18],
  [-11, -19],
  [-7, -17],
  [-18, -5],
  [-10, -12],
  [-5, -11],
  [-16, -13],
  [-25, 1],
  [-21, 7],
  [-19, 12],
  [-15, 20],
  [-5, 23],
  [4, 23],
  [8, 19],
  [24, 4],
  [22, -3],
  [21, -12],
  [16, -19],
  [7, -21],
  [0, -22],
  [-2, -16],
].map((p, i) => ({
  position: p as Point,
  scale: 0.8 + (i % 4) * 0.15,
  palm: i > 12 && i < 20,
}));
TREES.forEach((t) =>
  OBSTACLES.push({ position: t.position, radius: 0.5, height: 4 }),
);
export const SPAWN: Point = [0, 11];
export const WORLD_RADIUS = 27;
export const INTERACTION_RADIUS = 2.65;
