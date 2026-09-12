import { AVATARS } from "../../game/data/world";
import type { MultiplayerPlayer, RemoteState } from "../../multiplayer/types";
export function playerColor(index: number) {
  return ["#3e7e74", "#aa6b38", "#7b65a6", "#b3677c"][index % 4];
}
export function PlayerList({
  self,
  players,
  hostId,
}: {
  self: MultiplayerPlayer;
  players: RemoteState[];
  hostId: string;
}) {
  const all = [{ player: self, disconnected: false }, ...players];
  return (
    <ul className="mp-player-list" aria-label="Pemain dalam room">
      {all.map(({ player, disconnected }, index) => (
        <li key={player.playerId}>
          <span
            className="mp-player-icon"
            style={{ background: AVATARS[Number(player.avatarId)].color }}
          >
            {" "}
            {["🧭", "🔬", "🌿"][Number(player.avatarId)]}
          </span>
          <span>
            <strong style={{ color: playerColor(index) }}>
              {player.nickname}
              {player.playerId === self.playerId ? " · Kamu" : ""}
            </strong>
            <small>
              {AVATARS[Number(player.avatarId)].name} ·{" "}
              {player.playerId === hostId ? "Host · " : ""}
              {disconnected
                ? "Terputus"
                : player.status === "playing"
                  ? "Menjelajah"
                  : player.status === "paused"
                    ? "Istirahat"
                    : "Di lobby"}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}
