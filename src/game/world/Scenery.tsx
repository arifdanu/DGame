import { memo, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Object3D, type InstancedMesh, type Group } from "three";
import { TREES, ZONES } from "../data/world";
const dummy = new Object3D();
function Trees() {
  const trunks = useRef<InstancedMesh>(null),
    crowns = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    TREES.forEach((t, i) => {
      dummy.position.set(t.position[0], 1.65 * t.scale, t.position[1]);
      dummy.scale.set(0.38 * t.scale, 3.3 * t.scale, 0.38 * t.scale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunks.current!.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 3.5 * t.scale;
      dummy.scale.set(2 * t.scale, 2.6 * t.scale, 2 * t.scale);
      dummy.rotation.y = i;
      dummy.updateMatrix();
      crowns.current!.setMatrixAt(i, dummy.matrix);
      crowns.current!.setColorAt(
        i,
        new Color(["#54966a", "#6da570", "#3f8764", "#89b574"][i % 4]),
      );
    });
    trunks.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceMatrix.needsUpdate = true;
    if (crowns.current!.instanceColor)
      crowns.current!.instanceColor.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh
        ref={trunks}
        args={[undefined, undefined, TREES.length]}
        castShadow
      >
        <cylinderGeometry args={[0.75, 1, 1, 6]} />
        <meshStandardMaterial color="#947955" />
      </instancedMesh>
      <instancedMesh
        ref={crowns}
        args={[undefined, undefined, TREES.length]}
        castShadow
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      {[
        [24, 10],
        [17, 20],
        [10, 24],
        [24, -4],
      ].map(([x, z], i) => (
        <group position={[x, 0, z]} key={i} rotation={[0, i, 0]}>
          <mesh castShadow position={[0, 2.1, 0]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.18, 0.3, 4.2, 6]} />
            <meshStandardMaterial color="#b1956a" />
          </mesh>
          {Array.from({ length: 6 }, (_, j) => (
            <group
              key={j}
              position={[0.25, 4.2, 0]}
              rotation={[0, (j * Math.PI) / 3, 0]}
            >
              <mesh
                castShadow
                position={[0, -0.1, 1.1]}
                rotation={[-0.2, 0, 0]}
                scale={[0.55, 0.17, 1.8]}
              >
                <octahedronGeometry args={[1]} />
                <meshStandardMaterial color={j % 2 ? "#60a477" : "#84b875"} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  );
}
function House({
  x,
  z,
  color = "#e7a075",
  lab = false,
  scale = 1,
}: {
  x: number;
  z: number;
  color?: string;
  lab?: boolean;
  scale?: number;
}) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[5.3, 0.3, 4.3]} />
        <meshStandardMaterial color="#d4c6a4" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[4.6, 2.7, 3.7]} />
        <meshStandardMaterial color={lab ? "#e8f2e6" : "#fff0cf"} />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.1, 2.1, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1, 1.87]}>
        <boxGeometry args={[0.9, 1.7, 0.12]} />
        <meshStandardMaterial color={lab ? "#64a9b0" : "#819d8c"} />
      </mesh>
      {[-1.5, 1.5].map((a) => (
        <group key={a} position={[a, 1.75, 1.9]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.14]} />
            <meshStandardMaterial color="#719b9e" />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <boxGeometry args={[0.06, 0.9, 0.06]} />
            <meshStandardMaterial color="#fff4d7" />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <boxGeometry args={[0.9, 0.06, 0.06]} />
            <meshStandardMaterial color="#fff4d7" />
          </mesh>
        </group>
      ))}
      {lab && (
        <group position={[0, 2.8, 2.02]}>
          <mesh>
            <boxGeometry args={[1.1, 0.48, 0.08]} />
            <meshStandardMaterial color="#497d73" />
          </mesh>
          <Html center transform distanceFactor={8} position={[0, 0, 0.06]}>
            <span className="building-sign">SAINS</span>
          </Html>
        </group>
      )}
    </group>
  );
}
function Path({
  a,
  b,
  width = 2,
}: {
  a: [number, number];
  b: [number, number];
  width?: number;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, Math.atan2(b[0] - a[0], b[1] - a[1])]}
      position={[(a[0] + b[0]) / 2, 0.025, (a[1] + b[1]) / 2]}
      receiveShadow
    >
      <planeGeometry args={[width, Math.hypot(b[0] - a[0], b[1] - a[1]) + 1]} />
      <meshStandardMaterial color="#e0cf9f" />
    </mesh>
  );
}
function Volcano({ paused }: { paused: boolean }) {
  const smoke = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!paused && smoke.current)
      smoke.current.children.forEach((p, i) => {
        const phase = (clock.elapsedTime * 0.17 + i * 0.22) % 1;
        p.position.set(Math.sin(phase * 3) * 1.5, 12 + phase * 5, 0);
        p.scale.setScalar(0.55 + phase * 0.8);
      });
  });
  return (
    <group position={[0, -0.2, -62]}>
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <cylinderGeometry args={[15, 16, 1, 12]} />
        <meshStandardMaterial color="#d5c999" />
      </mesh>
      <mesh castShadow position={[0, 5.3, 0]}>
        <cylinderGeometry args={[2.4, 12, 11, 10]} />
        <meshStandardMaterial color="#738b70" />
      </mesh>
      <mesh position={[0, 9, 0]}>
        <cylinderGeometry args={[2.5, 5.3, 4, 10]} />
        <meshStandardMaterial color="#79817a" />
      </mesh>
      <mesh position={[0, 11.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.02, 0.5, 5, 10]} />
        <meshStandardMaterial color="#807c6f" />
      </mesh>
      <mesh position={[0, 10.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 12]} />
        <meshStandardMaterial
          color="#ffc682"
          emissive="#fda063"
          emissiveIntensity={0.6}
        />
      </mesh>
      <group ref={smoke}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 12 + i, 0]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#eef1e5"
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <Html position={[0, 17, 0]} center distanceFactor={65}>
        <span className="volcano-label">
          GUNUNG KRAKATAU <small>Lihat dari jauh, tetap aman</small>
        </span>
      </Html>
    </group>
  );
}
export const Scenery = memo(function Scenery({
  preview,
  paused,
}: {
  preview: boolean;
  paused: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#c4e6e2"]} />
      <fog attach="fog" args={["#c4e6e2", 65, 165]} />
      <ambientLight intensity={1.5} />
      <hemisphereLight args={["#fffae3", "#8ca58d", 1.4]} />
      <directionalLight
        position={[-25, 45, 25]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-bias={-0.001}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial
          color="#71c2c5"
          transparent
          opacity={0.9}
          roughness={0.3}
        />
      </mesh>
      <mesh receiveShadow position={[0, -0.6, 0]}>
        <cylinderGeometry args={[29, 30, 1, 16]} />
        <meshStandardMaterial color="#eddbab" />
      </mesh>
      <mesh receiveShadow position={[-2, -0.15, -2]}>
        <cylinderGeometry args={[24, 24.4, 0.29, 15]} />
        <meshStandardMaterial color="#b5cf85" />
      </mesh>
      {[31, 34].map((r) => (
        <mesh key={r} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r, r + 0.11, 64]} />
          <meshBasicMaterial color="#dcf1df" transparent opacity={0.5} />
        </mesh>
      ))}
      <Path a={[0, 12]} b={[0, -8]} />
      <Path a={[0, 6]} b={[-12, 6]} />
      <Path a={[0, 6]} b={[19, 12]} width={2.5} />
      <Path a={[0, -6]} b={[-14, -9]} />
      <Path a={[0, -6]} b={[12, -6]} />
      <Path a={[0, 12]} b={[-11, 13]} />
      <Trees />
      <House x={-12} z={3} />
      <House x={-19} z={0} color="#70aaa7" scale={0.9} />
      <House x={-9} z={-3} color="#d6ad67" scale={0.8} />
      <House x={12} z={-10} color="#78a7aa" lab />
      <mesh castShadow position={[6, 0.3, 4]} scale={[1.1, 0.6, 0.8]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#a0a69a" />
      </mesh>
      {[
        [-5, -22],
        [3, -24],
        [18, -19],
        [-24, 9],
        [-7, 24],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} scale={[1.3, 0.9, 1]} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#a3ae93" />
        </mesh>
      ))}
      <group position={[22, 0, 17]} rotation={[0, -0.6, 0]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, 0.05, i * 0.6]} receiveShadow>
            <boxGeometry args={[2.5, 0.18, 0.5]} />
            <meshStandardMaterial color={i % 2 ? "#c19d6c" : "#d4b281"} />
          </mesh>
        ))}
        {[-1, 1].map((x) => (
          <mesh key={x} position={[x, 0.3, 3.5]}>
            <cylinderGeometry args={[0.13, 0.13, 1.5, 6]} />
            <meshStandardMaterial color="#98825f" />
          </mesh>
        ))}
        <group position={[3, -0.1, 3]} rotation={[0, 0.3, 0]}>
          <mesh scale={[1, 0.55, 2.3]}>
            <sphereGeometry args={[1, 6, 3]} />
            <meshStandardMaterial color="#c18161" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.3, 0.14, 3.2]} />
            <meshStandardMaterial color="#e0c191" />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3, 6]} />
            <meshStandardMaterial color="#92714f" />
          </mesh>
          <mesh position={[0.6, 1.9, 0]}>
            <coneGeometry args={[1, 1.8, 3]} />
            <meshStandardMaterial color="#ffedc3" side={2} />
          </mesh>
        </group>
      </group>
      <group position={[1, 0, -13]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, 0.16, -i * 0.55]}>
            <boxGeometry args={[2.8, 0.24, 0.5]} />
            <meshStandardMaterial color="#c6a271" />
          </mesh>
        ))}
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 0.65, -1.4]}>
            <boxGeometry args={[0.1, 0.13, 3.3]} />
            <meshStandardMaterial color="#927b58" />
          </mesh>
        ))}
      </group>
      <Volcano paused={paused} />
      {preview &&
        ZONES.map((zone) => (
          <Html
            key={zone.name}
            position={[zone.position[0], 5.8, zone.position[1]]}
            center
            distanceFactor={55}
          >
            <span className="zone-label">{zone.name}</span>
          </Html>
        ))}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 15) * 21, 0.15, Math.cos(i * 13) * 20]}
        >
          <sphereGeometry args={[0.17, 5, 4]} />
          <meshStandardMaterial color={i % 2 ? "#f1da87" : "#fff3cf"} />
        </mesh>
      ))}
    </>
  );
});
