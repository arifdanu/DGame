import { Component, useEffect } from "react";
import type { ReactNode, RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Scenery } from "./Scenery";
import { InteractiveObjects } from "./InteractiveObjects";
import { Player } from "../player/Player";
import type { Controls, Point, Progress } from "../data/types";
function PreviewCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(43, 38, 53);
    camera.lookAt(0, 0, -7);
  }, [camera]);
  return null;
}
export class WorldBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? this.props.fallback || (
          <div className="webgl-fallback">
            <h2>Dunia 3D belum dapat dibuka</h2>
            <p>
              Aktifkan akselerasi grafis browser atau gunakan perangkat yang
              mendukung WebGL 2.
            </p>
            <button
              className="k-button primary"
              onClick={() => location.reload()}
            >
              Muat ulang
            </button>
            <a href="/classic/">Buka latihan Pulau Pintar</a>
          </div>
        )
      : this.props.children;
  }
}
export function World({
  preview,
  paused,
  progress,
  input,
  nearby,
  onPosition,
}: {
  preview: boolean;
  paused: boolean;
  progress: Progress;
  input: RefObject<Controls>;
  nearby: string | null;
  onPosition: (p: Point) => void;
}) {
  return (
    <WorldBoundary>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [43, 38, 53], fov: 45, near: 0.1, far: 250 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop={paused ? "demand" : "always"}
        fallback={
          <div className="webgl-fallback">
            Browser ini belum mendukung 3D.{" "}
            <a href="/classic/">Buka latihan 2D</a>
          </div>
        }
      >
        <Scenery preview={preview} paused={paused} />
        <InteractiveObjects
          progress={progress}
          nearby={nearby}
          paused={paused}
        />
        {preview ? (
          <PreviewCamera />
        ) : (
          <Player
            variant={progress.avatar}
            paused={paused}
            input={input}
            onPosition={onPosition}
          />
        )}
      </Canvas>
    </WorldBoundary>
  );
}
