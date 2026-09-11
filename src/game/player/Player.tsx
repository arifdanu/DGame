import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { Avatar } from "../avatars/Avatar";
import type { MapDefinition } from "../maps/mapTypes";
import type { AvatarId, Controls, Point } from "../data/types";
import { groundHeight, moveWithCollision, safeCamera } from "./physics";
import { sound } from "../utils/audio";
export function Player({
  variant,
  map,
  paused,
  input,
  onPosition,
}: {
  variant: AvatarId;
  map: MapDefinition;
  paused: boolean;
  input: React.RefObject<Controls>;
  onPosition: (p: Point) => void;
}) {
  const group = useRef<Group>(null),
    visual = useRef<Group>(null),
    keys = useRef(new Set<string>()),
    yaw = useRef(0),
    velocity = useRef(0),
    airborne = useRef(false),
    timer = useRef(0),
    initialized = useRef(false);
  const [walking, setWalking] = useState(false),
    [jumping, setJumping] = useState(false);
  const { gl } = useThree();
  const target = useRef(new Vector3()),
    desired = useRef(new Vector3());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code),
      clear = () => {
        keys.current.clear();
        input.current.x = 0;
        input.current.z = 0;
        input.current.jump = false;
      };
    let pointer: number | null = null,
      previous = 0;
    const start = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointer = e.pointerId;
      previous = e.clientX;
      gl.domElement.setPointerCapture(e.pointerId);
    };
    const drag = (e: PointerEvent) => {
      if (pointer !== e.pointerId || paused) return;
      yaw.current -= (e.clientX - previous) * 0.005;
      previous = e.clientX;
    };
    const end = () => {
      pointer = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    gl.domElement.addEventListener("pointerdown", start);
    gl.domElement.addEventListener("pointermove", drag);
    gl.domElement.addEventListener("pointerup", end);
    gl.domElement.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      gl.domElement.removeEventListener("pointerdown", start);
      gl.domElement.removeEventListener("pointermove", drag);
      gl.domElement.removeEventListener("pointerup", end);
      gl.domElement.removeEventListener("pointercancel", end);
      clear();
    };
  }, [gl, input, paused]);
  useFrame(({ camera }, rawDelta) => {
    if (!group.current || !visual.current) return;
    const delta = Math.min(rawDelta, 0.04),
      p = group.current.position;
    if (!paused) {
      yaw.current += input.current.orbit * delta * 1.8;
      if (input.current.resetCamera) {
        yaw.current = 0;
        input.current.resetCamera = false;
      }
      let x =
        (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) -
        (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0) +
        input.current.x;
      let z =
        (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0) -
        (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0) +
        input.current.z;
      const length = Math.hypot(x, z);
      if (length > 1) {
        x /= length;
        z /= length;
      }
      const moving = length > 0.08;
      if (moving !== walking) setWalking(moving);
      if (
        (keys.current.has("Space") || input.current.jump) &&
        !airborne.current
      ) {
        velocity.current = 6.5;
        airborne.current = true;
        setJumping(true);
        sound("jump");
        keys.current.delete("Space");
      }
      input.current.jump = false;
      const floor = groundHeight(p.x, p.z, p.y, map);
      velocity.current -= 17 * delta;
      const nextY = Math.max(floor, p.y + velocity.current * delta);
      const dx =
          (x * Math.cos(yaw.current) + z * Math.sin(yaw.current)) * 4.5 * delta,
        dz =
          (-x * Math.sin(yaw.current) + z * Math.cos(yaw.current)) *
          4.5 *
          delta;
      const [nx, nz] = moveWithCollision(
        p.x,
        p.z,
        dx,
        dz,
        Math.max(nextY, map.ground(p.x + dx, p.z + dz)),
        map,
      );
      p.set(nx, Math.max(nextY, map.ground(nx, nz)), nz);
      if (nextY <= floor) {
        velocity.current = 0;
        airborne.current = false;
        if (jumping) setJumping(false);
      }
      if (moving) {
        const angle = Math.atan2(dx, dz);
        visual.current.rotation.y +=
          Math.atan2(
            Math.sin(angle - visual.current.rotation.y),
            Math.cos(angle - visual.current.rotation.y),
          ) * Math.min(1, delta * 14);
      }
      timer.current += delta;
      if (timer.current > 0.09) {
        onPosition([p.x, p.z]);
        timer.current = 0;
      }
    } else if (walking) setWalking(false);
    target.current.set(p.x, p.y + 1.35, p.z);
    desired.current.set(
      p.x + Math.sin(yaw.current) * 8.5,
      p.y + 5.5,
      p.z + Math.cos(yaw.current) * 8.5,
    );
    const safe = safeCamera(target.current, desired.current, map);
    if (!initialized.current) {
      camera.position.set(safe.x, safe.y, safe.z);
      initialized.current = true;
    } else {
      const blend = 1 - Math.exp(-7 * delta);
      camera.position.lerp(desired.current.set(safe.x, safe.y, safe.z), blend);
    }
    // Recheck the smoothed line as well, so orbiting cannot cut through a building.
    const corrected = safeCamera(target.current, camera.position, map);
    camera.position.set(corrected.x, Math.max(1.5, corrected.y), corrected.z);
    camera.lookAt(target.current);
  });
  return (
    <group
      ref={group}
      position={[map.spawn[0], map.ground(...map.spawn), map.spawn[1]]}
    >
      <group ref={visual} rotation={[0, Math.PI, 0]}>
        <Avatar
          variant={variant}
          walking={walking}
          jumping={jumping}
          paused={paused}
        />
      </group>
    </group>
  );
}
