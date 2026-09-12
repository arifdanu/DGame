import type { MapId, ProfileId } from "../game/data/types";
export type Animation = "idle" | "walking" | "jumping";
export interface PlayerPose {
  position: { x: number; y: number; z: number };
  rotation: number;
  animation: Animation;
}
export interface MultiplayerPlayer extends PlayerPose {
  playerId: string;
  nickname: string;
  avatarId: "0" | "1" | "2";
  profileId: ProfileId;
  mapId: MapId;
  lastSeen: number;
  status: "lobby" | "playing" | "paused";
}
export interface RoomMetadata {
  roomCode: string;
  roomId: string;
  hostId: string;
  mapId: MapId;
  createdAt: number;
}
export interface RoomPresence {
  version: 1;
  player: MultiplayerPlayer;
  roomId: string;
  room?: RoomMetadata;
}
export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "full"
  | "not-found"
  | "closed"
  | "unconfigured"
  | "error";
export interface RemoteState {
  player: MultiplayerPlayer;
  receivedAt: number;
  disconnected: boolean;
}
export interface RoomState {
  status: ConnectionState;
  message: string;
  room: RoomMetadata | null;
  self: MultiplayerPlayer | null;
  players: RemoteState[];
}
export interface SessionOptions {
  nickname: string;
  avatarId: MultiplayerPlayer["avatarId"];
  profileId: ProfileId;
}
export type RoomRequest = SessionOptions &
  ({ mode: "create"; mapId: MapId } | { mode: "join"; roomCode: string });
export type WireMessage =
  | { type: "request"; player: MultiplayerPlayer }
  | {
      type: "welcome";
      room: RoomMetadata;
      recipient: string;
      members: MultiplayerPlayer[];
    }
  | { type: "roster"; room: RoomMetadata; members: MultiplayerPlayer[] }
  | { type: "reject"; recipient: string; roomId: string; reason: "full" }
  | {
      type: "pose";
      roomId: string;
      player: MultiplayerPlayer;
      sequence: number;
    }
  | { type: "leave"; roomId: string; playerId: string }
  | { type: "closed"; roomId: string; hostId: string };
export interface TransportHandlers {
  status: (status: "subscribed" | "disconnected") => void;
  presence: (records: unknown[]) => void;
  message: (message: unknown) => void;
}
export interface RoomChannel {
  subscribe: () => void;
  track: (record: RoomPresence) => Promise<void>;
  send: (message: WireMessage) => Promise<void>;
  close: () => Promise<void>;
}
export type ChannelFactory = (
  code: string,
  playerId: string,
  handlers: TransportHandlers,
) => Promise<RoomChannel>;
