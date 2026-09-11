import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Compass,
  Flag,
  Heart,
  Home,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Star,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { World } from "./world/World";
import { HomeScreen, ProfileScreen, AvatarScreen, Brand } from "./ui/Screens";
import { Modal, DialogPanel } from "./ui/Modal";
import type { Dialogue } from "./ui/Modal";
import { QuizModal } from "./ui/QuizModal";
import { Controls as GameControls } from "./ui/Controls";
import { IslandMap } from "./ui/Map";
import {
  OBJECTS,
  PROFILES,
  INTERACTION_RADIUS,
  SPAWN,
  ZONES,
} from "./data/world";
import type {
  Controls,
  ItemId,
  Point,
  QuizId,
  ProfileId,
  WorldObject,
} from "./data/types";
import { useSave, updateSave, updateProgress } from "./utils/storage";
import {
  activeMission,
  applyProgress,
  BADGES,
  freshProgress,
} from "./missions/progress";
import { getQuiz } from "./data/quizzes";
import { isObjectVisible } from "./world/InteractiveObjects";
import { muteAudio, sound } from "./utils/audio";
import "./game.css";
type Screen = "home" | "profiles" | "avatars" | "game";
type Panel = "pause" | "settings" | "help" | "map" | "journal" | "reset" | null;
export default function Adventure() {
  const { data, warning, blocked } = useSave();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home"),
    [panel, setPanel] = useState<Panel>(null),
    [dialogue, setDialogue] = useState<Dialogue | null>(null),
    [quiz, setQuiz] = useState<QuizId | null>(null),
    [toast, setToast] = useState(""),
    [position, setPosition] = useState<Point>(SPAWN);
  const input = useRef<Controls>({
    x: 0,
    z: 0,
    jump: false,
    orbit: 0,
    resetCamera: false,
  });
  const profile = data.active || "dinar",
    p = data.profiles[profile],
    mission = activeMission(p);
  const paused = !!panel || !!dialogue || !!quiz || blocked,
    preview = screen !== "game";
  const onPosition = useCallback((next: Point) => {
    setPosition(next);
    setReady(true);
  }, []);
  const nearby: WorldObject | null =
    screen === "game"
      ? OBJECTS.filter((o) => isObjectVisible(o, p))
          .map((o) => ({
            o,
            d: Math.hypot(
              o.position[0] - position[0],
              o.position[1] - position[1],
            ),
          }))
          .filter((o) => o.d < INTERACTION_RADIUS)
          .sort((a, b) => a.d - b.d)[0]?.o || null
      : null;
  const objective = OBJECTS.find((o) => o.id === mission.target)!;
  const distance = Math.round(
    Math.hypot(
      objective.position[0] - position[0],
      objective.position[1] - position[1],
    ),
  );
  useEffect(() => {
    muteAudio(data.muted);
  }, [data.muted]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const hide = () => {
      if (screen === "game" && document.hidden) setPanel("pause");
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [screen]);
  useEffect(() => {
    if (paused) {
      input.current.x = 0;
      input.current.z = 0;
      input.current.jump = false;
      input.current.orbit = 0;
    }
  }, [paused]);
  function notify(message: string) {
    setToast(message);
  }
  function mute() {
    updateSave((d) => ({ ...d, muted: !d.muted }));
  }
  function go(next: Screen) {
    setQuiz(null);
    setDialogue(null);
    setPanel(null);
    setScreen(next);
    sound("click");
  }
  function selectProfile(id: ProfileId) {
    updateSave((d) => ({ ...d, active: id }));
    go("avatars");
  }
  function start() {
    setReady(false);
    updateProgress(profile, (v) => applyProgress(v, { type: "start" }));
    setPosition(SPAWN);
    go("game");
  }
  function info(name: string, pages: string[]) {
    setDialogue({ name, pages });
  }
  function interact() {
    if (
      paused ||
      !nearby ||
      Math.hypot(
        nearby.position[0] - position[0],
        nearby.position[1] - position[1],
      ) >= INTERACTION_RADIUS
    )
      return;
    sound("click");
    switch (nearby.kind) {
      case "guide":
        info("Pak Guru Alam", [
          "Halo, peneliti kecil! Gunung Krakatau ada di seberang laut. Kita mengamatinya dari pulau ini agar tetap aman.",
          "Ingin menemukan hal baru? Selesaikan misi sains bersama Bu Guru, lalu cobalah latihan di meja eksperimen di sampingku.",
        ]);
        break;
      case "teacher":
        if (!p.completed.includes("welcome"))
          setDialogue({
            name: "Bu Guru Sains",
            pages: [
              `Halo, ${PROFILES[profile].name}! Selamat datang di pulau kita. Ada banyak hal kecil yang bisa kita pelajari bersama.`,
              "Bisakah kamu menemukan tiga benda dari alam? Cari batu, daun, dan kerang di Pantai Sains. Ikuti penanda kuning, ya!",
            ],
            action: "Mulai Misi",
            onDone: () => {
              updateProgress(profile, (v) =>
                applyProgress(v, { type: "complete", id: "welcome" }),
              );
              sound("win");
              notify("Misi pertama selesai! +5 bintang · Sahabat Guru");
            },
          });
        else if (p.items.length === 3 && !p.completed.includes("science"))
          setQuiz("science");
        else
          info("Bu Guru Sains", [
            p.completed.includes("science")
              ? "Kamu peneliti yang hebat! Teruskan petualanganmu ke hutan dan taman bintang. Meja eksperimen juga sudah terbuka."
              : `Ayo cari batu, daun, dan kerang di pantai. Kamu sudah menemukan ${p.items.length} dari 3 benda.`,
          ]);
        break;
      case "item":
        if (!p.completed.includes("welcome")) {
          info("Penemuan alam", [
            "Temui Bu Guru Sains lebih dulu. Beliau punya misi menarik untukmu!",
          ]);
          break;
        }
        updateProgress(profile, (v) =>
          applyProgress(v, { type: "item", id: nearby.id as ItemId }),
        );
        sound("collect");
        notify(`${nearby.name} ditemukan! +1 bintang`);
        if (p.items.length === 2) setQuiz("science");
        break;
      case "letters":
        if (!p.completed.includes("science"))
          info("Hutan Huruf", [
            "Selesaikan misi benda sains dahulu, lalu kita bermain huruf bersama di papan ini.",
          ]);
        else if (p.completed.includes("letters"))
          info("Hutan Huruf", [
            "Kamu sudah menjadi Sahabat Huruf! Cari lima bintang di taman, atau kunjungi meja eksperimen untuk latihan baru.",
          ]);
        else setQuiz("letters");
        break;
      case "star":
        if (!p.completed.includes("letters")) {
          info("Taman Bintang", [
            "Bintang-bintang ini menunggumu! Selesaikan Hutan Huruf untuk memulai misi berhitung.",
          ]);
          break;
        }
        updateProgress(profile, (v) =>
          applyProgress(v, { type: "star", id: nearby.id }),
        );
        sound("collect");
        notify("Satu bintang ditemukan! +1 bintang");
        if (p.stars.length === 4) setQuiz("count");
        break;
      case "count":
        if (p.stars.length === 5 && !p.completed.includes("count"))
          setQuiz("count");
        else
          info("Taman Hitung Bintang", [
            p.completed.includes("count")
              ? "Lima bintang sudah terkumpul. Hebat! Kamu boleh menjelajahi pulau atau berlatih di Pusat Sains."
              : p.completed.includes("letters")
                ? `Kumpulkan lima bintang di sekitar taman. Sudah ditemukan: ${p.stars.length}/5.`
                : "Mulai dari Bu Guru Sains, lalu Hutan Huruf. Setelah itu, ayo berhitung di taman!",
          ]);
        break;
      case "sign":
        setPanel("map");
        break;
      case "door":
        setDialogue({
          name: "Pusat Sains",
          pages: [
            p.unlocked.includes("lab")
              ? "Selamat datang di teras laboratorium! Bu Guru menyiapkan meja eksperimen di sebelah kanan bangunan. Kita belajar di luar sambil menikmati udara pulau."
              : "Klub Peneliti Kecil akan terbuka setelah kamu menyelesaikan misi sains. Meja eksperimen berada di sebelah kanan bangunan.",
          ],
          action: "Mengerti",
        });
        break;
      case "lab":
        if (p.unlocked.includes("lab")) setQuiz("lab");
        else
          info("Meja eksperimen", [
            "Temukan tiga benda alam dan selesaikan kuis sains untuk membuka Klub Peneliti Kecil.",
          ]);
        break;
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (screen !== "game" || e.repeat) return;
      if (e.code === "Escape" && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setPanel("pause");
      }
      if (e.code === "KeyE" && !paused) {
        e.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  function finishQuiz() {
    if (!quiz) return;
    updateProgress(profile, (v) =>
      applyProgress(
        v,
        quiz === "lab" ? { type: "lab" } : { type: "complete", id: quiz },
      ),
    );
    notify(
      quiz === "lab"
        ? "Penemuan baru! +2 bintang"
        : `Misi selesai! +5 bintang · ${BADGES[quiz]}`,
    );
    sound("win");
    setQuiz(null);
  }
  return (
    <div
      className={`krakatau-app ${screen === "game" ? "playing" : ""}`}
      data-ready={ready}
    >
      {(screen === "home" || screen === "game") && (
        <div className={`world-container ${preview ? "preview-world" : ""}`}>
          <World
            key={`${preview ? "preview" : "play"}-${profile}`}
            preview={preview}
            paused={paused}
            progress={p}
            input={input}
            nearby={nearby?.id || null}
            onPosition={onPosition}
          />
        </div>
      )}
      {screen === "home" && (
        <HomeScreen
          data={data}
          start={() => go("profiles")}
          resume={start}
          settings={() => setPanel("settings")}
          help={() => setPanel("help")}
          mute={mute}
          zone={(i) =>
            info(ZONES[i].name, [
              ZONES[i].text,
              i === 0
                ? "Temui Bu Guru Sains di jalan utama untuk memulai misi pertamamu."
                : i === 1
                  ? "Di antara pasir dan pepohonan, carilah batu, daun, dan kerang."
                  : i === 2
                    ? "Kenali huruf bersama Delisha atau susun kata bersama Dinar."
                    : "Selesaikan misi sains untuk membuka meja eksperimen dan latihan tambahan.",
            ])
          }
        />
      )}
      {screen === "profiles" && (
        <ProfileScreen
          data={data}
          select={selectProfile}
          back={() => go("home")}
        />
      )}
      {screen === "avatars" && (
        <AvatarScreen
          avatar={p.avatar}
          select={(avatar) => {
            updateProgress(profile, (v) => ({ ...v, avatar }));
            sound("click");
          }}
          name={PROFILES[profile].name}
          start={start}
          back={() => go("profiles")}
        />
      )}
      {screen === "game" && (
        <>
          <div className="hud-top">
            <div className="hud-player">
              <Brand />
              <div className="player-stats">
                <span className="hearts" aria-label="Tiga energi penuh">
                  {[0, 1, 2].map((i) => (
                    <Heart key={i} size={16} fill="currentColor" />
                  ))}
                </span>
                <span className="stat-divider" />
                <Star size={18} fill="#f0c15e" color="#bc872e" />
                <strong data-testid="star-total">{p.points}</strong>
                <span className="profile-chip">{PROFILES[profile].name}</span>
              </div>
            </div>
            <button
              className="mission-card"
              onClick={() => setPanel("journal")}
            >
              <span className="mission-icon">
                <Flag size={22} />
              </span>
              <span>
                <small>MISI {mission.index} DARI 4</small>
                <strong>{mission.title}</strong>
                <span>{mission.hint}</span>
              </span>
              <ArrowRight size={19} />
            </button>
            <div className="hud-right">
              <button
                className="minimap-button"
                aria-label="Buka peta pulau"
                onClick={() => setPanel("map")}
              >
                <IslandMap position={position} target={mission.target} />
              </button>
              <div>
                <button
                  className="k-icon"
                  aria-label="Jeda permainan"
                  onClick={() => setPanel("pause")}
                >
                  <Pause size={22} />
                </button>
                <button
                  className="k-icon journal-button"
                  aria-label="Buku petualangan"
                  onClick={() => setPanel("journal")}
                >
                  <BookOpen size={21} />
                </button>
              </div>
            </div>
          </div>
          <div className="destination">
            <span>◇</span>
            {objective.name}
            <small>{distance} m</small>
          </div>
          <div className="location-tag">
            <Compass size={15} />
            {
              ZONES.reduce(
                (closest, z) =>
                  Math.hypot(
                    z.position[0] - position[0],
                    z.position[1] - position[1],
                  ) <
                  Math.hypot(
                    closest.position[0] - position[0],
                    closest.position[1] - position[1],
                  )
                    ? z
                    : closest,
                ZONES[0],
              ).name
            }
          </div>
          {nearby && !paused && (
            <button className="interaction-prompt" onClick={interact}>
              <kbd>E</kbd>
              <span>
                <small>{nearby.name}</small>
                {nearby.kind === "item" || nearby.kind === "star"
                  ? "Ambil penemuan"
                  : nearby.kind === "teacher"
                    ? "Ayo bicara"
                    : "Jelajahi"}
              </span>
              <ArrowRight size={19} />
            </button>
          )}
          <GameControls
            input={input}
            available={!!nearby}
            paused={paused}
            interact={interact}
          />
        </>
      )}
      {screen === "game" && !ready && (
        <div className="loading-world" role="status">
          Menyiapkan penjelajah…
        </div>
      )}
      {toast && (
        <div className="reward-toast" role="status">
          <Star fill="#f3c85f" color="#a17b2f" />
          {toast}
        </div>
      )}
      {warning && (
        <div className="save-warning" role="alert">
          {warning}
        </div>
      )}
      {blocked && (
        <Modal title="Data perlu diperiksa">
          <p>{warning}</p>
          <a className="k-button primary" href="/classic/">
            Buka latihan Pulau Pintar
          </a>
        </Modal>
      )}
      {dialogue && (
        <DialogPanel dialogue={dialogue} onClose={() => setDialogue(null)} />
      )}
      {quiz && (
        <QuizModal
          key={`${profile}-${quiz}-${p.labRound}`}
          quiz={getQuiz(profile, quiz, p.labRound)}
          onComplete={finishQuiz}
          onClose={() => setQuiz(null)}
        />
      )}
      {panel === "pause" && (
        <Modal title="Istirahat sebentar?" onClose={() => setPanel(null)}>
          <p>Pulaumu menunggu. Progres disimpan di perangkat ini.</p>
          <div className="menu-buttons">
            <button className="k-button primary" onClick={() => setPanel(null)}>
              <Play size={19} />
              Lanjutkan permainan
            </button>
            <button className="k-button" onClick={mute}>
              {data.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}Suara:{" "}
              {data.muted ? "mati" : "nyala"}
            </button>
            <button className="k-button" onClick={() => go("profiles")}>
              <Users size={19} />
              Ganti profil
            </button>
            <button className="k-button" onClick={() => setPanel("help")}>
              <Compass size={19} />
              Panduan bermain
            </button>
            <button className="k-button" onClick={() => setPanel("reset")}>
              <RotateCcw size={19} />
              Reset progres {PROFILES[profile].name}
            </button>
            <button className="k-button" onClick={() => go("home")}>
              <Home size={19} />
              Kembali ke menu utama
            </button>
          </div>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="Pengaturan" onClose={() => setPanel(null)}>
          <p>Nyaman bermain, seru belajar.</p>
          <div className="menu-buttons">
            <button className="k-button" onClick={mute}>
              {data.muted ? <VolumeX /> : <Volume2 />}Suara:{" "}
              {data.muted ? "mati" : "nyala"}
            </button>
            {data.active && (
              <button className="k-button" onClick={() => setPanel("reset")}>
                <RotateCcw size={19} />
                Reset progres {PROFILES[profile].name}
              </button>
            )}
            <a className="k-button" href="/classic/parent">
              <Settings size={19} />
              Panel orang tua · mode latihan 2D
            </a>
          </div>
          <p className="small-note">
            Progres 3D terpisah dari latihan 2D. Batas waktu dan PIN mode
            latihan 2D berlaku hanya di mode tersebut.
          </p>
        </Modal>
      )}
      {panel === "reset" && (
        <Modal
          title={`Mulai lagi, ${PROFILES[profile].name}?`}
          onClose={() => setPanel(screen === "game" ? "pause" : "settings")}
        >
          <p>
            Semua bintang, lencana, dan misi 3D {PROFILES[profile].name} akan
            direset. Progres anak yang lain dan latihan Pulau Pintar tetap
            tersimpan.
          </p>
          <div className="menu-buttons">
            <button
              className="k-button secondary"
              onClick={() => setPanel(screen === "game" ? "pause" : "settings")}
            >
              Batal
            </button>
            <button
              className="k-button reset-confirm"
              onClick={() => {
                updateProgress(profile, () => freshProgress());
                go("avatars");
              }}
            >
              Ya, reset progres {PROFILES[profile].name}
            </button>
          </div>
        </Modal>
      )}
      {panel === "help" && (
        <Modal
          title="Ayo berkenalan dengan pulaumu"
          onClose={() => setPanel(null)}
        >
          <div className="help-grid">
            <p>
              <kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd>
              <strong>Berjalan menjelajahi pulau</strong>
            </p>
            <p>
              <kbd>Spasi</kbd>
              <strong>Melompat di jalan dan batu kecil</strong>
            </p>
            <p>
              <kbd>E</kbd>
              <strong>Bicara atau ambil benda di dekatmu</strong>
            </p>
            <p>
              <kbd>Esc</kbd>
              <strong>Jeda untuk istirahat</strong>
            </p>
          </div>
          <p>
            Geser layar atau gunakan tombol putar untuk mengatur kamera. Pada
            layar sentuh, gunakan joystick kiri dan tombol lompat serta
            interaksi di kanan.
          </p>
          <p>
            Mulai dari Bu Guru Sains. Buka peta untuk melihat titik posisimu dan
            tujuan kuning. Semua misi bisa dicoba lagi tanpa kehilangan bintang.
          </p>
          <button className="k-button primary" onClick={() => setPanel(null)}>
            Siap menjelajah <ArrowRight size={18} />
          </button>
        </Modal>
      )}
      {panel === "map" && (
        <Modal
          title="Peta pulau petualangan"
          className="map-modal"
          onClose={() => setPanel(null)}
        >
          <IslandMap large position={position} target={mission.target} />
          <div className="map-legend">
            <span>● Posisimu</span>
            <span>
              🟡 {objective.name} · {distance} m
            </span>
          </div>
          <div className="map-zones">
            {ZONES.map((z, i) => (
              <div key={z.name}>
                <b>{i + 1}</b>
                <span>
                  <strong>{z.name}</strong>
                  <small>{z.text}</small>
                </span>
              </div>
            ))}
          </div>
          <p className="small-note">
            Krakatau ada di utara, di seberang laut. Kita menikmatinya dari
            pulau yang aman.
          </p>
        </Modal>
      )}
      {panel === "journal" && (
        <Modal title="Buku petualangan" onClose={() => setPanel(null)}>
          <p>
            {PROFILES[profile].name} · {p.completed.length}/4 misi selesai ·{" "}
            {p.points} bintang
          </p>
          <div className="mission-list">
            {(["welcome", "science", "letters", "count"] as const).map(
              (id, i) => (
                <div
                  key={id}
                  className={p.completed.includes(id) ? "done" : ""}
                >
                  <span>
                    {p.completed.includes(id) ? <Check size={20} /> : i + 1}
                  </span>
                  <div>
                    <strong>
                      {
                        [
                          "Temui Bu Guru Sains",
                          "Temukan 3 Benda Sains",
                          "Hutan Huruf",
                          "Hitung Bintang",
                        ][i]
                      }
                    </strong>
                    <small>
                      {p.completed.includes(id)
                        ? "Selesai · " + BADGES[id]
                        : mission.index === i + 1
                          ? mission.hint
                          : "Menunggu misi sebelumnya"}
                    </small>
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="badge-list">
            {p.badges.length ? (
              p.badges.map((b) => (
                <span key={b}>
                  <Award size={20} />
                  {b}
                </span>
              ))
            ) : (
              <p>Lencana pertama menunggumu bersama Bu Guru.</p>
            )}
          </div>
          {p.unlocked.includes("lab") && (
            <p className="unlock-note">
              <Check size={18} /> Klub Peneliti Kecil sudah terbuka!
            </p>
          )}
          <button
            className="k-button primary"
            onClick={() => {
              setPanel("map");
            }}
          >
            <MapIcon size={19} />
            Lihat tujuan di peta
          </button>
        </Modal>
      )}
    </div>
  );
}
