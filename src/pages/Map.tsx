import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Flag,
  LockKeyhole,
  Map as MapIcon,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { ISLANDS, LEVELS } from "../content/levels";
import { Kiko, Modal, names } from "../components/Common";
import { useProfile } from "../hooks/useProfile";
import { updateProfile } from "../storage/store";
import { remaining } from "../engine/timer";
import { unlocked } from "../engine/game";
import type { IslandId } from "../types";
export function MapPage() {
  const { id, profile } = useProfile(),
    navigate = useNavigate();
  const [island, setIsland] = useState<IslandId | null>(null);
  if (!id || !profile) return <Navigate to="/" replace />;
  const selected = ISLANDS.find((i) => i.id === island),
    left = remaining(profile),
    complete = profile.badges.length;
  function start(levelId: string) {
    if (!id) return;
    updateProfile(id, (p) => ({
      ...p,
      session:
        p.session && !p.session.ended
          ? p.session
          : {
              id: crypto.randomUUID(),
              completed: [],
              ended: false,
              startedAt: Date.now(),
              durationMs: 0,
            },
    }));
    navigate(`/play/${levelId}`);
  }
  return (
    <main className="map-page">
      <div className="map-heading">
        <div>
          <span className="eyebrow">
            <MapIcon size={14} /> PETA PETUALANGAN
          </span>
          <h1>
            Ayo menjelajah, {names[id]}
            <span className="coral">!</span>
          </h1>
          <p>Pilih pulau. Temukan hal baru. Bantu Kiko menyalakan mercusuar.</p>
        </div>
        <div className="traveler-chip">
          <Kiko avatar={profile.avatar} />
          <div>
            <strong>{names[id]}</strong>
            <Link to="/">Ganti penjelajah</Link>
          </div>
        </div>
      </div>
      <div className="journey-strip">
        <span>
          <Timer size={18} /> Sisa hari ini{" "}
          <strong>{Math.ceil(left / 60000)} menit</strong>
        </span>
        <span>
          <Flag size={18} />
          <strong>{complete}/12</strong> lencana perjalanan
        </span>
        <Link to="/session">
          Selesai & istirahat <ArrowRight size={16} />
        </Link>
      </div>
      <section className="map-stage" aria-label="Peta empat pulau">
        <img
          className="map-image"
          src="/assets/islands.png"
          alt="Jalur laut menghubungkan Pulau Angka, Hutan Kata, Bukit Logika, dan Desa Kebaikan dengan mercusuar di tengah"
        />
        {ISLANDS.map((i, index) => {
          const n = profile.badges.filter((b) =>
            b.includes(`-${i.id}-`),
          ).length;
          return (
            <button
              key={i.id}
              className={`island-marker island-${index} ${n ? "visited" : ""}`}
              onClick={() => setIsland(i.id)}
              aria-label={`Jelajahi ${i.name}, ${n} dari 3 level selesai`}
            >
              <span className="island-symbol" style={{ background: i.color }}>
                {i.icon}
              </span>
              <span>
                <strong>{i.name}</strong>
                <small>
                  {n ? `${n} dari 3 misi selesai` : "3 misi menantimu"}
                </small>
              </span>
              <span className="marker-action">
                {n === 3 ? <Check size={18} /> : <ArrowRight size={18} />}
              </span>
            </button>
          );
        })}
        <div className={`lighthouse-label ${complete ? "lit" : ""}`}>
          <Sparkles size={17} />
          <span>
            Mercusuar
            <br />
            <strong>
              {complete === 12
                ? "Bersinar terang!"
                : complete
                  ? "Mulai bersinar"
                  : "Persahabatan"}
            </strong>
          </span>
        </div>
        <div className="map-kiko">
          <Kiko avatar={profile.avatar} />
        </div>
        <span className="map-coordinate">LAUT PENUH RASA INGIN TAHU</span>
      </section>
      <div className="kiko-note">
        <Kiko />
        <p>
          <strong>“Setiap langkah kecil berarti.”</strong>
          <br />
          Semua pulau boleh kamu coba. Kita menjelajah pelan-pelan, ya.
        </p>
        <span className="pill">BERSAMA KIKO</span>
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setIsland(null)}>
          <button
            className="close-button"
            aria-label="Tutup pilihan misi"
            onClick={() => setIsland(null)}
          >
            <X />
          </button>
          <p>{selected.description}</p>
          {left === 0 ? (
            <>
              <p>
                Waktu bermain hari ini sudah selesai. Kiko mengajakmu istirahat.
              </p>
              <Link className="primary" to="/session">
                Selesai & Istirahat
              </Link>
            </>
          ) : profile.session?.ended ? (
            <>
              <p>
                Sesi ini sudah selesai. Lihat cerita perjalananmu dan
                beristirahat dulu.
              </p>
              <Link className="primary" to="/session">
                Lihat penutup sesi
              </Link>
            </>
          ) : (
            <div className="mission-list">
              {LEVELS.filter(
                (l) => l.profile === id && l.island === island,
              ).map((l) => (
                <button
                  className="mission"
                  key={l.id}
                  disabled={!unlocked(profile, l)}
                  onClick={() => start(l.id)}
                >
                  <span className="mission-number">
                    {profile.badges.includes(l.id) ? (
                      <Check />
                    ) : unlocked(profile, l) ? (
                      l.rank
                    ) : (
                      <LockKeyhole size={19} />
                    )}
                  </span>
                  <span>
                    <strong>{l.title}</strong>
                    <small>
                      {unlocked(profile, l)
                        ? profile.drafts[l.id]
                          ? "Lanjutkan petualangan"
                          : "5 aktivitas singkat"
                        : `Selesaikan level ${l.rank - 1} dahulu`}
                    </small>
                  </span>
                  <ArrowRight size={20} />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}
