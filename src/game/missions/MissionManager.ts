import type { MapId, ProfileId, Progress } from "../data/types";
import { MAPS } from "../maps/mapRegistry";
import type {
  MissionCommand,
  MissionDefinition,
  MissionStatus,
} from "./missionTypes";
import { MISSION_BY_ID, MISSIONS } from "./missionRegistry";
import { activeMission } from "./progress";
export function missionStatus(
  m: MissionDefinition,
  p: Progress,
): MissionStatus {
  if (p.completed.includes(m.id)) return "completed";
  if (!m.prerequisites.every((id) => p.completed.includes(id))) return "locked";
  return p.activeMissions.includes(m.id) ? "active" : "available";
}
export const objectiveCount = (m: MissionDefinition, p: Progress) =>
  m.objectives.filter((id) => p.items.includes(id)).length;
export function executeMissionCommand(
  p: Progress,
  command: MissionCommand,
  mapId: MapId,
  profile: ProfileId,
): Progress {
  const map = MAPS[mapId];
  if (command.type === "interact") {
    const object = map.objects.find((o) => o.id === command.objectId);
    if (!object) return p;
    if (object.kind === "bonus")
      return p.stars.includes(object.id)
        ? p
        : { ...p, stars: [...p.stars, object.id], points: p.points + 1 };
    const m = object.missionId ? MISSION_BY_ID[object.missionId] : null;
    if (
      !m ||
      missionStatus(m, p) !== "active" ||
      p.items.includes(object.id) ||
      !m.objectives.includes(object.id)
    )
      return p;
    return { ...p, items: [...p.items, object.id], points: p.points + 1 };
  }
  const m = MISSION_BY_ID[command.missionId];
  if (!m || m.mapId !== mapId) return p;
  if (command.type === "track") return { ...p, trackedMission: m.id };
  const status = missionStatus(m, p);
  if (command.type === "accept")
    return status === "available"
      ? {
          ...p,
          activeMissions: [...p.activeMissions, m.id],
          trackedMission: m.id,
        }
      : p;
  if (
    status !== "active" ||
    objectiveCount(m, p) !== m.objectives.length ||
    command.answer !== m.quiz[profile].answer
  )
    return p;
  return {
    ...p,
    completed: [...p.completed, m.id],
    activeMissions: p.activeMissions.filter((id) => id !== m.id),
    trackedMission: null,
    points: p.points + m.reward.stars,
    badges: [...new Set([...p.badges, m.reward.badge])],
    unlocked: m.reward.unlock
      ? [...new Set([...p.unlocked, m.reward.unlock])]
      : p.unlocked,
  };
}
export function currentObjective(p: Progress, mapId: MapId) {
  const map = MAPS[mapId];
  let selected = p.trackedMission ? MISSION_BY_ID[p.trackedMission] : undefined;
  if (selected && missionStatus(selected, p) === "completed")
    selected = undefined;
  if (!selected && mapId === "krakatau" && !p.completed.includes("count"))
    return { ...activeMission(p), total: map.missionIds.length };
  selected ??=
    MISSIONS.find(
      (m) => m.mapId === mapId && missionStatus(m, p) === "active",
    ) ||
    MISSIONS.find(
      (m) => m.mapId === mapId && missionStatus(m, p) === "available",
    );
  if (!selected)
    return {
      title: "Semua misi selesai!",
      hint: "Jelajahi landmark atau kunjungi map lainnya.",
      index: map.missionIds.length,
      total: map.missionIds.length,
      target: mapId === "krakatau" ? "lab" : "ra-board",
    };
  const status = missionStatus(selected, p),
    count = objectiveCount(selected, p),
    complete = count === selected.objectives.length;
  const target =
    status !== "active" || complete
      ? selected.npcId
      : selected.objectives.find((id) => !p.items.includes(id))!;
  return {
    title: selected.title,
    hint:
      status === "locked"
        ? "Selesaikan misi sebelumnya."
        : status === "available"
          ? "Temui guru untuk menerima misi."
          : complete
            ? "Kembali ke guru untuk kuis dan hadiah."
            : `${selected.objectiveLabel}: ${count}/${selected.objectives.length}`,
    index: map.missionIds.indexOf(selected.id) + 1,
    total: map.missionIds.length,
    target,
  };
}
