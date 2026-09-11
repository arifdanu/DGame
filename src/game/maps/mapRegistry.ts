import type { MapId, PlayerProgress } from "../data/types";
import { krakatauData } from "./krakatau/krakatauData";
import { rajaAmpatData } from "./rajaAmpat/rajaAmpatData";
import type { MapDefinition } from "./mapTypes";
export const MAPS: Record<MapId, MapDefinition> = {
  krakatau: krakatauData,
  "raja-ampat": rajaAmpatData,
};
export function mapUnlocked(id: MapId, p: PlayerProgress) {
  return id === "krakatau" || p.maps.krakatau.completed.includes("welcome");
}
export const mapTotals = (p: PlayerProgress) => ({
  points: Object.values(p.maps).reduce((n, m) => n + m.points, 0),
  missions: Object.values(p.maps).reduce((n, m) => n + m.completed.length, 0),
});
