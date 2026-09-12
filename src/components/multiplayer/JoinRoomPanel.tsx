import { useState } from "react";
import type { RoomRequest, SessionOptions } from "../../multiplayer/types";
import { SessionFields } from "./SessionFields";
export function JoinRoomPanel({
  defaults,
  submit,
  busy,
}: {
  defaults: SessionOptions;
  submit: (r: RoomRequest) => void;
  busy: boolean;
}) {
  const [code, setCode] = useState(""),
    [options, setOptions] = useState(defaults);
  return (
    <form
      className="mp-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...options, mode: "join", roomCode: code });
      }}
    >
      <h2>Temui teman di pulau</h2>
      <p>Minta kode enam karakter dari host.</p>
      <fieldset disabled={busy} className="mp-fields">
        <label className="mp-field">
          Kode room
          <input
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="KRAK42"
            required
            aria-describedby="mp-code-help"
          />
          <small id="mp-code-help">Kamu akan masuk ke map pilihan host.</small>
        </label>
        <SessionFields value={options} change={setOptions} />
      </fieldset>
      <button
        className="k-button primary"
        disabled={busy || !code.trim()}
        type="submit"
      >
        {busy ? "Menghubungkan…" : "Gabung Room"}
      </button>
    </form>
  );
}
