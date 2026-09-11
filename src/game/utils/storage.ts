import { useSyncExternalStore } from "react";
import type {
  SaveData,
  Progress,
  ProfileId,
  PlayerProgress,
  MapId,
} from "../data/types";
import { freshProgress } from "../missions/progress";
import { MAPS } from "../maps/mapRegistry";
import { validLegacySave } from "../storage/legacyValidation";
export const SAVE_KEY = "krakatau-pintar:v2";
export const LEGACY_SAVE_KEY = "krakatau-pintar:v1";
export const freshPlayer = (): PlayerProgress => ({
  avatar: 0,
  started: false,
  lastMap: "krakatau",
  maps: {
    krakatau: freshProgress(),
    "raja-ampat": {
      ...freshProgress(),
      unlocked: MAPS["raja-ampat"].areas.map((a) => a.id),
    },
  },
});
export const initialSave = (): SaveData => ({
  version: 2,
  active: null,
  muted: false,
  profiles: { dinar: freshPlayer(), delisha: freshPlayer() },
});
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const unique = (v: unknown, allowed?: string[]): v is string[] =>
  Array.isArray(v) &&
  v.every((x) => typeof x === "string" && (!allowed || allowed.includes(x))) &&
  new Set(v).size === v.length;
const integer = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
function validProgress(v: unknown, mapId: MapId): v is Progress {
  if (
    !obj(v) ||
    ![0, 1, 2].includes(v.avatar as number) ||
    typeof v.started !== "boolean" ||
    !integer(v.points) ||
    !integer(v.labRound)
  )
    return false;
  const map = MAPS[mapId];
  if (
    !unique(v.completed, map.missionIds) ||
    !unique(
      v.items,
      map.objects
        .filter((o) => o.kind === "item" || o.kind === "quest")
        .map((o) => o.id),
    ) ||
    !unique(
      v.stars,
      map.objects
        .filter((o) => o.kind === "star" || o.kind === "bonus")
        .map((o) => o.id),
    ) ||
    !unique(v.badges) ||
    !unique(v.unlocked) ||
    !unique(v.activeMissions, map.missionIds)
  )
    return false;
  if (
    v.trackedMission !== null &&
    !map.missionIds.includes(v.trackedMission as string)
  )
    return false;
  if (v.activeMissions.some((id) => (v.completed as string[]).includes(id)))
    return false;
  if (mapId === "krakatau") {
    if (
      v.completed.includes("science") &&
      (!["rock", "leaf", "shell"].every((id) =>
        (v.items as string[]).includes(id),
      ) ||
        !v.completed.includes("welcome"))
    )
      return false;
    if (v.completed.includes("letters") && !v.completed.includes("science"))
      return false;
    if (
      v.completed.includes("count") &&
      (!v.completed.includes("letters") ||
        ![0, 1, 2, 3, 4].every((i) =>
          (v.stars as string[]).includes(`star-${i}`),
        ))
    )
      return false;
  }
  return true;
}
function validPlayer(v: unknown): v is PlayerProgress {
  return (
    obj(v) &&
    [0, 1, 2].includes(v.avatar as number) &&
    typeof v.started === "boolean" &&
    ["krakatau", "raja-ampat"].includes(v.lastMap as string) &&
    obj(v.maps) &&
    validProgress(v.maps.krakatau, "krakatau") &&
    validProgress(v.maps["raja-ampat"], "raja-ampat")
  );
}
export function validSave(v: unknown): v is SaveData {
  return (
    obj(v) &&
    v.version === 2 &&
    [null, "dinar", "delisha"].includes(v.active as string | null) &&
    typeof v.muted === "boolean" &&
    obj(v.profiles) &&
    validPlayer(v.profiles.dinar) &&
    validPlayer(v.profiles.delisha)
  );
}
export function migrateLegacy(v: unknown): SaveData | null {
  if (!validLegacySave(v)) return null;
  const legacy = v as {
    active: ProfileId | null;
    muted: boolean;
    profiles: Record<ProfileId, Progress>;
  };
  const next = initialSave();
  next.active = legacy.active;
  next.muted = legacy.muted;
  for (const id of ["dinar", "delisha"] as const) {
    const old = legacy.profiles[id];
    next.profiles[id] = {
      ...freshPlayer(),
      avatar: old.avatar,
      started: old.started,
      maps: {
        ...freshPlayer().maps,
        krakatau: { ...old, activeMissions: [], trackedMission: null },
      },
    };
  }
  return next;
}
let warning = "",
  blocked = false;
function read(): SaveData {
  warning = "";
  blocked = false;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!validSave(parsed)) throw new Error("invalid");
      return parsed;
    }
    const old = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!old) return initialSave();
    const migrated = migrateLegacy(JSON.parse(old));
    if (!migrated) throw new Error("invalid");
    // Preserve the original v1 record as a backup; never overwrite it during migration.
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
    } catch {
      warning =
        "Migrasi siap, tetapi penyimpanan penuh. Biarkan halaman terbuka sampai progres dapat disimpan.";
    }
    return migrated;
  } catch (e) {
    blocked =
      e instanceof SyntaxError ||
      (e instanceof Error && e.message === "invalid");
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
  const next = fn(data);
  if (!validSave(next)) throw new Error("Perubahan progres tidak valid");
  data = next;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    warning = "";
  } catch {
    warning =
      "Progres belum tersimpan. Kosongkan ruang penyimpanan sebelum menutup halaman.";
  }
  emit();
}
export function updatePlayer(
  id: ProfileId,
  fn: (p: PlayerProgress) => PlayerProgress,
) {
  updateSave((d) => ({
    ...d,
    profiles: { ...d.profiles, [id]: fn(d.profiles[id]) },
  }));
}
export function updateProgress(
  id: ProfileId,
  fn: (p: Progress) => Progress,
  mapId?: MapId,
) {
  updatePlayer(id, (p) => {
    const map = mapId || p.lastMap;
    return { ...p, maps: { ...p.maps, [map]: fn(p.maps[map]) } };
  });
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
