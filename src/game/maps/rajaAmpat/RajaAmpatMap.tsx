import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { rajaAmpatData as map } from "./rajaAmpatData";
import {
  Animal,
  BoundaryMarkers,
  Coral,
  Landmark,
  WorldPaths,
  WorldTrees,
  Box,
} from "../../world/WorldAssets";
function ReefLife({ paused }: { paused: boolean }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !paused)
      ref.current.children.forEach((fish, i) => {
        fish.position.x =
          22 + (i % 5) * 1.4 + Math.sin(clock.elapsedTime * 0.7 + i) * 0.35;
      });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <group
          key={i}
          position={[22 + (i % 5) * 1.4, -0.45, 9 + Math.floor(i / 5) * 3]}
        >
          <Animal
            kind="fish"
            color={["#efc66b", "#8bafd1", "#e79c9a"][i % 3]}
          />
        </group>
      ))}
    </group>
  );
}
export const RajaAmpatMap = memo(function RajaAmpatMap({
  paused,
}: {
  preview: boolean;
  paused: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#b8e4e7"]} />
      <fog attach="fog" args={["#b8e4e7", 80, 185]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#fff6de", "#82b6b0", 1]} />
      <directionalLight
        position={[-20, 45, 30]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.001}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#55b7c6" roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
        <circleGeometry args={[map.radius + 1, 64]} />
        <meshStandardMaterial color="#e3d3a4" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <circleGeometry args={[map.radius, 64]} />
        <meshStandardMaterial
          color="#82d0d0"
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>
      {map.areas
        .filter((a) => a.id !== "ra-reef")
        .map((a) => (
          <group key={a.id} position={[a.position[0], -0.26, a.position[1]]}>
            <mesh receiveShadow>
              <cylinderGeometry
                args={[a.radius + 1.5, a.radius + 2, 0.45, 12]}
              />
              <meshStandardMaterial color="#ebd9ac" />
            </mesh>
            <mesh
              position={[0, 0.23, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[a.radius - 0.7, 12]} />
              <meshStandardMaterial
                color={
                  a.id === "ra-beach"
                    ? "#f0dfae"
                    : a.id === "ra-mangrove"
                      ? "#a5b586"
                      : "#afca87"
                }
              />
            </mesh>
          </group>
        ))}
      <WorldPaths map={map} />
      <WorldTrees map={map} />
      <BoundaryMarkers map={map} />
      {map.landmarks.map((l) => (
        <Landmark key={l.id} data={l} map={map} />
      ))}
      <ReefLife paused={paused} />
      {Array.from({ length: 5 }, (_, i) => (
        <group
          key={`shell-${i}`}
          position={[8 + i * 2, 0.1, 20 + (i % 2)]}
          rotation={[-Math.PI / 2, 0, i]}
        >
          {[-1, 0, 1].map((j) => (
            <mesh
              key={j}
              position={[j * 0.12, 0, 0]}
              rotation={[0, 0, j * 0.3]}
              scale={[0.14, 0.32, 0.09]}
            >
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#f7e6d1" />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group
          key={i}
          position={[22 + (i % 4) * 2, -0.72, 7 + Math.floor(i / 4) * 3]}
        >
          <Coral
            style={i % 3}
            color={["#d59cad", "#e5bd7d", "#a5acd0"][i % 3]}
          />
        </group>
      ))}
      <group position={[-10, 0, -20]}>
        <Box position={[0, 1.1, 0]} size={[2, 0.15, 1.3]} color="#c9ac86" />
        {[-0.8, 0.8].map((x) => (
          <Box
            key={x}
            position={[x, 0.55, 0]}
            size={[0.13, 1.1, 1]}
            color="#7b9b99"
          />
        ))}
        <Box
          position={[0.2, 1.5, 0]}
          size={[0.12, 0.7, 0.12]}
          color="#708d94"
        />
        <mesh position={[0.2, 1.8, 0]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.5, 8]} />
          <meshStandardMaterial color="#456e7b" />
        </mesh>
        {[-0.7, -0.3].map((x) => (
          <mesh key={x} position={[x, 1.4, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.45, 8]} />
            <meshStandardMaterial color="#b6e4de" transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
      <mesh position={[21, 0.05, -26]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.12, 5, 10]} />
        <meshStandardMaterial color="#b59970" />
      </mesh>
      {/* Distant karst silhouettes are scenery beyond the clearly marked boundary. */}
      {[
        [50, -25],
        [-42, -40],
        [31, -54],
      ].map(([x, z], i) => (
        <group key={i} position={[x, -1.2, z]}>
          <mesh position={[0, 4, 0]} scale={[1, 1, 1.4]}>
            <coneGeometry args={[7, 8 + i * 2, 7]} />
            <meshStandardMaterial color="#7fa690" />
          </mesh>
        </group>
      ))}
    </>
  );
});
