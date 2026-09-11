import type {
  AppData,
  Profile,
  ProfileId,
  AnswerRecord,
  Draft,
} from "../types";
export const STORAGE_KEY = "pulau-pintar:v1";
export const blankProfile = (): Profile => ({
  avatar: 0,
  limit: 15,
  badges: [],
  results: {},
  drafts: {},
  usage: {},
  session: null,
  tutorial: false,
});
export const initialData = (): AppData => ({
  schemaVersion: 1,
  pin: null,
  sound: true,
  selected: null,
  profiles: {
    delisha: blankProfile(),
    dinar: { ...blankProfile(), avatar: 1 },
  },
});
const obj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const strs = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const record = (v: unknown): v is AnswerRecord =>
  obj(v) &&
  num(v.attempts) &&
  Number.isInteger(v.attempts) &&
  num(v.help) &&
  typeof v.guided === "boolean" &&
  typeof v.firstCorrect === "boolean" &&
  typeof v.completed === "boolean";
const records = (v: unknown) => obj(v) && Object.values(v).every(record);
const draft = (v: unknown): v is Draft =>
  obj(v) &&
  num(v.index) &&
  Number.isInteger(v.index) &&
  v.index < 5 &&
  strs(v.input) &&
  ["none", "wrong", "correct", "guided"].includes(String(v.feedback)) &&
  records(v.records);
function profile(v: unknown): v is Profile {
  if (
    !obj(v) ||
    !num(v.avatar) ||
    !Number.isInteger(v.avatar) ||
    v.avatar > 3 ||
    ![10, 15, 20, 30].includes(Number(v.limit)) ||
    !strs(v.badges) ||
    !records(v.results) ||
    !obj(v.drafts) ||
    !Object.values(v.drafts).every(draft) ||
    (v.skillMs !== undefined &&
      (!obj(v.skillMs) ||
        !Object.entries(v.skillMs).every(
          ([key, value]) =>
            ["angka", "kata", "logika", "kebaikan"].includes(key) && num(value),
        ))) ||
    !obj(v.usage) ||
    !Object.entries(v.usage).every(
      ([k, n]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && num(n),
    ) ||
    typeof v.tutorial !== "boolean"
  )
    return false;
  const s = v.session;
  return (
    s === null ||
    (obj(s) &&
      typeof s.id === "string" &&
      strs(s.completed) &&
      s.completed.length <= 3 &&
      typeof s.ended === "boolean" &&
      num(s.startedAt) &&
      num(s.durationMs))
  );
}
export function validData(v: unknown): v is AppData {
  if (
    !obj(v) ||
    v.schemaVersion !== 1 ||
    typeof v.sound !== "boolean" ||
    ![null, "dinar", "delisha"].includes(v.selected as string | null) ||
    !obj(v.profiles) ||
    !profile(v.profiles.dinar) ||
    !profile(v.profiles.delisha)
  )
    return false;
  const pin = v.pin;
  return (
    pin === null ||
    (obj(pin) &&
      typeof pin.salt === "string" &&
      /^[0-9a-f]{32}$/.test(pin.salt) &&
      typeof pin.hash === "string" &&
      /^[0-9a-f]{64}$/.test(pin.hash) &&
      pin.iterations === 210000 &&
      num(pin.failures) &&
      num(pin.cooldownUntil))
  );
}
export interface StorageResult {
  data: AppData;
  warning: string;
  blocked: boolean;
}
export function readStorage(storage: Pick<Storage, "getItem">): StorageResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: initialData(), warning: "", blocked: false };
    const data: unknown = JSON.parse(raw);
    if (!validData(data)) throw new Error("schema");
    return { data, warning: "", blocked: false };
  } catch {
    return {
      data: initialData(),
      warning:
        "Data tersimpan tidak dapat dibaca. Data asli tetap dipertahankan. Orang tua perlu memulihkan data browser sebelum melanjutkan.",
      blocked: true,
    };
  }
}
export function writeStorage(
  storage: Pick<Storage, "setItem">,
  data: AppData,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
const listeners = new Set<() => void>();
let snapshot: StorageResult;
function readBrowser(): StorageResult {
  try {
    return readStorage(localStorage);
  } catch {
    return {
      data: initialData(),
      warning:
        "Penyimpanan browser tidak tersedia. Progres tidak dapat disimpan.",
      blocked: false,
    };
  }
}
export function getSnapshot() {
  return (snapshot ??= readBrowser());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit() {
  listeners.forEach((fn) => fn());
}
export function reloadStorage() {
  snapshot = readBrowser();
  emit();
}
export function updateData(fn: (d: AppData) => AppData) {
  const current = getSnapshot();
  if (current.blocked) return;
  let latest = current.data;
  try {
    const stored = readStorage(localStorage);
    if (stored.blocked) {
      snapshot = stored;
      emit();
      return;
    }
    if (localStorage.getItem(STORAGE_KEY) && !current.warning)
      latest = stored.data;
  } catch {
    /* Preserve the in-memory session when storage is unavailable. */
  }
  const next = fn(latest);
  let ok = false;
  try {
    ok = writeStorage(localStorage, next);
  } catch {
    /* A visible warning is shown below. */
  }
  snapshot = {
    data: next,
    blocked: false,
    warning: ok
      ? ""
      : "Progres tidak dapat disimpan. Jangan tutup halaman; minta orang tua memeriksa penyimpanan browser.",
  };
  emit();
}
export function updateProfile(id: ProfileId, fn: (p: Profile) => Profile) {
  updateData((d) => ({
    ...d,
    profiles: { ...d.profiles, [id]: fn(d.profiles[id]) },
  }));
}
if (typeof window !== "undefined")
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) reloadStorage();
  });
