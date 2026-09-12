import { useState } from "react";
import type { MapId } from "../../game/data/types";
import { MAPS } from "../../game/maps/mapRegistry";
import { IslandMap } from "../../game/ui/Map";
import type { RoomRequest, SessionOptions } from "../../multiplayer/types";
import { SessionFields } from "./SessionFields";
export function CreateRoomPanel({
  defaults,
  submit,
  busy,
}: {
  defaults: SessionOptions;
  submit: (r: RoomRequest) => void;
  busy: boolean;
}) {
  const [mapId, setMapId] = useState<MapId>("krakatau"),
    [options, setOptions] = useState(defaults);
  return (
    <form
      className="mp-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...options, mode: "create", mapId });
      }}
    >
      <h2>Buat petualangan bersama</h2>
      <p>Pilih pulau, lalu undang hingga tiga teman.</p>
      <fieldset disabled={busy} className="mp-map-picker">
        <legend>Pilih map</legend>
        {Object.values(MAPS).map((map) => (
          <label key={map.id} className={mapId === map.id ? "selected" : ""}>
            <IslandMap mapId={map.id} position={map.spawn} target="" />
            <span>
              <input
                type="radio"
                name="mp-map"
                value={map.id}
                checked={mapId === map.id}
                onChange={() => setMapId(map.id)}
              />
              {map.name}
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset disabled={busy} className="mp-fields">
        <SessionFields value={options} change={setOptions} />
      </fieldset>
      <button className="k-button primary" disabled={busy} type="submit">
        {busy ? "Menghubungkan…" : "Buat Room"}
      </button>
    </form>
  );
}
