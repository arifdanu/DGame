export type ProfileId = "dinar" | "delisha";
export type AvatarId = 0 | 1 | 2;
export type MissionId = "welcome" | "science" | "letters" | "count";
export type QuizId = "science" | "letters" | "count" | "lab";
export type ItemId = "rock" | "leaf" | "shell";
export type Point = [number, number];
export interface Progress {
  avatar: AvatarId;
  started: boolean;
  completed: MissionId[];
  items: ItemId[];
  stars: string[];
  points: number;
  badges: string[];
  unlocked: string[];
  labRound: number;
}
export interface SaveData {
  version: 1;
  active: ProfileId | null;
  muted: boolean;
  profiles: Record<ProfileId, Progress>;
}
export interface WorldObject {
  id: string;
  name: string;
  kind:
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
}
export interface Quiz {
  id: QuizId;
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
