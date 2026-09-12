import { Canvas } from "@react-three/fiber";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Leaf,
  Play,
  Settings,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { WorldBoundary } from "../world/World";
import { Avatar } from "../avatars/Avatar";
import { mapTotals } from "../maps/mapRegistry";
import { AVATARS, PROFILES, ZONES } from "../data/world";
import type { AvatarId, ProfileId, SaveData } from "../data/types";
export function Brand() {
  return (
    <div className="k-brand">
      <span className="brand-symbol">
        <Compass size={27} />
      </span>
      <span>
        PETUALANGAN
        <strong>
          Krakatau Pintar<span>✦</span>
        </strong>
      </span>
    </div>
  );
}
export function HomeScreen({
  data,
  start,
  resume,
  together,
  settings,
  help,
  mute,
  zone,
}: {
  data: SaveData;
  start: () => void;
  resume: () => void;
  together: () => void;
  settings: () => void;
  help: () => void;
  mute: () => void;
  zone: (i: number) => void;
}) {
  const canContinue = data.active && data.profiles[data.active].started;
  return (
    <div className="home-screen">
      <header className="k-header">
        <Brand />
        <nav>
          <button className="k-text-button help-nav" onClick={help}>
            Panduan bermain
          </button>
          <button
            className="k-icon"
            aria-label={data.muted ? "Nyalakan suara" : "Bisukan suara"}
            onClick={mute}
          >
            {data.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
          <button className="k-icon" aria-label="Pengaturan" onClick={settings}>
            <Settings size={21} />
          </button>
        </nav>
      </header>
      <div className="home-copy">
        <div className="k-eyebrow">
          <span className="status-dot" /> PULAU KECIL, PENEMUAN BESAR
        </div>
        <h1>
          Petualangan
          <br />
          <em>
            Krakatau
            <br /> Pintar.
          </em>
        </h1>
        <p>
          Rasa ingin tahu adalah awal petualangan.
          <br />
          Ayo menjelajah, bermain, dan belajar bersama!
        </p>
        <button className="k-button primary start-button" onClick={start}>
          <Play size={19} fill="currentColor" /> Mulai Bermain{" "}
          <ArrowRight size={21} />
        </button>
        <button
          className="k-button continue-button"
          disabled={!canContinue}
          onClick={resume}
        >
          <Compass size={20} /> Lanjutkan
          {canContinue
            ? ` sebagai ${PROFILES[data.active!].name}`
            : " petualangan"}
        </button>
        <button
          className="k-button secondary together-button"
          onClick={together}
        >
          Main Bersama <ArrowRight size={18} />
        </button>
        <div className="home-note">
          <Leaf size={16} />
          <span>Dunia aman untuk imajinasi yang besar.</span>
        </div>
      </div>
      <div className="island-caption">
        <span className="caption-pin">✦</span>
        <div>
          <strong>Selamat datang di pulaumu</strong>
          <span>2 map · 15 area untuk dijelajahi</span>
        </div>
      </div>
      <div className="zone-strip">
        <div className="zone-intro">
          <span className="k-eyebrow">SATU PULAU</span>
          <strong>Banyak cerita.</strong>
        </div>
        {ZONES.map((z, i) => (
          <button key={z.name} onClick={() => zone(i)}>
            <span
              className="zone-icon"
              style={{ background: z.color + "30", color: z.color }}
            >
              {z.icon}
            </span>
            <span>
              <strong>{z.name}</strong>
              <small>{z.text}</small>
            </span>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
      <footer className="k-footer">
        <span>
          Dibuat untuk Dinar & Delisha <span aria-hidden="true">♡</span>
        </span>
        <a href="/classic/">Latihan Pulau Pintar ↗</a>
        <span>Jelajah. Temukan. Tumbuh.</span>
      </footer>
    </div>
  );
}
export function ProfileScreen({
  data,
  select,
  back,
}: {
  data: SaveData;
  select: (id: ProfileId) => void;
  back: () => void;
}) {
  return (
    <section className="selection-screen">
      <header className="k-header">
        <Brand />
        <button className="k-text-button" onClick={back}>
          <ArrowLeft size={18} /> Menu utama
        </button>
      </header>
      <div className="selection-title">
        <span className="k-eyebrow">01 / SIAP BERANGKAT</span>
        <h1>Siapa yang menjelajah hari ini?</h1>
        <p>Petualangan yang sama, penemuan yang berbeda.</p>
      </div>
      <div className="profile-choices">
        {(["dinar", "delisha"] as ProfileId[]).map((id) => (
          <button
            key={id}
            className={`profile-choice ${id}`}
            onClick={() => select(id)}
          >
            <span className="profile-art">{PROFILES[id].icon}</span>
            <span className="profile-name">{PROFILES[id].name}</span>
            <span>
              {PROFILES[id].age} · {PROFILES[id].level}
            </span>
            <p>{PROFILES[id].note}</p>
            <span className="profile-progress">
              <Star size={18} />
              {mapTotals(data.profiles[id]).points} bintang <span>·</span>{" "}
              {mapTotals(data.profiles[id]).missions}/16 misi
            </span>
            <span className="k-button primary">
              Pilih {PROFILES[id].name}
              <ArrowRight size={19} />
            </span>
          </button>
        ))}
      </div>
      <p className="selection-footnote">
        Progres tersimpan sendiri untuk setiap penjelajah.
      </p>
    </section>
  );
}
export function AvatarScreen({
  avatar,
  select,
  name,
  start,
  back,
}: {
  avatar: AvatarId;
  select: (id: AvatarId) => void;
  name: string;
  start: () => void;
  back: () => void;
}) {
  return (
    <section className="selection-screen avatar-screen">
      <header className="k-header">
        <Brand />
        <button className="k-text-button" onClick={back}>
          <ArrowLeft size={18} /> Ganti profil
        </button>
      </header>
      <div className="selection-title">
        <span className="k-eyebrow">02 / TIM PENJELAJAH</span>
        <h1>Pilih teman petualanganmu, {name}.</h1>
        <p>Tiga sahabat. Sama-sama penuh rasa ingin tahu.</p>
      </div>
      <div className="avatar-choices">
        {AVATARS.map((a, i) => (
          <button
            key={a.name}
            className={`avatar-choice ${avatar === i ? "selected" : ""}`}
            aria-label={a.role}
            aria-pressed={avatar === i}
            onClick={() => select(i as AvatarId)}
          >
            <span className="avatar-check">
              {avatar === i ? <Check size={18} /> : i + 1}
            </span>
            <div className="avatar-preview">
              <WorldBoundary
                fallback={<span className="avatar-no-webgl">🧭</span>}
              >
                <Canvas
                  frameloop="demand"
                  dpr={[1, 1.5]}
                  camera={{ position: [0, 1.9, 5.2], fov: 35 }}
                  onCreated={({ camera }) => camera.lookAt(0, 1.1, 0)}
                >
                  <ambientLight intensity={2} />
                  <directionalLight position={[3, 5, 4]} intensity={3} />
                  <group rotation={[0, 0.3, 0]}>
                    <Avatar variant={i as AvatarId} paused />
                  </group>
                </Canvas>
              </WorldBoundary>
            </div>
            <strong>{a.name}</strong>
            <p>{a.tag}</p>
          </button>
        ))}
      </div>
      <button className="k-button primary adventure-button" onClick={start}>
        Mulai Petualangan <ArrowRight size={21} />
      </button>
      <p className="selection-footnote">
        Avatar bisa diganti saat memulai petualangan lagi.
      </p>
    </section>
  );
}
