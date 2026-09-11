import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PinForm } from "../components/PinForm";
import { Back, Modal, names } from "../components/Common";
import { useStore } from "../hooks/useStore";
import {
  blankProfile,
  getSnapshot,
  updateData,
  updateProfile,
} from "../storage/store";
import { checkPin, makePin } from "../engine/pin";
import { jakartaDay } from "../engine/timer";
import { stats } from "../engine/game";
import { ISLANDS } from "../content/levels";
import type { ProfileId } from "../types";
export function Parent() {
  const { data } = useStore(),
    [auth, setAuth] = useState<string | null>(null),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now()),
    [changePin, setChangePin] = useState(false),
    [deleting, setDeleting] = useState<ProfileId | null>(null),
    [confirmedPin, setConfirmedPin] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const lock = () => {
      if (document.visibilityState === "hidden") setAuth(null);
    };
    document.addEventListener("visibilitychange", lock);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", lock);
    };
  }, []);
  const authorized = auth !== null && auth === data.pin?.hash,
    cooldown = Math.max(
      0,
      Math.ceil(((data.pin?.cooldownUntil ?? 0) - now) / 1000),
    );
  async function verify(pin: string) {
    const current = getSnapshot().data.pin;
    if (!current) return false;
    const result = await checkPin(pin, current);
    updateData((d) => ({ ...d, pin: result.pin }));
    if (!result.ok) {
      setError(
        result.pin.cooldownUntil > Date.now()
          ? "Lima percobaan belum cocok. Tunggu 30 detik."
          : "PIN belum cocok. Coba kembali.",
      );
      return false;
    }
    setError("");
    return true;
  }
  if (!authorized)
    return (
      <main className="narrow parent-gate">
        <Back to="/">Pilihan penjelajah</Back>
        <ShieldCheck className="gate-icon" />
        <span className="eyebrow">KHUSUS ORANG TUA</span>
        <h1>Ruang Orang Tua</h1>
        <p>Masukkan PIN untuk melihat progres dan mengatur waktu bermain.</p>
        <PinForm
          label="Buka panel"
          disabled={cooldown > 0}
          onSubmit={async (pin) => {
            if (await verify(pin)) setAuth(getSnapshot().data.pin!.hash);
          }}
        />
        {error && <p role="alert">{error}</p>}
        {cooldown > 0 && <p role="status">Coba lagi dalam {cooldown} detik.</p>}
        <p className="fineprint">
          Lupa PIN? Tidak ada PIN default atau pintu pintas. Lihat panduan
          penyimpanan lokal di README proyek.
        </p>
      </main>
    );
  return (
    <main className="parent-page">
      <Back to="/">Pilihan penjelajah</Back>
      <div className="parent-heading">
        <div>
          <span className="eyebrow">RUANG ORANG TUA</span>
          <h1>Temani langkah kecil mereka.</h1>
          <p>
            Catatan latihan membantu percakapan, bukan untuk membandingkan anak.
          </p>
        </div>
        <button className="secondary" onClick={() => setAuth(null)}>
          Kunci panel
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      <section className="parent-settings">
        <h2>Pengaturan bersama</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={data.sound}
            onChange={(e) =>
              updateData((d) => ({ ...d, sound: e.target.checked }))
            }
          />
          Suara instruksi (jika tersedia)
        </label>
        <button className="secondary" onClick={() => setChangePin(true)}>
          Ubah PIN
        </button>
      </section>
      {(["delisha", "dinar"] as ProfileId[]).map((id) => {
        const p = data.profiles[id],
          all = stats(p);
        return (
          <section className="parent-profile" key={id}>
            <div className="parent-heading">
              <div>
                <h2>{names[id]}</h2>
                <p>
                  {p.badges.length} dari 12 level selesai · {all.completed}{" "}
                  aktivitas selesai
                </p>
              </div>
              <label>
                Batas harian
                <select
                  aria-label={`Batas harian ${names[id]}`}
                  value={p.limit}
                  onChange={(e) =>
                    updateProfile(id, (p) => ({
                      ...p,
                      limit: Number(e.target.value) as 10 | 15 | 20 | 30,
                    }))
                  }
                >
                  {[10, 15, 20, 30].map((n) => (
                    <option value={n} key={n}>
                      {n} menit
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="parent-metrics">
              <p>
                <strong>
                  {Math.ceil((p.usage[jakartaDay(Date.now())] ?? 0) / 60000)}{" "}
                  menit
                </strong>
                Hari ini · Asia/Jakarta
              </p>
              <p>
                <strong>
                  {Math.ceil(
                    Object.values(p.usage).reduce((n, v) => n + v, 0) / 60000,
                  )}{" "}
                  menit
                </strong>
                Total bermain
              </p>
              <p>
                <strong>
                  {all.accuracy === null ? "Belum ada" : `${all.accuracy}%`}
                </strong>
                Benar percobaan pertama
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <caption>Catatan latihan {names[id]} per kemampuan</caption>
                <thead>
                  <tr>
                    <th>Kemampuan</th>
                    <th>Durasi</th>
                    <th>Level selesai</th>
                    <th>Aktivitas selesai</th>
                    <th>Benar pertama</th>
                    <th>Total percobaan</th>
                    <th>Bantuan</th>
                    <th>Terbimbing</th>
                  </tr>
                </thead>
                <tbody>
                  {ISLANDS.map((i) => {
                    const s = stats(p, i.id);
                    return (
                      <tr key={i.id}>
                        <th scope="row">{i.short}</th>
                        <td data-label="Durasi">
                          {Math.ceil((p.skillMs?.[i.id] ?? 0) / 60000)} menit
                        </td>
                        <td data-label="Level selesai">
                          {
                            p.badges.filter((b) => b.includes(`-${i.id}-`))
                              .length
                          }
                          /3
                        </td>
                        <td data-label="Aktivitas selesai">{s.completed}</td>
                        <td data-label="Benar pertama">
                          {s.accuracy === null
                            ? "—"
                            : `${s.firstCorrect}/${s.completed} (${s.accuracy}%)`}
                        </td>
                        <td data-label="Total percobaan">{s.attempts}</td>
                        <td data-label="Bantuan">{s.help}</td>
                        <td data-label="Terbimbing">{s.guided}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              className="danger-link"
              onClick={() => {
                setDeleting(id);
                setConfirmedPin(false);
                setError("");
              }}
            >
              Hapus progres {names[id]}
            </button>
          </section>
        );
      })}
      <aside className="local-note">
        <h2>Tentang catatan di perangkat ini</h2>
        <p>
          Profil, progres, sesi, durasi, dan PIN bersalt disimpan hanya di
          browser ini. Data tidak tersinkron antarperangkat. PIN dan batas waktu
          lokal bukan keamanan kuat: penghapusan data browser, manipulasi
          perangkat, atau perangkat lain dapat melewatinya.
        </p>
        <p>
          Akurasi = jawaban benar pada percobaan pertama ÷ aktivitas selesai.
          Aktivitas terbimbing tetap masuk jumlah selesai, tetapi tidak dianggap
          benar mandiri. Bantuan mencatat ketukan tombol bantuan. Pengulangan
          level mempertahankan hasil penyelesaian pertama dan tidak menggandakan
          lencana.
        </p>
        <p>
          Materi merupakan latihan umum, tanpa klaim peningkatan IQ, diagnosis,
          atau keselarasan resmi dengan kurikulum.
        </p>
      </aside>
      {changePin && (
        <Modal title="Ubah PIN" onClose={() => setChangePin(false)}>
          <PinForm
            create
            label="Simpan PIN baru"
            onSubmit={async (pin) => {
              const next = await makePin(pin);
              updateData((d) => ({ ...d, pin: next }));
              setAuth(next.hash);
              setChangePin(false);
              setNotice("PIN baru tersimpan.");
            }}
          />
          <button className="text-link" onClick={() => setChangePin(false)}>
            Batal
          </button>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Hapus progres ${names[deleting]}?`}
          onClose={() => setDeleting(null)}
        >
          {!confirmedPin ? (
            <>
              <p>Masukkan PIN sekali lagi sebelum konfirmasi penghapusan.</p>
              <PinForm
                label="Lanjut ke konfirmasi"
                disabled={cooldown > 0}
                onSubmit={async (pin) => {
                  if (await verify(pin)) setConfirmedPin(true);
                }}
              />
              {error && <p role="alert">{error}</p>}
              {cooldown > 0 && <p>Tunggu {cooldown} detik.</p>}
            </>
          ) : (
            <>
              <p>
                Konfirmasi kedua: seluruh lencana, hasil, dan langkah misi{" "}
                {names[deleting]} akan dihapus. Waktu bermain hari ini dan batas
                harian tetap berlaku.
              </p>
              <button
                className="danger"
                onClick={() => {
                  updateProfile(deleting, (p) => ({
                    ...blankProfile(),
                    avatar: p.avatar,
                    limit: p.limit,
                    usage: p.usage,
                    skillMs: p.skillMs,
                  }));
                  setDeleting(null);
                  setNotice(
                    "Progres telah dihapus. Catatan waktu tetap dipertahankan.",
                  );
                }}
              >
                Ya, hapus progres {names[deleting]}
              </button>
            </>
          )}
          <button className="text-link" onClick={() => setDeleting(null)}>
            Batal
          </button>
        </Modal>
      )}
    </main>
  );
}
