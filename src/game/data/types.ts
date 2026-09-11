export type MapId = "krakatau" | "raja-ampat";
export type ProfileId = "dinar" | "delisha";
export type AvatarId = 0 | 1 | 2;
export type MissionId = "welcome" | "science" | "letters" | "count";
export type QuizId = "science" | "letters" | "count" | "lab";
export type ItemId = "rock" | "leaf" | "shell";
export type Point = [number, number];
export interface Progress {
  avatar: AvatarId;
  started: boolean;
  completed: string[];
  items: string[];
  stars: string[];
  points: number;
  badges: string[];
  unlocked: string[];
  labRound: number;
  activeMissions: string[];
  trackedMission: string | null;
}
export interface PlayerProgress {
  avatar: AvatarId;
  started: boolean;
  lastMap: MapId;
  maps: Record<MapId, Progress>;
}
export interface SaveData {
  version: 2;
  active: ProfileId | null;
  muted: boolean;
  profiles: Record<ProfileId, PlayerProgress>;
}
export interface WorldObject {
  id: string;
  name: string;
  kind:
    | "npc"
    | "quest"
    | "board"
    | "info"
    | "bonus"
    | "guide"
    | "teacher"
    | "item"
    | "letters"
    | "star"
    | "sign"
    | "door"
    | "lab"
    | "count";
  position: Point;
  missionId?: string;
  visual?:
    | "trash"
    | "crab"
    | "bird"
    | "fish"
    | "coral"
    | "sample"
    | "plant"
    | "crystal"
    | "observe";
  description?: string;
  keepAfterCollect?: boolean;
  npcAvatar?: AvatarId;
}
export interface Quiz {
  id: string;
  title: string;
  prompt: string;
  illustration: string;
  options: string[];
  answer: string;
  explanation: string;
  order?: boolean;
}
export interface Controls {
  x: number;
  z: number;
  jump: boolean;
  orbit: number;
  resetCamera: boolean;
}
