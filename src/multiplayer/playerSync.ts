import type {
  MultiplayerPlayer,
  PlayerPose,
  RoomMetadata,
  RoomPresence,
} from "./types";
import { validNickname, validRoomCode } from "./roomCode";
import { EXPANDED_RADIUS } from "../game/maps/mapTypes";
export const SEND_INTERVAL = 100;
export const STALE_AFTER = 3500;
export const REMOVE_AFTER = 7000;
export const MAX_PLAYERS = 4;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const validId = (v: unknown): v is string =>
  typeof v === "string" && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export function readPlayer(v: unknown): MultiplayerPlayer | null {
  if (
    !record(v) ||
    !record(v.position) ||
    !validId(v.playerId) ||
    !validNickname(v.nickname) ||
    !["0", "1", "2"].includes(v.avatarId as string) ||
    !["dinar", "delisha"].includes(v.profileId as string) ||
    !["krakatau", "raja-ampat"].includes(v.mapId as string) ||
    !["idle", "walking", "jumping"].includes(v.animation as string) ||
    !["lobby", "playing", "paused"].includes(v.status as string) ||
    !finite(v.rotation) ||
    Math.abs(v.rotation) > Math.PI + 0.001 ||
    !finite(v.lastSeen)
  )
    return null;
  const { x, y, z } = v.position;
  if (
    !finite(x) ||
    !finite(y) ||
    !finite(z) ||
    Math.hypot(x, z) > EXPANDED_RADIUS + 0.5 ||
    y < -0.5 ||
    y > 12
  )
    return null;
  // Explicit projection: inventory, progress, arbitrary text and extra properties never propagate.
  return {
    playerId: v.playerId,
    nickname: v.nickname,
    avatarId: v.avatarId as MultiplayerPlayer["avatarId"],
    profileId: v.profileId as MultiplayerPlayer["profileId"],
    mapId: v.mapId as MultiplayerPlayer["mapId"],
    position: { x, y, z },
    rotation: v.rotation,
    animation: v.animation as MultiplayerPlayer["animation"],
    lastSeen: v.lastSeen,
    status: v.status as MultiplayerPlayer["status"],
  };
}
export function readRoom(v: unknown): RoomMetadata | null {
  if (
    !record(v) ||
    !validRoomCode(v.roomCode) ||
    !validId(v.roomId) ||
    !validId(v.hostId) ||
    !["krakatau", "raja-ampat"].includes(v.mapId as string) ||
    !finite(v.createdAt) ||
    v.createdAt < 0
  )
    return null;
  return {
    roomCode: v.roomCode,
    roomId: v.roomId,
    hostId: v.hostId,
    mapId: v.mapId as RoomMetadata["mapId"],
    createdAt: v.createdAt,
  };
}
export function readPresence(v: unknown): RoomPresence | null {
  if (!record(v) || v.version !== 1 || !validId(v.roomId)) return null;
  const player = readPlayer(v.player),
    room = v.room === undefined ? undefined : readRoom(v.room);
  if (
    !player ||
    room === null ||
    (room &&
      (room.hostId !== player.playerId ||
        room.roomId !== v.roomId ||
        room.mapId !== player.mapId))
  )
    return null;
  return { version: 1, player, roomId: v.roomId, ...(room ? { room } : {}) };
}
export function interpolatePose(
  current: PlayerPose,
  target: PlayerPose,
  delta: number,
): PlayerPose {
  const blend = 1 - Math.exp(-12 * Math.min(Math.max(delta, 0), 0.05));
  const angle = Math.atan2(
    Math.sin(target.rotation - current.rotation),
    Math.cos(target.rotation - current.rotation),
  );
  return {
    position: {
      x: current.position.x + (target.position.x - current.position.x) * blend,
      y: current.position.y + (target.position.y - current.position.y) * blend,
      z: current.position.z + (target.position.z - current.position.z) * blend,
    },
    rotation: current.rotation + angle * blend,
    animation: target.animation,
  };
}
export const asRecord = record;
