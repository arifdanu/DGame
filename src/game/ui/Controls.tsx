import { useState } from "react";
import type { RefObject, PointerEvent } from "react";
import { ArrowUp, Hand, RotateCcw, RotateCw } from "lucide-react";
import type { Controls as Input } from "../data/types";
export function Controls({
  input,
  interact,
  available,
  paused,
  showInteraction = true,
}: {
  input: RefObject<Input>;
  interact: () => void;
  available: boolean;
  paused: boolean;
  showInteraction?: boolean;
}) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2,
      y = e.clientY - rect.top - rect.height / 2;
    const length = Math.max(1, Math.hypot(x, y) / 36);
    input.current.x = x / length / 36;
    input.current.z = y / length / 36;
    setKnob({ x: x / length, y: y / length });
  }
  function release() {
    input.current.x = 0;
    input.current.z = 0;
    setKnob({ x: 0, y: 0 });
  }
  if (paused) return null;
  return (
    <>
      <div className="desktop-help">
        <span>
          <kbd>W</kbd>
          <span>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </span>
        </span>
        <span>Berjalan</span>
        <i />
        <kbd>Spasi</kbd>
        <span>Lompat</span>
        <i />
        {showInteraction && (
          <>
            <kbd>E</kbd>
            <span>Interaksi</span>
            <i />
          </>
        )}
        <span>Geser layar untuk melihat</span>
      </div>
      <div className="camera-buttons">
        <button
          className="k-icon"
          aria-label="Putar kamera ke kiri"
          onPointerDown={() => (input.current.orbit = -1)}
          onPointerUp={() => (input.current.orbit = 0)}
          onPointerLeave={() => (input.current.orbit = 0)}
          onPointerCancel={() => (input.current.orbit = 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") input.current.orbit = -1;
          }}
          onKeyUp={() => (input.current.orbit = 0)}
        >
          <RotateCcw size={20} />
        </button>
        <button
          className="k-icon"
          aria-label="Reset kamera"
          onClick={() => {
            input.current.resetCamera = true;
          }}
        >
          ◎
        </button>
        <button
          className="k-icon"
          aria-label="Putar kamera ke kanan"
          onPointerDown={() => (input.current.orbit = 1)}
          onPointerUp={() => (input.current.orbit = 0)}
          onPointerLeave={() => (input.current.orbit = 0)}
          onPointerCancel={() => (input.current.orbit = 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") input.current.orbit = 1;
          }}
          onKeyUp={() => (input.current.orbit = 0)}
        >
          <RotateCw size={20} />
        </button>
      </div>
      <div className="touch-controls">
        <div
          className="joystick"
          role="group"
          aria-label="Joystick gerak"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e);
          }}
          onPointerMove={move}
          onPointerUp={release}
          onLostPointerCapture={release}
          onPointerCancel={release}
        >
          <span className="joystick-cross">＋</span>
          <span
            className="joystick-knob"
            style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}
          />
        </div>
        <div className="touch-actions">
          <button
            className="k-icon jump-button"
            aria-label="Lompat"
            onClick={() => (input.current.jump = true)}
          >
            <ArrowUp />
            Lompat
          </button>
          {showInteraction && (
            <button
              className="k-icon interact-touch"
              disabled={!available}
              aria-label="Interaksi"
              onClick={interact}
            >
              <Hand />
              Ambil / bicara
            </button>
          )}
        </div>
      </div>
    </>
  );
}
