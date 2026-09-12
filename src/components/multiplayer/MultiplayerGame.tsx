import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Users } from "lucide-react";
import { World } from "../../game/world/World";
import { Modal } from "../../game/ui/Modal";
import { IslandMap } from "../../game/ui/Map";
import { Controls as TouchControls } from "../../game/ui/Controls";
import { MAPS } from "../../game/maps/mapRegistry";
import { freshProgress } from "../../game/missions/progress";
import type { AvatarId, Controls, Point } from "../../game/data/types";
import type { RoomState } from "../../multiplayer/types";
import type { MultiplayerService } from "../../multiplayer/multiplayerService";
import { ConnectionStatus } from "./ConnectionStatus";
import { PlayerList } from "./PlayerList";
import { RoomCode } from "./RoomCode";
export function MultiplayerGame({
  state,
  service,
  leave,
  retry,
}: {
  state: RoomState;
  service: MultiplayerService;
  leave: () => void;
  retry: () => void;
}) {
  const room = state.room!,
    self = state.self!,
    map = MAPS[room.mapId];
  const [panel, setPanel] = useState<"pause" | "map" | null>(null),
    [ready, setReady] = useState(false),
    [position, setPosition] = useState<Point>(map.spawn);
  const input = useRef<Controls>({
    x: 0,
    z: 0,
    jump: false,
    orbit: 0,
    resetCamera: false,
  });
  const progress = useMemo(
    () => ({ ...freshProgress(), avatar: Number(self.avatarId) as AvatarId }),
    [self.avatarId],
  );
  const onPosition = useCallback((p: Point) => {
    setPosition(p);
    setReady(true);
  }, []);
  useEffect(() => {
    service.setPlayerStatus(panel ? "paused" : "playing");
  }, [panel, service]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape" && !document.querySelector("dialog[open]"))
        setPanel("pause");
    };
    const visibility = () => {
      if (document.hidden) setPanel("pause");
    };
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const area = map.areas.reduce((a, b) =>
    Math.hypot(b.position[0] - position[0], b.position[1] - position[1]) <
    Math.hypot(a.position[0] - position[0], a.position[1] - position[1])
      ? b
      : a,
  );
  return (
    <div
      className="mp-playing playing"
      data-ready={ready}
      data-map={room.mapId}
    >
      <div className="world-container">
        <World
          mapId={room.mapId}
          position={position}
          progress={progress}
          preview={false}
          paused={!!panel}
          input={input}
          nearby={null}
          onPosition={onPosition}
          onPose={service.setPose}
          remotePlayers={state.players}
        />
      </div>
      <div className="mp-game-top">
        <div className="mp-session-chip">
          <strong>{map.name}</strong>
          <span>
            {self.nickname} · {state.players.length + 1}/4 ·{" "}
            <b>{room.roomCode}</b>
          </span>
          <ConnectionStatus status={state.status} />
        </div>
        <button
          className="k-button secondary"
          onClick={() => setPanel("pause")}
          aria-label="Menu room"
        >
          <Users size={18} />
          <Pause size={18} />
        </button>
        <button className="k-button secondary mp-leave" onClick={leave}>
          Keluar Room
        </button>
      </div>
      {state.status !== "connected" && (
        <div className="mp-disconnected" role="alert">
          <p>{state.message}</p>
          <button className="k-button secondary" onClick={retry}>
            Coba Lagi
          </button>
          <button className="k-button primary" onClick={leave}>
            Main Sendiri
          </button>
        </div>
      )}
      <button
        className="minimap-button mp-minimap"
        aria-label="Buka peta bersama"
        onClick={() => setPanel("map")}
      >
        <IslandMap mapId={room.mapId} position={position} target="" />
      </button>
      <div className="location-tag">{area.name}</div>
      <div className="mp-explore-note">
        Jelajahi bersama · misi tersedia di Main Sendiri
      </div>
      <TouchControls
        input={input}
        paused={!!panel}
        available={false}
        showInteraction={false}
        interact={() => {}}
      />
      {!ready && <div className="loading-world">Menyiapkan penjelajah…</div>}
      {panel === "pause" && (
        <Modal title="Teman satu room" onClose={() => setPanel(null)}>
          <RoomCode code={room.roomCode} />
          <PlayerList
            self={self}
            players={state.players}
            hostId={room.hostId}
          />
          <p>
            Keluar room untuk mengganti map. Progres Main Sendiri tetap
            tersimpan.
          </p>
          <div className="menu-buttons">
            <button className="k-button primary" onClick={() => setPanel(null)}>
              Lanjutkan permainan
            </button>
            <button className="k-button secondary" onClick={leave}>
              Keluar Room
            </button>
          </div>
        </Modal>
      )}
      {panel === "map" && (
        <Modal
          title={map.name}
          className="map-modal"
          onClose={() => setPanel(null)}
        >
          <IslandMap mapId={room.mapId} position={position} target="" large />
          <p>Pelampung menandai batas pulau. Kamu berada di {area.name}.</p>
        </Modal>
      )}
    </div>
  );
}
