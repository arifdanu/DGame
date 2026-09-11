import { useLayoutEffect, useRef, useMemo } from "react";
import { Object3D, Color, type InstancedMesh } from "three";
import type { MapDefinition, LandmarkData, PathData } from "../maps/mapTypes";
export function Box({
  position,
  size,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
export function WorldTrees({ map }: { map: MapDefinition }) {
  const trunks = useRef<InstancedMesh>(null),
    crowns = useRef<InstancedMesh>(null),
    roots = useRef<InstancedMesh>(null);
  const mangroves = useMemo(
    () => map.trees.filter((t) => t.kind === "mangrove"),
    [map],
  );
  useLayoutEffect(() => {
    const dummy = new Object3D();
    map.trees.forEach((t, i) => {
      const h = map.ground(...t.position);
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(t.position[0], h + 1.7 * t.scale, t.position[1]);
      dummy.scale.set(0.26 * t.scale, 3.4 * t.scale, 0.26 * t.scale);
      dummy.updateMatrix();
      trunks.current!.setMatrixAt(i, dummy.matrix);
      dummy.position.y = h + 3.4 * t.scale;
      dummy.scale.set(
        1.9 * t.scale,
        t.kind === "palm" ? 0.7 : 1.9 * t.scale,
        1.9 * t.scale,
      );
      dummy.rotation.y = i;
      dummy.updateMatrix();
      crowns.current!.setMatrixAt(i, dummy.matrix);
      crowns.current!.setColorAt(
        i,
        new Color(["#459178", "#67a47d", "#91b878"][i % 3]),
      );
    });
    mangroves.forEach((t, i) => {
      for (let j = 0; j < 3; j++) {
        const a = (j * Math.PI * 2) / 3;
        dummy.position.set(
          t.position[0] + Math.cos(a) * 0.35,
          0.55,
          t.position[1] + Math.sin(a) * 0.35,
        );
        dummy.rotation.set(Math.sin(a) * 0.55, 0, Math.cos(a) * 0.55);
        dummy.scale.set(0.11, 1.3, 0.11);
        dummy.updateMatrix();
        roots.current!.setMatrixAt(i * 3 + j, dummy.matrix);
      }
    });
    [trunks, crowns, roots].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor)
          ref.current.instanceColor.needsUpdate = true;
      }
    });
  }, [map, mangroves]);
  return (
    <>
      <instancedMesh
        ref={trunks}
        args={[undefined, undefined, map.trees.length]}
        castShadow
      >
        <cylinderGeometry args={[0.8, 1, 1, 5]} />
        <meshStandardMaterial color="#9d8058" />
      </instancedMesh>
      <instancedMesh
        ref={crowns}
        args={[undefined, undefined, map.trees.length]}
        castShadow
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial />
      </instancedMesh>
      {mangroves.length > 0 && (
        <instancedMesh
          ref={roots}
          args={[undefined, undefined, mangroves.length * 3]}
        >
          <cylinderGeometry args={[1, 1, 1, 5]} />
          <meshStandardMaterial color="#8c7353" />
        </instancedMesh>
      )}
    </>
  );
}
export function WorldPaths({ map }: { map: MapDefinition }) {
  return (
    <>
      {map.paths.map((p, i) => (
        <PathStrip key={i} data={p} map={map} />
      ))}
    </>
  );
}
function PathStrip({ data: p, map }: { data: PathData; map: MapDefinition }) {
  const distance = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]),
    steps = Math.max(1, Math.ceil(distance / 2));
  // Small shared segments conform to sloped terrain; no individual authored planks.
  return (
    <>
      {Array.from({ length: steps }, (_, i) => {
        const t = (i + 0.5) / steps,
          x = p.a[0] + (p.b[0] - p.a[0]) * t,
          z = p.a[1] + (p.b[1] - p.a[1]) * t;
        return (
          <mesh
            key={i}
            position={[x, map.ground(x, z) + 0.018, z]}
            rotation={[
              -Math.PI / 2,
              0,
              Math.atan2(p.b[0] - p.a[0], p.b[1] - p.a[1]),
            ]}
            receiveShadow
          >
            <planeGeometry args={[p.width, distance / steps + 0.06]} />
            <meshStandardMaterial
              color={
                p.kind === "glass"
                  ? "#c9f3ee"
                  : p.kind === "wood"
                    ? i % 2
                      ? "#c5a77d"
                      : "#d2b587"
                    : "#e5d29c"
              }
              transparent={p.kind === "glass"}
              opacity={p.kind === "glass" ? 0.42 : 1}
              depthWrite={p.kind !== "glass"}
            />
          </mesh>
        );
      })}
    </>
  );
}
export function BoundaryMarkers({ map }: { map: MapDefinition }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      dummy.position.set(
        Math.cos(a) * (map.radius + 0.2),
        0.12,
        Math.sin(a) * (map.radius + 0.2),
      );
      dummy.scale.set(0.22, 0.32, 0.22);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [map]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 64]}>
      <sphereGeometry args={[1, 5, 4]} />
      <meshStandardMaterial color="#fff1c8" />
    </instancedMesh>
  );
}
export function Landmark({
  data,
  map,
}: {
  data: LandmarkData;
  map: MapDefinition;
}) {
  const color = data.color || "#88a995";
  return (
    <group
      position={[
        data.position[0],
        map.ground(...data.position),
        data.position[1],
      ]}
    >
      {(data.kind === "house" || data.kind === "lab") && (
        <>
          <Box position={[0, 1.4, 0]} size={[4, 2.8, 3.5]} color="#fff0cc" />
          <mesh
            position={[0, 3.3, 0]}
            rotation={[0, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[3.6, 1.9, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <Box
            position={[0, 0.9, 1.8]}
            size={[0.8, 1.8, 0.08]}
            color="#638e8b"
          />
          {[-1.3, 1.3].map((x) => (
            <Box
              key={x}
              position={[x, 1.6, 1.8]}
              size={[0.8, 0.8, 0.1]}
              color="#8cc6c7"
            />
          ))}
        </>
      )}
      {data.kind === "tower" && (
        <>
          <Box position={[0, 2.7, 0]} size={[3.8, 0.2, 3.8]} color="#c9ab7b" />
          {[-1.65, 1.65].flatMap((x) =>
            [-1.65, 1.65].map((z) => (
              <Box
                key={`${x}-${z}`}
                position={[x, 2.25, z]}
                size={[0.19, 4.5, 0.19]}
                color="#9b825a"
              />
            )),
          )}
          <mesh
            position={[0, 4.8, 0]}
            rotation={[0, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[3.4, 1.4, 4]} />
            <meshStandardMaterial color="#b4ac76" />
          </mesh>
          <Box
            position={[0, 1.1, 1.8]}
            size={[0.15, 2.2, 0.15]}
            color="#7d9387"
          />
          <mesh position={[0, 2.15, 1.8]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
            <cylinderGeometry args={[0.19, 0.3, 1, 8]} />
            <meshStandardMaterial color="#4e7e7b" />
          </mesh>
        </>
      )}
      {data.kind === "lighthouse" && (
        <>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[1.1, 1.7, 6, 8]} />
            <meshStandardMaterial color="#fff0d2" />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <cylinderGeometry args={[1.3, 1.4, 0.8, 8]} />
            <meshStandardMaterial color="#df967b" />
          </mesh>
          <mesh position={[0, 6.1, 0]}>
            <cylinderGeometry args={[1.1, 1.1, 1, 8]} />
            <meshStandardMaterial
              color="#f7d28b"
              emissive="#deb565"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0, 7, 0]}>
            <coneGeometry args={[1.6, 1.1, 8]} />
            <meshStandardMaterial color="#668d85" />
          </mesh>
        </>
      )}
      {data.kind === "waterfall" && (
        <>
          <mesh position={[0, 2, 0]} scale={[2.2, 3, 1.2]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#91a28b" />
          </mesh>
          <Box position={[0, 2.2, 1]} size={[1.3, 4.4, 0.08]} color="#a3e1dd" />
          <mesh position={[0, 0.03, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.5, 12]} />
            <meshStandardMaterial color="#86cfca" />
          </mesh>
        </>
      )}
      {data.kind === "cave" && (
        <>
          {[-3, 3].map((x) => (
            <mesh
              key={x}
              position={[x, 1.8, 0]}
              scale={[1.2, 2.3, 2.5]}
              castShadow
            >
              <dodecahedronGeometry args={[1.1, 0]} />
              <meshStandardMaterial color="#b8bda5" />
            </mesh>
          ))}
          <mesh position={[0, 4.5, 0]} scale={[4, 1, 2.5]} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#cbd0b7" />
          </mesh>
          {[-2, 2].map((x) => (
            <mesh key={x} position={[x, 0.6, 1.2]}>
              <coneGeometry args={[0.3, 1.2, 5]} />
              <meshStandardMaterial
                color="#b8b5df"
                emissive="#a998cf"
                emissiveIntensity={0.4}
              />
            </mesh>
          ))}
        </>
      )}
      {data.kind === "dock" && (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <Box
              key={i}
              position={[0, 0.06, i * 0.65]}
              size={[3, 0.15, 0.58]}
              color={i % 2 ? "#d5b784" : "#c6a471"}
            />
          ))}
          <group position={[3, -0.1, 4]}>
            <mesh scale={[1, 0.5, 2.4]}>
              <sphereGeometry args={[1.2, 6, 3]} />
              <meshStandardMaterial color="#c18c60" />
            </mesh>
            <Box
              position={[0, 0.25, 0]}
              size={[1.6, 0.15, 3.5]}
              color="#e9d6aa"
            />
          </group>
        </>
      )}
    </group>
  );
}
export function Animal({
  kind,
  color = "#f3c661",
}: {
  kind: "fish" | "bird" | "crab";
  color?: string;
}) {
  if (kind === "fish")
    return (
      <group>
        <mesh scale={[0.6, 0.32, 0.2]}>
          <sphereGeometry args={[1, 7, 5]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.3, 0.45, 3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.35, 0.1, 0.18]}>
          <sphereGeometry args={[0.045, 5, 4]} />
          <meshStandardMaterial color="#284c50" />
        </mesh>
      </group>
    );
  if (kind === "bird")
    return (
      <group>
        <mesh scale={[0.3, 0.45, 0.5]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#f7eed1" />
        </mesh>
        <mesh position={[0, 0.45, 0.25]}>
          <sphereGeometry args={[0.23, 6, 4]} />
          <meshStandardMaterial color="#f7eed1" />
        </mesh>
        <mesh position={[0, 0.45, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.3, 4]} />
          <meshStandardMaterial color="#d9b473" />
        </mesh>
        {[-1, 1].map((i) => (
          <mesh
            key={i}
            position={[i * 0.3, 0.1, 0]}
            rotation={[0, 0, i * 0.3]}
            scale={[0.5, 0.1, 0.3]}
          >
            <octahedronGeometry args={[1]} />
            <meshStandardMaterial color="#93b1a4" />
          </mesh>
        ))}
      </group>
    );
  return (
    <group>
      <mesh scale={[0.5, 0.25, 0.35]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="#d38c6d" />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((i) => (
          <Box
            key={`${side}${i}`}
            position={[side * 0.55, -0.05, (i - 1) * 0.24]}
            size={[0.5, 0.08, 0.08]}
            color="#bd775d"
            rotation={side * 0.3}
          />
        )),
      )}
      {[-1, 1].map((i) => (
        <mesh key={i} position={[i * 0.4, 0.2, 0.45]}>
          <icosahedronGeometry args={[0.19, 0]} />
          <meshStandardMaterial color="#e1a47f" />
        </mesh>
      ))}
    </group>
  );
}
export function Coral({
  color = "#dc9ea0",
  style = 0,
}: {
  color?: string;
  style?: number;
}) {
  if (style === 2)
    return (
      <mesh position={[0, 0.4, 0]} scale={[0.7, 0.5, 0.6]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  if (style === 1)
    return (
      <group>
        <Box position={[0, 0.3, 0]} size={[0.1, 0.6, 0.1]} color={color} />
        <mesh position={[0, 0.75, 0]} scale={[0.8, 0.6, 0.1]}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  return (
    <group>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh
          key={i}
          position={[(i - 1.5) * 0.22, 0.35 + (i % 2) * 0.15, 0]}
          rotation={[0, 0, (i - 1.5) * 0.2]}
        >
          <cylinderGeometry args={[0.13, 0.2, 0.8 + (i % 2) * 0.3, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
