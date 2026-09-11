import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Kiko, avatarNames, names } from "../components/Common";
import { useStore } from "../hooks/useStore";
import { updateData, updateProfile } from "../storage/store";
import type { ProfileId } from "../types";
export function Profiles() {
  const { data } = useStore(),
    navigate = useNavigate();
  return (
    <main className="profiles-page">
      <div className="page-intro center">
        <span className="eyebrow">PETUALANGAN PULAU PINTAR</span>
        <h1>Siapa yang berlayar hari ini?</h1>
        <p>Kiko sudah menunggu. Pilih teman berpetualangmu!</p>
      </div>
      <div className="profile-list">
        {(["delisha", "dinar"] as ProfileId[]).map((id) => (
          <section className={`profile-card ${id}`} key={id}>
            <div className="portrait">
              <Kiko avatar={data.profiles[id].avatar} />
              <Sparkles className="portrait-spark" />
            </div>
            <h2>{names[id]}</h2>
            <p>
              {id === "delisha"
                ? "5 tahun · Penjelajah kecil"
                : "7 tahun · Penjelajah berani"}
            </p>
            <fieldset className="avatar-picker">
              <legend>Pilih Kiko favoritmu</legend>
              {avatarNames.map((name, i) => (
                <button
                  key={name}
                  className={`avatar-swatch avatar-${i}`}
                  aria-label={`${name} untuk ${names[id]}`}
                  aria-pressed={data.profiles[id].avatar === i}
                  onClick={() =>
                    updateProfile(id, (p) => ({ ...p, avatar: i }))
                  }
                >
                  <span>{i + 1}</span>
                </button>
              ))}
            </fieldset>
            <button
              className="primary"
              onClick={() => {
                updateData((d) => ({ ...d, selected: id }));
                try {
                  sessionStorage.setItem("pulau:selected", id);
                } catch {
                  /* Selection remains in app storage. */
                }
                navigate("/map");
              }}
            >
              Main sebagai {names[id]}
              <ArrowRight size={20} />
            </button>
          </section>
        ))}
      </div>
      <p className="center quiet">
        Belajar bersama. Bertumbuh dengan cara masing-masing.
      </p>
    </main>
  );
}
