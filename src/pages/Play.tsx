import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Flag,
  Lightbulb,
  LogOut,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { LEVELS, ISLANDS } from "../content/levels";
import { useProfile } from "../hooks/useProfile";
import { updateData, updateProfile } from "../storage/store";
import {
  acceptGuide,
  answer,
  completeLevel,
  freshDraft,
  freshRecord,
  solution,
  unlocked,
} from "../engine/game";
import { remaining } from "../engine/timer";
import { useGameClock, useProfileLock } from "../hooks/useGameClock";
import { stopSpeech, useSpeech } from "../hooks/useSpeech";
import { Empty, Kiko, Modal } from "../components/Common";
import { Interaction } from "../components/Interaction";
import type { Draft, Level, ProfileId } from "../types";
export function PlayRoute() {
  const { levelId } = useParams(),
    { id, profile } = useProfile();
  const level = LEVELS.find((l) => l.id === levelId);
  if (!id || !profile) return <Navigate to="/" replace />;
  if (!level || level.profile !== id || !unlocked(profile, level))
    return (
      <Empty title="Misi belum tersedia">
        <p>Pilih misi yang terbuka untuk penjelajahmu.</p>
        <Link className="primary" to="/map">
          Kembali ke peta
        </Link>
      </Empty>
    );
  return <Game key={`${id}-${level.id}`} id={id} level={level} />;
}
function Game({ id, level }: { id: ProfileId; level: Level }) {
  const { data } = useProfile(),
    profile = data.profiles[id],
    navigate = useNavigate(),
    lock = useProfileLock(id);
  const [paused, setPaused] = useState(false),
    [exit, setExit] = useState(false),
    [result, setResult] = useState<Draft | null>(null),
    [hint, setHint] = useState(false);
  const draft = profile.drafts[level.id] ?? freshDraft(),
    activity = level.activities[draft.index],
    left = remaining(profile),
    ended = profile.session?.ended ?? false;
  const active =
    lock === "owned" &&
    !paused &&
    !exit &&
    !result &&
    !ended &&
    left > 0 &&
    profile.tutorial;
  const { speak, notice } = useSpeech(data.sound);
  useGameClock(id, active, level.island);
  useEffect(() => {
    if (!active) stopSpeech();
  }, [active]);
  useEffect(() => {
    return () => stopSpeech();
  }, []);
  useEffect(() => {
    if (lock === "owned" && !profile.session)
      updateProfile(id, (p) => ({
        ...p,
        session: {
          id: crypto.randomUUID(),
          completed: [],
          ended: false,
          startedAt: Date.now(),
          durationMs: 0,
        },
      }));
  }, [id, lock, profile.session]);
  const change = (fn: (d: Draft) => Draft) => {
    if (!active) return;
    updateProfile(id, (p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [level.id]: fn(p.drafts[level.id] ?? freshDraft()),
      },
    }));
  };
  function next() {
    if (!active || draft.feedback !== "correct") return;
    stopSpeech();
    setHint(false);
    if (draft.index === 4) {
      setResult(draft);
      updateProfile(id, (p) => completeLevel(p, level, draft));
    } else
      change((d) =>
        d.feedback === "correct"
          ? { ...d, index: d.index + 1, input: [], feedback: "none" }
          : d,
      );
  }
  if (lock !== "owned")
    return (
      <Empty
        title={
          lock === "busy"
            ? "Kiko sedang bermain di tab lain"
            : lock === "unsupported"
              ? "Browser perlu diperbarui"
              : "Menyiapkan perjalanan…"
        }
      >
        <p>
          {lock === "busy"
            ? "Tutup permainan di tab lain, lalu buka misi ini lagi."
            : lock === "unsupported"
              ? "Gunakan browser modern melalui HTTPS atau localhost agar satu profil tidak bermain di dua tab."
              : "Sebentar, Kiko memeriksa perahumu."}
        </p>
        <Link className="primary" to="/map">
          Kembali ke peta
        </Link>
      </Empty>
    );
  if (left === 0)
    return (
      <Empty title="Saatnya istirahat, penjelajah">
        <p>
          Waktu bermain hari ini sudah selesai. Perjalananmu tersimpan. Kita
          lanjut lagi besok.
        </p>
        <Link className="primary" to="/session">
          Selesai & Istirahat
        </Link>
      </Empty>
    );
  if (result)
    return (
      <main className="narrow center result-page">
        <div className="big-badge">
          <Flag />
        </div>
        <span className="eyebrow">SATU LANGKAH PENUH USAHA</span>
        <h1>Misi selesai!</h1>
        <h2>{level.title}</h2>
        <p>
          Kamu sudah mencoba lima aktivitas dan membantu cahaya mercusuar
          bertambah terang.
        </p>
        <div className="result-facts">
          <span>
            <strong>5</strong>aktivitas selesai
          </span>
          <span>
            <strong>
              {
                Object.values(result.records).filter(
                  (r) => r.help > 0 || r.guided,
                ).length
              }
            </strong>
            aktivitas dengan bantuan
          </span>
        </div>
        <p>Satu lencana untuk misi ini. Mengulang misi tetap boleh.</p>
        <Link className="primary" to={ended ? "/session" : "/map"}>
          {ended ? "Lihat penutup sesi" : "Kembali ke peta"}
          <ArrowRight size={20} />
        </Link>
        <Link className="text-link" to="/session">
          Selesai & Istirahat
        </Link>
      </main>
    );
  if (ended) return <Navigate to="/session" replace />;
  return (
    <main className={`play-page theme-${level.island}`}>
      <div className="play-toolbar">
        <button
          className="quiet-button"
          onClick={() => {
            stopSpeech();
            setExit(true);
          }}
        >
          <LogOut size={18} />
          Keluar & simpan
        </button>
        <span>
          {ISLANDS.find((i) => i.id === level.island)!.name} · Level{" "}
          {level.rank}
        </span>
        <button
          className="quiet-button"
          onClick={() => {
            stopSpeech();
            setPaused(true);
          }}
        >
          <Pause size={18} />
          Jeda
        </button>
      </div>
      <div className="activity-progress">
        <span>Misi: {level.title}</span>
        <div aria-label={`Aktivitas ${draft.index + 1} dari 5`}>
          {level.activities.map((a, i) => (
            <span key={a.id} className={i <= draft.index ? "filled" : ""}>
              {i < draft.index ? <Check size={14} /> : i + 1}
            </span>
          ))}
        </div>
        <span>{draft.index + 1} dari 5</span>
      </div>
      {left <= 60000 && (
        <p className="time-warning" role="status">
          Satu menit lagi. Kita segera beristirahat, ya.
        </p>
      )}
      <section className="activity-card">
        <div className="instruction-header">
          <div>
            <span className="eyebrow">
              {level.island === "kebaikan" ? "CERITA KIKO" : "MISI KECILMU"}
            </span>
            <h1>{activity.instruction}</h1>
          </div>
          <button
            className="listen-button"
            onClick={() => speak(`${activity.instruction}. ${activity.scene}`)}
          >
            <Volume2 size={21} />
            Dengarkan
          </button>
        </div>
        <p className="scene">{activity.scene}</p>
        {notice && (
          <p className="audio-notice" role="status">
            {notice}
          </p>
        )}
        <Interaction
          key={activity.id}
          review={draft.feedback !== "none"}
          activity={activity}
          input={draft.input}
          disabled={!active || ["correct", "guided"].includes(draft.feedback)}
          onChange={(v) =>
            change((d) => ({ ...d, input: v, feedback: "none" }))
          }
        />
        {(hint || draft.feedback === "wrong") && (
          <div className="hint" role="status">
            <Lightbulb size={21} />
            <p>
              {draft.feedback === "wrong" && (
                <strong>Ayo coba cara lain. </strong>
              )}
              {activity.hint}
            </p>
          </div>
        )}
        {draft.feedback === "guided" && (
          <div className="guided" role="status">
            <h3>Kita coba bersama Kiko</h3>
            <p>{activity.hint}</p>
            <p>
              <strong>Contoh:</strong>{" "}
              {activity.interaction.kind === "count"
                ? `Ketuk ${activity.interaction.target} benda, satu per satu.`
                : solution(activity).join(" → ")}
            </p>
            <p>{activity.explanation}</p>
            <button
              className="primary"
              onClick={() => change((d) => acceptGuide(activity, d))}
            >
              Aku sudah mengikuti contoh
              <Check size={18} />
            </button>
          </div>
        )}
        {draft.feedback === "correct" && (
          <div className="feedback" role="status">
            <Check />
            <div>
              <strong>
                {draft.records[activity.id]?.guided
                  ? "Kamu sudah belajar bersama Kiko!"
                  : "Kamu teliti mencoba!"}
              </strong>
              <p>{activity.explanation}</p>
            </div>
          </div>
        )}
        <div className="activity-actions">
          <button
            className="help-button"
            disabled={
              !active ||
              draft.feedback === "correct" ||
              draft.feedback === "guided"
            }
            onClick={() => {
              setHint(true);
              change((d) => {
                const r = d.records[activity.id] ?? freshRecord();
                return {
                  ...d,
                  records: {
                    ...d.records,
                    [activity.id]: { ...r, help: r.help + 1 },
                  },
                };
              });
            }}
          >
            <Lightbulb size={19} />
            Bantuan
          </button>
          {draft.feedback === "correct" ? (
            <button className="primary" onClick={next}>
              {draft.index === 4 ? "Selesaikan misi" : "Lanjut"}
              <ArrowRight size={20} />
            </button>
          ) : (
            draft.feedback !== "guided" && (
              <button
                className="primary"
                disabled={
                  !active || draft.input.length === 0 || draft.input[0] === ""
                }
                onClick={() => change((d) => answer(activity, d))}
              >
                Periksa jawaban
                <Check size={20} />
              </button>
            )
          )}
        </div>
      </section>
      <div className="play-footer">
        <Kiko />
        <p>
          Tak perlu terburu-buru.
          <br />
          <strong>Kiko menemanimu belajar.</strong>
        </p>
        <button
          className="quiet-button"
          onClick={() => updateData((d) => ({ ...d, sound: !d.sound }))}
        >
          {data.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}{" "}
          {data.sound ? "Matikan suara" : "Nyalakan suara"}
        </button>
      </div>
      {!profile.tutorial && (
        <Modal title="Ketuk, coba, dan temukan!">
          <Kiko />
          <p>
            Ketuk benda atau jawaban pilihanmu, lalu tekan{" "}
            <strong>Periksa jawaban</strong>. Untuk susunan, ketuk potongan
            sesuai urutan.
          </p>
          <p>
            Butuh teman berpikir? Tekan <strong>Bantuan</strong>. Tombol{" "}
            <strong>Dengarkan</strong> membacakan petunjuk bila suara tersedia.
          </p>
          <button
            className="primary"
            onClick={() => updateProfile(id, (p) => ({ ...p, tutorial: true }))}
          >
            Aku siap mencoba
            <Play size={18} />
          </button>
        </Modal>
      )}
      {paused && (
        <Modal title="Kiko ikut beristirahat" onClose={() => setPaused(false)}>
          <p>Waktu permainan dijeda. Tarik napas, regangkan tangan.</p>
          <button className="primary" onClick={() => setPaused(false)}>
            Lanjut bermain
            <Play size={18} />
          </button>
          <Link className="text-link" to="/session">
            Selesai & Istirahat
          </Link>
        </Modal>
      )}
      {exit && (
        <Modal title="Simpan perjalananmu?" onClose={() => setExit(false)}>
          <p>
            Jawaban dan langkahmu sudah dicatat. Kamu bisa melanjutkan misi ini
            dari peta.
          </p>
          <button className="primary" onClick={() => navigate("/map")}>
            Keluar ke peta
          </button>
          <button className="text-link" onClick={() => setExit(false)}>
            Tetap bermain
          </button>
        </Modal>
      )}
    </main>
  );
}
