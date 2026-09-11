export type ProfileId = "delisha" | "dinar";
export type IslandId = "angka" | "kata" | "logika" | "kebaikan";
export type Interaction =
  | {
      kind: "story";
      options: string[];
      answer: string;
      branches: Record<string, string>;
    }
  | { kind: "choice"; options: string[]; answer: string }
  | { kind: "order"; pieces: string[]; answer: string[] }
  | { kind: "count"; objects: string[]; target: number }
  | {
      kind: "number";
      answer: number;
      display: string;
      groups?: { count: number; size: number; object: string };
    }
  | {
      kind: "grid";
      size: number;
      start: number;
      goal: number;
      blocked: number[];
      solution: string[];
    };
export interface Activity {
  id: string;
  profile: ProfileId;
  island: IslandId;
  level: number;
  objective: string;
  instruction: string;
  scene: string;
  interaction: Interaction;
  hint: string;
  explanation: string;
}
export interface Level {
  id: string;
  profile: ProfileId;
  island: IslandId;
  rank: number;
  title: string;
  activities: Activity[];
}
export interface AnswerRecord {
  attempts: number;
  help: number;
  guided: boolean;
  firstCorrect: boolean;
  completed: boolean;
}
export interface Draft {
  index: number;
  input: string[];
  feedback: "none" | "wrong" | "correct" | "guided";
  records: Record<string, AnswerRecord>;
}
export interface Session {
  id: string;
  completed: string[];
  ended: boolean;
  startedAt: number;
  durationMs: number;
}
export interface Profile {
  avatar: number;
  limit: 10 | 15 | 20 | 30;
  badges: string[];
  results: Record<string, AnswerRecord>;
  drafts: Record<string, Draft>;
  usage: Record<string, number>;
  skillMs?: Partial<Record<IslandId, number>>;
  session: Session | null;
  tutorial: boolean;
}
export interface PinData {
  salt: string;
  hash: string;
  iterations: number;
  failures: number;
  cooldownUntil: number;
}
export interface AppData {
  schemaVersion: 1;
  pin: PinData | null;
  sound: boolean;
  selected: ProfileId | null;
  profiles: Record<ProfileId, Profile>;
}
