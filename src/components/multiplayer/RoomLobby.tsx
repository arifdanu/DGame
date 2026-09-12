import { MAPS } from "../../game/maps/mapRegistry";
import { IslandMap } from "../../game/ui/Map";
import { Brand } from "../../game/ui/Screens";
import type { RoomState } from "../../multiplayer/types";
import { RoomCode } from "./RoomCode";
import { PlayerList } from "./PlayerList";
import { ConnectionStatus } from "./ConnectionStatus";
export function RoomLobby({
  state,
  start,
  leave,
  retry,
}: {
  state: RoomState;
  start: () => void;
  leave: () => void;
  retry: () => void;
}) {
  const { room, self } = state;
  if (!room || !self) return null;
  const map = MAPS[room.mapId];
  return (
    <section className="mp-menu selection-screen">
      <header className="k-header">
        <Brand />
        <button className="k-button secondary" onClick={leave}>
          Keluar Room
        </button>
      </header>
      <div className="mp-title">
        <span className="k-eyebrow">TEMAN PERJALANANMU</span>
        <h1>Lobby petualangan</h1>
        <ConnectionStatus status={state.status} />
      </div>
      {state.message && (
        <div className="mp-error" role="alert">
          <p>{state.message}</p>
          <button className="k-button secondary" onClick={retry}>
            Coba Lagi
          </button>
          <button className="k-button secondary" onClick={leave}>
            Main Sendiri
          </button>
        </div>
      )}
      <div className="mp-lobby-grid">
        <div className="mp-lobby-map">
          <IslandMap mapId={map.id} position={map.spawn} target="" large />
          <h2>{map.name}</h2>
          <p>Map tetap sama selama sesi room.</p>
          <RoomCode code={room.roomCode} />
        </div>
        <div className="mp-lobby-players">
          <h2>
            Penjelajah{" "}
            <span data-testid="room-count">{state.players.length + 1}/4</span>
          </h2>
          <PlayerList
            self={self}
            players={state.players}
            hostId={room.hostId}
          />
          <p>Masuk saat kamu siap. Teman dapat menyusul dari lobby.</p>
          <button
            className="k-button primary"
            disabled={state.status !== "connected"}
            onClick={start}
          >
            Mulai Bermain
          </button>
        </div>
      </div>
    </section>
  );
}
