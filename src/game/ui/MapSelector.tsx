import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Star,
  Flag,
  Compass,
} from "lucide-react";
import { MAPS, mapUnlocked } from "../maps/mapRegistry";
import type { MapId, PlayerProgress } from "../data/types";
import { Brand } from "./Screens";
import { IslandMap } from "./Map";
export function MapSelector({
  player,
  enter,
  back,
}: {
  player: PlayerProgress;
  enter: (id: MapId) => void;
  back: () => void;
}) {
  return (
    <section className="selection-screen map-selector">
      <header className="k-header">
        <Brand />
        <button className="k-text-button" onClick={back}>
          <ArrowLeft size={18} />
          Kembali
        </button>
      </header>
      <div className="selection-title">
        <span className="k-eyebrow">03 / DUA DUNIA, BANYAK CERITA</span>
        <h1>Ke mana kita menjelajah?</h1>
        <p>Dari lereng hijau Krakatau hingga birunya Raja Ampat.</p>
      </div>
      <div className="map-choices">
        {Object.values(MAPS).map((map) => {
          const p = player.maps[map.id],
            open = mapUnlocked(map.id, player);
          return (
            <article
              key={map.id}
              className={`map-choice ${map.id} ${open ? "" : "locked"}`}
            >
              <div className="map-preview">
                <IslandMap
                  mapId={map.id}
                  position={map.spawn}
                  target={map.id === "krakatau" ? "teacher" : "ra-teacher"}
                  large
                />
                <span className="map-size-tag">
                  {map.areas.length} area · 2× luas pulau awal
                </span>
              </div>
              <div className="map-choice-copy">
                <span className={`map-status ${open ? "open" : ""}`}>
                  {open ? <Compass size={14} /> : <LockKeyhole size={14} />}{" "}
                  {open ? "Terbuka" : "Selesaikan misi awal Krakatau"}
                </span>
                <h2>{map.name}</h2>
                <p>{map.description}</p>
                <div className="map-stats">
                  <span>
                    <Star size={16} />
                    {p.points} bintang
                  </span>
                  <span>
                    <Flag size={16} />
                    {p.completed.length}/{map.missionIds.length} misi
                  </span>
                </div>
                <button
                  className="k-button primary"
                  disabled={!open}
                  onClick={() => enter(map.id)}
                  aria-label={`Masuk Map ${map.name}`}
                >
                  Masuk Map <ArrowRight size={19} />
                </button>
                {player.started && player.lastMap === map.id && (
                  <small className="last-map">Terakhir kamu jelajahi</small>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="selection-footnote">
        Bintang, misi, dan lencana tersimpan sendiri di setiap map.
      </p>
    </section>
  );
}
