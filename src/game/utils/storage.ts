import { useSyncExternalStore } from "react";
import type { SaveData, Progress, ProfileId } from "../data/types";
import { freshProgress } from "../missions/progress";
export const SAVE_KEY = "krakatau-pintar:v1";
export const initialSave = (): SaveData => ({
  version: 1,
  active: null,
  muted: false,
  profiles: { dinar: freshProgress(), delisha: freshProgress() },
});
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const unique = (v: unknown, allowed?: string[]): v is string[] =>
  Array.isArray(v) &&
  v.every((x) => typeof x === "string" && (!allowed || allowed.includes(x))) &&
  new Set(v).size === v.length;
const integer = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
function validProgress(v: unknown): v is Progress {
  if (
    !object(v) ||
    ![0, 1, 2].includes(Number(v.avatar)) ||
    typeof v.avatar !== "number" ||
    typeof v.started !== "boolean" ||
    !integer(v.points) ||
    !integer(v.labRound)
  )
    return false;
  if (
    !unique(v.completed, ["welcome", "science", "letters", "count"]) ||
    !unique(v.items, ["rock", "leaf", "shell"]) ||
    !unique(v.stars, ["star-0", "star-1", "star-2", "star-3", "star-4"]) ||
    !unique(v.badges) ||
    !unique(v.unlocked)
  )
    return false;
  if (
    v.completed.includes("science") &&
    (v.items.length !== 3 || !v.completed.includes("welcome"))
  )
    return false;
  if (v.completed.includes("letters") && !v.completed.includes("science"))
    return false;
  if (
    v.completed.includes("count") &&
    (v.stars.length !== 5 || !v.completed.includes("letters"))
  )
    return false;
  return true;
}
export function validSave(v: unknown): v is SaveData {
  return (
    object(v) &&
    v.version === 1 &&
    [null, "dinar", "delisha"].includes(v.active as string | null) &&
    typeof v.muted === "boolean" &&
    object(v.profiles) &&
    validProgress(v.profiles.dinar) &&
    validProgress(v.profiles.delisha)
  );
}
let warning = "";
let blocked = false;
function read(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialSave();
    const data: unknown = JSON.parse(raw);
    if (!validSave(data)) throw new Error("invalid");
    return data;
  } catch (error) {
    blocked =
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === "invalid");
    warning = blocked
      ? "Data petualangan perlu diperiksa. Data asli tetap disimpan; lihat panduan pemulihan di README."
      : "Penyimpanan browser tidak tersedia. Progres hanya bertahan selama halaman ini terbuka.";
    return initialSave();
  }
}
let data = read();
let snapshot = { data, warning, blocked };
const listeners = new Set<() => void>();
function emit() {
  snapshot = { data, warning, blocked };
  listeners.forEach((fn) => fn());
}
export function updateSave(fn: (d: SaveData) => SaveData) {
  if (blocked) return;
  data = fn(data);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    warning = "";
  } catch {
    warning =
      "Progres belum tersimpan. Kosongkan ruang penyimpanan sebelum menutup halaman.";
  }
  emit();
}
export function updateProgress(id: ProfileId, fn: (p: Progress) => Progress) {
  updateSave((d) => ({
    ...d,
    profiles: { ...d.profiles, [id]: fn(d.profiles[id]) },
  }));
}
window.addEventListener("storage", (e) => {
  if (e.key === SAVE_KEY || e.key === null) {
    data = read();
    emit();
  }
});
export function useSave() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => snapshot,
  );
}
