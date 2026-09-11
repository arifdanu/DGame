const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const unique = (v: unknown, allowed?: string[]): v is string[] =>
  Array.isArray(v) &&
  v.every((x) => typeof x === "string" && (!allowed || allowed.includes(x))) &&
  new Set(v).size === v.length;
const integer = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
function validProgress(v: unknown): boolean {
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
export function validLegacySave(v: unknown): boolean {
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
