import type { Point, WorldObject, MapId } from "../data/types";
import type { Obstacle } from "../data/world";
export interface Area {
  id: string;
  name: string;
  text: string;
  icon: string;
  color: string;
  position: Point;
  radius: number;
}
export interface LandmarkData {
  id: string;
  name: string;
  kind:
    "tower" | "lighthouse" | "waterfall" | "cave" | "lab" | "house" | "dock";
  position: Point;
  color?: string;
}
export interface PathData {
  a: Point;
  b: Point;
  width: number;
  kind: "sand" | "wood" | "glass";
}
export interface TreeData {
  position: Point;
  scale: number;
  kind: "tree" | "palm" | "mangrove";
}
export interface PhysicsWorld {
  radius: number;
  obstacles: Obstacle[];
  ground: (x: number, z: number) => number;
}
export interface MapDefinition extends PhysicsWorld {
  id: MapId;
  name: string;
  description: string;
  theme: string;
  spawn: Point;
  areas: Area[];
  objects: WorldObject[];
  landmarks: LandmarkData[];
  paths: PathData[];
  trees: TreeData[];
  missionIds: string[];
}
export const ORIGINAL_RADIUS = 27;
export const EXPANDED_RADIUS = ORIGINAL_RADIUS * Math.SQRT2;
