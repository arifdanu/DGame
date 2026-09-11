import type { MapId, ProfileId, Quiz } from "../data/types";
export type MissionStatus = "locked" | "available" | "active" | "completed";
export interface MissionDefinition {
  id: string;
  mapId: MapId;
  title: string;
  description: string;
  npcId: string;
  areaId: string;
  prerequisites: string[];
  objectives: string[];
  objectiveLabel: string;
  reward: { stars: number; badge: string; unlock?: string };
  quiz: Record<ProfileId, Quiz>;
}
/** Serializable commands are the boundary for a future authoritative transport.
 * This MVP executes them locally; it creates no connections or multiplayer sessions. */
export type MissionCommand =
  | { type: "accept"; missionId: string }
  | { type: "interact"; objectId: string }
  | { type: "answer"; missionId: string; answer: string }
  | { type: "track"; missionId: string };
