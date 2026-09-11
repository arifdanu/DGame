import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Flag, Leaf, Timer } from "lucide-react";
import { OFFLINE } from "../content/levels";
import { Kiko, names } from "../components/Common";
import { useProfile } from "../hooks/useProfile";
import { updateProfile } from "../storage/store";
export function SessionPage() {
  const { id, profile } = useProfile(),
    navigate = useNavigate();
  useEffect(() => {
    if (id)
      updateProfile(id, (p) => ({
        ...p,
        session: p.session ? { ...p.session, ended: true } : null,
      }));
  }, [id]);
  if (!id || !profile) return <Navigate to="/" replace />;
  return (
    <main className="narrow center session-page">
      <Kiko />
      <span className="eyebrow">PERJALANAN HARI INI</span>
      <h1>
        Terima kasih sudah mencoba,
        <br />
        {names[id]}!
      </h1>
      <p>
        Mercusuar tumbuh terang dari langkah-langkah kecilmu. Sekarang, ayo
        menjelajah dunia di luar layar.
      </p>
      <div className="result-facts">
        <span>
          <Timer />
          <strong>
            {Math.ceil((profile.session?.durationMs ?? 0) / 60000)} menit
          </strong>
          bermain dalam sesi ini
        </span>
        <span>
          <Flag />
          <strong>{profile.session?.completed.length ?? 0} misi</strong>selesai
          dalam sesi ini
        </span>
      </div>
      <button
        className="primary"
        onClick={() => {
          updateProfile(id, (p) => ({ ...p, session: null }));
          navigate("/rest", { replace: true });
        }}
      >
        Selesai & Istirahat
        <Leaf size={20} />
      </button>
      <p className="quiet">Tidak perlu menyelesaikan semuanya hari ini.</p>
    </main>
  );
}
export function RestPage() {
  return (
    <main className="rest-page">
      <div className="center page-intro">
        <span className="eyebrow">PETUALANGAN TANPA LAYAR</span>
        <h1>Dunia nyata juga seru.</h1>
        <p>
          Pilih satu ide bersama pendamping. Setelah itu, tutup layar dan mulai!
        </p>
      </div>
      <div className="offline-grid">
        {OFFLINE.map(([title, description], i) => (
          <article className="offline-card" key={title}>
            <span className="offline-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <p className="center quiet">
        Aktivitas ini tidak menambah jatah waktu layar.
      </p>
      <Link className="back-link" to="/">
        Kembali ke pilihan penjelajah nanti
      </Link>
    </main>
  );
}
