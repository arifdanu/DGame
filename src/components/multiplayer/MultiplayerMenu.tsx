import { useState } from "react";
import { Brand } from "../../game/ui/Screens";
import type {
  RoomRequest,
  RoomState,
  SessionOptions,
} from "../../multiplayer/types";
import { CreateRoomPanel } from "./CreateRoomPanel";
import { JoinRoomPanel } from "./JoinRoomPanel";
import { ConnectionStatus } from "./ConnectionStatus";
export function MultiplayerMenu({
  state,
  defaults,
  submit,
  retry,
  solo,
}: {
  state: RoomState;
  defaults: SessionOptions;
  submit: (r: RoomRequest) => void;
  retry: () => void;
  solo: () => void;
}) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const busy = state.status === "connecting";
  return (
    <section className="mp-menu selection-screen">
      <header className="k-header">
        <Brand />
        <button className="k-button secondary" onClick={solo}>
          Main Sendiri
        </button>
      </header>
      <div className="mp-title">
        <span className="k-eyebrow">SATU KODE · EMPAT PENJELAJAH</span>
        <h1>Main Bersama</h1>
        <p>Jelajahi pulau dengan teman yang kamu kenal.</p>
      </div>
      <div className="mp-shell">
        <div className="mp-tabs" role="group" aria-label="Cara masuk room">
          <button
            className={mode === "create" ? "selected" : ""}
            aria-pressed={mode === "create"}
            disabled={busy}
            onClick={() => setMode("create")}
          >
            Buat room baru
          </button>
          <button
            className={mode === "join" ? "selected" : ""}
            aria-pressed={mode === "join"}
            disabled={busy}
            onClick={() => setMode("join")}
          >
            Punya kode room
          </button>
        </div>
        <ConnectionStatus status={state.status} />
        {state.message && (
          <div className="mp-error" role="alert">
            <p>{state.message}</p>
            {!busy && (
              <button className="k-button secondary" onClick={retry}>
                Coba Lagi
              </button>
            )}
          </div>
        )}
        {mode === "create" ? (
          <CreateRoomPanel defaults={defaults} submit={submit} busy={busy} />
        ) : (
          <JoinRoomPanel defaults={defaults} submit={submit} busy={busy} />
        )}
      </div>
      <p className="mp-footnote">
        Kode hanya untuk teman yang dikenal. Nama panggilan berlaku selama sesi
        ini.
      </p>
    </section>
  );
}
