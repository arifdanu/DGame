import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { AvatarId } from "../data/types";
import { AVATARS } from "../data/world";
export function Avatar({
  variant,
  walking = false,
  jumping = false,
  paused = false,
}: {
  variant: AvatarId;
  walking?: boolean;
  jumping?: boolean;
  paused?: boolean;
}) {
  const body = useRef<Group>(null),
    left = useRef<Group>(null),
    right = useRef<Group>(null),
    arms = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (paused) return;
    const t = clock.elapsedTime;
    if (body.current)
      body.current.position.y = walking
        ? Math.abs(Math.sin(t * 10)) * 0.045
        : Math.sin(t * 2) * 0.018;
    if (left.current && right.current) {
      left.current.rotation.x = jumping
        ? -0.35
        : walking
          ? Math.sin(t * 10) * 0.5
          : 0;
      right.current.rotation.x = jumping
        ? 0.35
        : walking
          ? -Math.sin(t * 10) * 0.5
          : 0;
    }
    if (arms.current)
      arms.current.rotation.x = jumping
        ? -1
        : walking
          ? Math.sin(t * 10) * 0.2
          : 0;
  });
  const v = AVATARS[variant];
  return (
    <group ref={body}>
      <group position={[0, 0.7, 0]}>
        <mesh castShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[0.67, 0.7, 0.4]} />
          <meshStandardMaterial color={v.color} />
        </mesh>
        <mesh position={[0, 0.47, -0.05]}>
          <boxGeometry args={[0.08, 0.66, 0.43]} />
          <meshStandardMaterial color="#fff1cc" />
        </mesh>
        <mesh castShadow position={[0, 0.42, -0.32]}>
          <boxGeometry args={[0.48, 0.56, 0.23]} />
          <meshStandardMaterial color="#446d68" />
        </mesh>
        <group ref={arms}>
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[side * 0.46, 0.65, 0]}
              rotation={[0, 0, side * 0.1]}
            >
              <mesh castShadow position={[0, -0.2, 0]}>
                <boxGeometry args={[0.22, 0.47, 0.26]} />
                <meshStandardMaterial color={v.color} />
              </mesh>
              <mesh position={[0, -0.49, 0]}>
                <boxGeometry args={[0.2, 0.2, 0.23]} />
                <meshStandardMaterial color="#f0bf93" />
              </mesh>
            </group>
          ))}
        </group>
        <mesh castShadow position={[0, 1.06, 0]}>
          <boxGeometry args={[0.64, 0.61, 0.54]} />
          <meshStandardMaterial color="#f0bf93" />
        </mesh>
        <mesh position={[0, 1.29, -0.03]}>
          <boxGeometry args={[0.69, 0.2, 0.59]} />
          <meshStandardMaterial color="#564035" />
        </mesh>
        {variant === 1 &&
          [-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.32, 1.03, -0.2]}>
              <boxGeometry args={[0.18, 0.5, 0.28]} />
              <meshStandardMaterial color="#564035" />
            </mesh>
          ))}
        <mesh castShadow position={[0, 1.41, 0]}>
          <cylinderGeometry args={[0.38, 0.4, 0.25, 8]} />
          <meshStandardMaterial color={v.hat} />
        </mesh>
        <mesh castShadow position={[0, 1.3, 0.06]}>
          <cylinderGeometry args={[0.54, 0.54, 0.065, 10]} />
          <meshStandardMaterial color={v.hat} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.16, 1.08, 0.28]}>
            <mesh>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color="#293d3b" />
            </mesh>
            {variant === 2 && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.105, 0.019, 6, 10]} />
                <meshStandardMaterial color="#355251" />
              </mesh>
            )}
          </group>
        ))}
        <mesh position={[0, 0.93, 0.281]}>
          <boxGeometry args={[0.12, 0.026, 0.01]} />
          <meshStandardMaterial color="#a65e4b" />
        </mesh>
        {variant === 2 && (
          <mesh position={[0.1, 0.44, 0.3]}>
            <boxGeometry args={[0.31, 0.23, 0.18]} />
            <meshStandardMaterial color="#344f56" />
          </mesh>
        )}
      </group>
      {[left, right].map((ref, i) => (
        <group key={i} ref={ref} position={[i ? 0.2 : -0.2, 0.71, 0]}>
          <mesh castShadow position={[0, -0.26, 0]}>
            <boxGeometry args={[0.25, 0.51, 0.29]} />
            <meshStandardMaterial color="#436577" />
          </mesh>
          <mesh castShadow position={[0, -0.59, 0.065]}>
            <boxGeometry args={[0.3, 0.19, 0.42]} />
            <meshStandardMaterial color="#4a4540" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
