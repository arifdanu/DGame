import { Html } from "@react-three/drei";
import { Avatar } from "../avatars/Avatar";
import type { WorldObject } from "../data/types";
import { Animal, Box, Coral } from "./WorldAssets";
export function ExpansionObject({
  object: o,
  active,
  collected,
  paused,
}: {
  object: WorldObject;
  active: boolean;
  collected: boolean;
  paused: boolean;
}) {
  if (o.kind === "npc")
    return (
      <>
        <Avatar variant={o.npcAvatar || 0} paused={paused} />
        <Html center position={[0, 2.9, 0]} distanceFactor={13}>
          <span
            className="npc-label"
            data-testid="npc-marker"
            data-npc-id={o.id}
          >
            {o.name} <b>!</b>
          </span>
        </Html>
      </>
    );
  if (o.kind === "board" || o.kind === "info" || o.visual === "observe")
    return (
      <>
        <Box position={[0, 0.85, 0]} size={[0.13, 1.7, 0.13]} color="#9a805e" />
        <Box
          position={[0, 1.75, 0]}
          size={[2.3, 0.85, 0.16]}
          color={
            collected ? "#7ca786" : o.kind === "board" ? "#548c8c" : "#d6bd89"
          }
        />
        <Html center transform position={[0, 1.75, 0.1]} distanceFactor={5}>
          <span className="wood-sign expansion-sign">
            {o.kind === "board" ? "MISI ✦" : collected ? "✓ Diamati" : o.name}
          </span>
        </Html>
      </>
    );
  if (o.kind === "bonus")
    return (
      <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial
          color="#f9d879"
          emissive="#d8b858"
          emissiveIntensity={0.25}
        />
      </mesh>
    );
  return (
    <group position={[0, o.visual === "fish" ? 0.6 : 0.15, 0]}>
      {o.visual === "rock" && (
        <mesh position={[0, 0.3, 0]} scale={[0.65, 0.4, 0.5]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#909b98" />
        </mesh>
      )}
      {o.visual === "leaf" && (
        <mesh position={[0, 0.5, 0]} scale={[0.3, 0.7, 0.1]}>
          <octahedronGeometry args={[1]} />
          <meshStandardMaterial color="#559865" />
        </mesh>
      )}
      {o.visual === "flag" && (
        <>
          <Box position={[0, 1, 0]} size={[0.1, 2, 0.1]} color="#9b815e" />
          <Box
            position={[0.4, 1.7, 0]}
            size={[0.8, 0.55, 0.1]}
            color={
              o.id.endsWith("1")
                ? "#db8275"
                : o.id.endsWith("2")
                  ? "#ead26c"
                  : "#70b08a"
            }
          />
        </>
      )}
      {o.visual === "trash" &&
        (o.name.includes("Daun") ? (
          <mesh rotation={[-Math.PI / 2, 0, 0.4]} scale={[0.45, 0.85, 0.1]}>
            <octahedronGeometry args={[1]} />
            <meshStandardMaterial color="#aa995f" />
          </mesh>
        ) : /Bungkus|Kertas/.test(o.name) ? (
          <Box
            position={[0, 0.12, 0]}
            size={[0.7, 0.15, 0.55]}
            color="#e0ae86"
          />
        ) : (
          <group rotation={[0.3, 0, 0.4]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.2, 0.23, 0.6, 6]} />
              <meshStandardMaterial
                color={o.id.endsWith("2") ? "#a3a26b" : "#73b5d0"}
              />
            </mesh>
            <Box
              position={[0, 0.65, 0]}
              size={[0.15, 0.1, 0.15]}
              color="#fbf0bd"
            />
          </group>
        ))}
      {(o.visual === "crab" || o.visual === "bird" || o.visual === "fish") &&
        (o.missionId === "ra-fish" ? (
          Array.from({ length: 5 }, (_, i) => (
            <group key={i} position={[(i - 2) * 0.8, 0.2, (i % 2) * 0.5]}>
              <Animal
                kind="fish"
                color={
                  ["#f1d073", "#7aacca", "#e4978b", "#93bd8b", "#d1aed2"][i]
                }
              />
            </group>
          ))
        ) : (
          <Animal kind={o.visual} />
        ))}
      {o.visual === "coral" && (
        <Coral
          style={o.id.endsWith("3") ? 2 : o.id.endsWith("2") ? 1 : 0}
          color={
            o.id.endsWith("1")
              ? "#df9c9e"
              : o.id.endsWith("2")
                ? "#aba5cd"
                : "#e1bf86"
          }
        />
      )}
      {o.visual === "sample" && (
        <>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.8, 8]} />
            <meshStandardMaterial
              color={
                o.id.endsWith("2")
                  ? "#a6dfec"
                  : o.id.endsWith("1")
                    ? "#b49e7c"
                    : "#8eaa87"
              }
              transparent
              opacity={0.8}
            />
          </mesh>
          <Html center position={[0, 1.2, 0]} distanceFactor={12}>
            <span className="sample-label">
              {o.id.endsWith("1")
                ? "A · keruh"
                : o.id.endsWith("2")
                  ? "B · jernih"
                  : "C · bersampah"}
            </span>
          </Html>
        </>
      )}
      {o.visual === "plant" && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.65, 8]} />
            <meshStandardMaterial color="#8c8061" />
          </mesh>
          {collected ? (
            <>
              <Box
                position={[0, 0.5, 0]}
                size={[0.1, 1, 0.1]}
                color="#9a8158"
              />
              <mesh position={[0, 1, 0]} scale={[0.5, 0.7, 0.5]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#76a776" />
              </mesh>
            </>
          ) : (
            <Html center position={[0, 0.4, 0]} distanceFactor={12}>
              <span className="world-key">🌱</span>
            </Html>
          )}
        </>
      )}
      {o.visual === "crystal" && (
        <mesh position={[0, 0.55, 0]}>
          <coneGeometry args={[0.4, 1.2, 5]} />
          <meshStandardMaterial
            color="#b1afd8"
            emissive="#9d91c5"
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      {active && collected && (
        <Html center position={[0, 1.8, 0]} distanceFactor={12}>
          <span className="zone-label">✓ Sudah diamati</span>
        </Html>
      )}
    </group>
  );
}
