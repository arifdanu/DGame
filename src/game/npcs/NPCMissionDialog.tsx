import { Flag, BookOpen, Check } from "lucide-react";
import { Modal } from "../ui/Modal";
import type { Progress, WorldObject, MapId } from "../data/types";
import { MISSIONS } from "../missions/missionRegistry";
import { missionStatus, objectiveCount } from "../missions/MissionManager";
import { STATUS_LABEL } from "../ui/MissionBoard";
export function NPCMissionDialog({
  npc,
  progress: p,
  mapId,
  accept,
  quiz,
  track,
  close,
}: {
  npc: WorldObject;
  progress: Progress;
  mapId: MapId;
  accept: (id: string) => void;
  quiz: (id: string) => void;
  track: (id: string) => void;
  close: () => void;
}) {
  return (
    <Modal title={npc.name} className="npc-missions" onClose={close}>
      <p>{npc.description}</p>
      <div className="npc-quest-list">
        {MISSIONS.filter((m) => m.mapId === mapId && m.npcId === npc.id).map(
          (m) => {
            const status = missionStatus(m, p),
              ready = objectiveCount(m, p) === m.objectives.length;
            return (
              <section key={m.id}>
                <span className={`quest-status ${status}`}>
                  {STATUS_LABEL[status]} · ★ {m.reward.stars}
                </span>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                {status === "available" ? (
                  <button
                    className="k-button primary"
                    onClick={() => accept(m.id)}
                  >
                    <Flag size={18} />
                    Mulai Misi: {m.title}
                  </button>
                ) : status === "active" ? (
                  <>
                    <p>
                      {m.objectiveLabel}: {objectiveCount(m, p)}/
                      {m.objectives.length}
                    </p>
                    <button
                      className="k-button primary"
                      onClick={() => (ready ? quiz(m.id) : track(m.id))}
                    >
                      <BookOpen size={18} />
                      {ready ? "Buka Kuis" : "Tandai tujuan"}
                    </button>
                  </>
                ) : status === "completed" ? (
                  <span className="quest-complete">
                    <Check size={18} />
                    Lencana: {m.reward.badge}
                  </span>
                ) : (
                  <small>
                    Selesaikan{" "}
                    {m.prerequisites
                      .map(
                        (id) => MISSIONS.find((x) => x.id === id)?.title || id,
                      )
                      .join(", ")}{" "}
                    lebih dahulu.
                  </small>
                )}
              </section>
            );
          },
        )}
      </div>
    </Modal>
  );
}
