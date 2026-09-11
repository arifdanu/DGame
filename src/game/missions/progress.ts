import type { ItemId, MissionId, Progress } from "../data/types";
export const freshProgress = (): Progress => ({
  avatar: 0,
  started: false,
  completed: [],
  items: [],
  stars: [],
  points: 0,
  badges: [],
  unlocked: ["village", "beach", "forest", "garden"],
  labRound: 0,
  activeMissions: [],
  trackedMission: null,
});
export const BADGES: Record<MissionId, string> = {
  welcome: "Sahabat Guru",
  science: "Peneliti Alam",
  letters: "Sahabat Huruf",
  count: "Bintang Berhitung",
};
export type Action =
  | { type: "start" }
  | { type: "item"; id: ItemId }
  | { type: "star"; id: string }
  | { type: "complete"; id: MissionId }
  | { type: "lab" };
export function applyProgress(p: Progress, a: Action): Progress {
  if (a.type === "start") return { ...p, started: true };
  if (a.type === "item") {
    if (!p.completed.includes("welcome") || p.items.includes(a.id)) return p;
    return { ...p, items: [...p.items, a.id], points: p.points + 1 };
  }
  if (a.type === "star") {
    if (
      !p.completed.includes("letters") ||
      p.stars.includes(a.id) ||
      !/^star-[0-4]$/.test(a.id)
    )
      return p;
    return { ...p, stars: [...p.stars, a.id], points: p.points + 1 };
  }
  if (a.type === "lab") {
    if (!p.completed.includes("science")) return p;
    return { ...p, labRound: p.labRound + 1, points: p.points + 2 };
  }
  if (p.completed.includes(a.id)) return p;
  if (a.id === "welcome" && !p.started) return p;
  if (
    a.id === "science" &&
    (scienceItems(p).length !== 3 || !p.completed.includes("welcome"))
  )
    return p;
  if (a.id === "letters" && !p.completed.includes("science")) return p;
  if (
    a.id === "count" &&
    (!p.completed.includes("letters") || countStars(p).length !== 5)
  )
    return p;
  return {
    ...p,
    completed: [...p.completed, a.id],
    points: p.points + 5,
    badges: [...p.badges, BADGES[a.id]],
    unlocked: a.id === "science" ? [...p.unlocked, "lab"] : p.unlocked,
  };
}
export function activeMission(p: Progress) {
  if (!p.completed.includes("welcome"))
    return {
      title: "Temui Bu Guru Sains",
      hint: "Ikuti penanda menuju Bu Guru.",
      index: 1,
      target: "teacher",
    };
  if (!p.completed.includes("science"))
    return {
      title: `Temukan Benda Sains ${scienceItems(p).length}/3`,
      hint:
        scienceItems(p).length === 3
          ? "Kembali ke Bu Guru untuk kuis."
          : "Cari batu, daun, dan kerang di pantai.",
      index: 2,
      target:
        scienceItems(p).length === 3
          ? "teacher"
          : ["rock", "leaf", "shell"].find(
              (id) => !p.items.includes(id as ItemId),
            )!,
    };
  if (!p.completed.includes("letters"))
    return {
      title: "Jelajahi Hutan Huruf",
      hint: "Temukan papan huruf di hutan.",
      index: 3,
      target: "letters",
    };
  if (!p.completed.includes("count"))
    return {
      title: `Hitung Bintang ${countStars(p).length}/5`,
      hint:
        countStars(p).length === 5
          ? "Kunjungi papan hitung di taman."
          : "Kumpulkan lima bintang di taman.",
      index: 4,
      target:
        countStars(p).length === 5
          ? "count"
          : Array.from({ length: 5 }, (_, i) => `star-${i}`).find(
              (id) => !p.stars.includes(id),
            )!,
    };
  return {
    title: "Pulau penuh penemuan!",
    hint: "Coba latihan baru di meja eksperimen.",
    index: 4,
    target: "lab",
  };
}

export const scienceItems = (p: Progress) =>
  p.items.filter((id) => ["rock", "leaf", "shell"].includes(id));
export const countStars = (p: Progress) =>
  p.stars.filter((id) => /^star-[0-4]$/.test(id));
