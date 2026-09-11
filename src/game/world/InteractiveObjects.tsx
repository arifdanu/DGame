import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Shape, type Group } from "three";
import { Avatar } from "../avatars/Avatar";
import type { MapDefinition } from "../maps/mapTypes";
import { ExpansionObject } from "./ExpansionObjects";
import type { Progress, WorldObject } from "../data/types";
const star = new Shape();
for (let i = 0; i < 10; i++) {
  const a = (i * Math.PI) / 5 + Math.PI / 2,
    r = i % 2 ? 0.24 : 0.55;
  if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
}
star.closePath();
export function isObjectVisible(o: WorldObject, p: Progress) {
  if (o.kind === "quest") return o.keepAfterCollect || !p.items.includes(o.id);
  if (o.kind === "bonus") return !p.stars.includes(o.id);
  if (o.kind === "item")
    return !p.items.includes(o.id as "rock" | "leaf" | "shell");
  if (o.kind === "star") return !p.stars.includes(o.id);
  return true;
}
function ObjectModel({
  object,
  active,
  paused,
  locked,
  height,
  collected,
}: {
  object: WorldObject;
  active: boolean;
  paused: boolean;
  locked: boolean;
  height: number;
  collected: boolean;
}) {
  const spin = useRef<Group>(null),
    { kind, id } = object;
  useFrame(({ clock }, delta) => {
    if (!paused && spin.current) {
      spin.current.position.y = 1.05 + Math.sin(clock.elapsedTime * 2) * 0.13;
      spin.current.rotation.y += delta * 0.6;
    }
  });
  return (
    <group position={[object.position[0], height, object.position[1]]}>
      {["npc", "quest", "board", "info", "bonus"].includes(kind) && (
        <ExpansionObject
          object={object}
          active={active}
          collected={collected}
          paused={paused}
        />
      )}
      {(kind === "teacher" || kind === "guide") && (
        <group rotation={[0, 0.12, 0]} scale={1.1}>
          <Avatar variant={kind === "guide" ? 2 : 1} paused={paused} />
          <Html center position={[0, 2.8, 0]} distanceFactor={13}>
            <span className="npc-label">
              {object.name} <b>{kind === "guide" ? "?" : "!"}</b>
            </span>
          </Html>
        </group>
      )}
      {(kind === "item" || kind === "star") && (
        <group ref={spin} position={[0, 1.05, 0]}>
          {kind === "star" ? (
            <mesh castShadow>
              <extrudeGeometry
                args={[star, { depth: 0.16, bevelEnabled: false }]}
              />
              <meshStandardMaterial
                color={locked ? "#cfc09a" : "#ffd36e"}
                emissive="#dba23e"
                emissiveIntensity={0.15}
              />
            </mesh>
          ) : id === "rock" ? (
            <mesh castShadow scale={[0.65, 0.4, 0.5]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#93a1a4" />
            </mesh>
          ) : id === "leaf" ? (
            <mesh rotation={[0, 0, -0.5]} scale={[0.4, 0.8, 0.1]}>
              <octahedronGeometry args={[1]} />
              <meshStandardMaterial color="#4f9b63" />
            </mesh>
          ) : (
            <group>
              {[-2, -1, 0, 1, 2].map((i) => (
                <mesh
                  key={i}
                  position={[i * 0.12, 0, 0]}
                  rotation={[0, 0, -i * 0.2]}
                  scale={[0.16, 0.55, 0.2]}
                >
                  <sphereGeometry args={[1, 6, 4]} />
                  <meshStandardMaterial color={i % 2 ? "#f5c3aa" : "#ffe1bd"} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      )}
      {(kind === "sign" || kind === "letters" || kind === "count") && (
        <>
          <mesh castShadow position={[0, 0.9, 0]}>
            <boxGeometry args={[0.15, 1.8, 0.15]} />
            <meshStandardMaterial color="#927553" />
          </mesh>
          <mesh castShadow position={[0, 1.8, 0]}>
            <boxGeometry args={[kind === "letters" ? 2.5 : 1.9, 1, 0.16]} />
            <meshStandardMaterial
              color={kind === "letters" ? "#477f6b" : "#dfbf85"}
            />
          </mesh>
          <Html center transform position={[0, 1.8, 0.1]} distanceFactor={5}>
            <span
              className={`wood-sign ${kind === "letters" ? "letter-sign" : ""}`}
            >
              {kind === "letters"
                ? "A  B  C"
                : kind === "count"
                  ? "★  1  2  3"
                  : "← Hutan · Pantai →"}
            </span>
          </Html>
        </>
      )}
      {kind === "lab" && (
        <>
          <mesh castShadow position={[0, 1.2, 0]}>
            <boxGeometry args={[2.1, 0.2, 1.3]} />
            <meshStandardMaterial color="#c1a17b" />
          </mesh>
          {[-0.8, 0.8].map((x) => (
            <mesh key={x} position={[x, 0.6, 0]}>
              <boxGeometry args={[0.14, 1.2, 1]} />
              <meshStandardMaterial color="#688581" />
            </mesh>
          ))}
          {[-0.5, 0.4].map((x, i) => (
            <group key={x} position={[x, 1.5, 0]}>
              <mesh>
                <coneGeometry args={[0.23, 0.5, 8]} />
                <meshStandardMaterial
                  color={i ? "#eea681" : "#69b7c0"}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.3, 8]} />
                <meshStandardMaterial color="#dff1ec" />
              </mesh>
            </group>
          ))}
          <Html position={[0, 2.3, 0]} center distanceFactor={14}>
            <span className="zone-label">
              {locked ? "🔒 Selesaikan misi sains" : "Klub Peneliti Kecil"}
            </span>
          </Html>
        </>
      )}
      {(active || kind === "item" || kind === "teacher" || kind === "star") && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
          <ringGeometry
            args={[active ? 0.75 : 0.55, active ? 0.92 : 0.64, 24]}
          />
          <meshBasicMaterial
            color={active ? "#fff5b8" : locked ? "#aaab8d" : "#f9d887"}
            transparent
            opacity={active ? 0.95 : 0.65}
          />
        </mesh>
      )}
      {active && (
        <Html
          center
          position={[0, kind === "teacher" ? 3.3 : 2.8, 0]}
          distanceFactor={12}
        >
          <span className="world-key">E</span>
        </Html>
      )}
    </group>
  );
}
export function InteractiveObjects({
  progress,
  nearby,
  paused,
  map,
  position,
  preview,
}: {
  progress: Progress;
  nearby: string | null;
  paused: boolean;
  map: MapDefinition;
  position: [number, number];
  preview: boolean;
}) {
  return (
    <>
      {map.objects
        .filter(
          (o) =>
            isObjectVisible(o, progress) &&
            (preview ||
              Math.hypot(
                o.position[0] - position[0],
                o.position[1] - position[1],
              ) < 30),
        )
        .map((o) => (
          <ObjectModel
            key={o.id}
            object={o}
            active={nearby === o.id}
            paused={paused}
            height={map.ground(...o.position)}
            collected={progress.items.includes(o.id)}
            locked={
              (o.kind === "lab" && !progress.unlocked.includes("lab")) ||
              (o.kind === "star" && !progress.completed.includes("letters"))
            }
          />
        ))}
    </>
  );
}
