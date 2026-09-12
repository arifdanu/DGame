import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { Avatar } from "./avatars/Avatar";
import type { AvatarId } from "./data/types";
import type { RemoteState, PlayerPose } from "../multiplayer/types";
import { interpolatePose } from "../multiplayer/playerSync";
import { playerColor } from "../components/multiplayer/PlayerList";
export function RemotePlayerLabel({
  remote,
  color,
}: {
  remote: RemoteState;
  color: string;
}) {
  return (
    <Html center position={[0, 2.65, 0]} distanceFactor={12}>
      <span
        className={`mp-remote-label ${remote.disconnected ? "disconnected" : ""}`}
        style={{ borderColor: color }}
        data-testid="remote-player"
        data-player-id={remote.player.playerId}
        data-avatar={remote.player.avatarId}
        data-x={remote.player.position.x}
        data-y={remote.player.position.y}
        data-z={remote.player.position.z}
        data-rotation={remote.player.rotation}
        data-animation={remote.player.animation}
      >
        {remote.player.nickname}
        {remote.disconnected && <small>Terputus</small>}
      </span>
    </Html>
  );
}
function RemotePlayer({
  remote,
  index,
}: {
  remote: RemoteState;
  index: number;
}) {
  const ref = useRef<Group>(null),
    pose = useRef<PlayerPose>({
      ...remote.player,
      position: { ...remote.player.position },
    });
  useFrame((_, delta) => {
    if (!ref.current) return;
    pose.current = interpolatePose(pose.current, remote.player, delta);
    const p = pose.current.position;
    ref.current.position.set(p.x, p.y, p.z);
    ref.current.rotation.y = pose.current.rotation;
  });
  return (
    <group ref={ref}>
      <Avatar
        variant={Number(remote.player.avatarId) as AvatarId}
        walking={!remote.disconnected && remote.player.animation === "walking"}
        jumping={!remote.disconnected && remote.player.animation === "jumping"}
        paused={remote.disconnected || remote.player.status === "paused"}
      />
      <RemotePlayerLabel remote={remote} color={playerColor(index + 1)} />
    </group>
  );
}
export function RemotePlayers({ players }: { players: RemoteState[] }) {
  return (
    <>
      {players
        .filter((p) => p.player.status !== "lobby")
        .map((remote, index) => (
          <RemotePlayer
            key={remote.player.playerId}
            remote={remote}
            index={index}
          />
        ))}
    </>
  );
}
