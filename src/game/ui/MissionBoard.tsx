import { Check, Star, Award, MapPin } from "lucide-react";
import type { MapId, Progress } from "../data/types";
import { MAPS } from "../maps/mapRegistry";
import { MISSIONS } from "../missions/missionRegistry";
import { missionStatus, objectiveCount } from "../missions/MissionManager";
import { BADGES } from "../missions/progress";
export const STATUS_LABEL = {
  locked: "Terkunci",
  available: "Tersedia",
  active: "Aktif",
  completed: "Selesai",
};
export function MissionBoard({
  mapId,
  progress: p,
  track,
}: {
  mapId: MapId;
  progress: Progress;
  track: (id: string | null) => void;
}) {
  const legacy = ["welcome", "science", "letters", "count"] as const;
  return (
    <>
      <div className="mission-list expansion-mission-list">
        {mapId === "krakatau" &&
          legacy.map((id, i) => {
            const done = p.completed.includes(id),
              available = i === 0 || p.completed.includes(legacy[i - 1]);
            return (
              <div key={id} className={done ? "done" : ""}>
                <span>{done ? <Check size={20} /> : i + 1}</span>
                <div>
                  <strong>
                    {
                      [
                        "Temui Bu Guru Sains",
                        "Temukan 3 Benda Sains",
                        "Hutan Huruf",
                        "Hitung Bintang",
                      ][i]
                    }
                  </strong>
                  <small>
                    {done
                      ? `Selesai · ${BADGES[id]}`
                      : available
                        ? "Aktif · 5 bintang"
                        : "Terkunci · selesaikan misi sebelumnya"}
                  </small>
                  {!done && available && (
                    <button
                      className="k-text-button"
                      onClick={() => track(null)}
                    >
                      <MapPin size={15} />
                      Tandai tujuan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        {MISSIONS.filter((m) => m.mapId === mapId).map((m) => {
          const status = missionStatus(m, p);
          return (
            <div key={m.id} className={status === "completed" ? "done" : ""}>
              <span>
                {status === "completed" ? (
                  <Check size={20} />
                ) : (
                  <Star size={18} />
                )}
              </span>
              <div>
                <strong>{m.title}</strong>
                <small>
                  {STATUS_LABEL[status]} · {objectiveCount(m, p)}/
                  {m.objectives.length} · {m.reward.stars} bintang
                </small>
                <p>{m.description}</p>
                <small>
                  Guru:{" "}
                  {MAPS[mapId].objects.find((o) => o.id === m.npcId)?.name} ·{" "}
                  {MAPS[mapId].areas.find((a) => a.id === m.areaId)?.name}
                </small>
                {status !== "completed" && status !== "locked" && (
                  <button className="k-text-button" onClick={() => track(m.id)}>
                    <MapPin size={15} />
                    Tandai tujuan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="badge-list">
        {p.badges.map((b) => (
          <span key={b}>
            <Award size={19} />
            {b}
          </span>
        ))}
      </div>
    </>
  );
}
