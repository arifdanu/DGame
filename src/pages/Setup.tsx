import { useNavigate } from "react-router-dom";
import { ShieldCheck, Timer, Sparkles } from "lucide-react";
import { PinForm } from "../components/PinForm";
import { Kiko } from "../components/Common";
import { makePin } from "../engine/pin";
import { updateData } from "../storage/store";
export function Setup() {
  const navigate = useNavigate();
  return (
    <main className="setup-layout">
      <section className="welcome-art">
        <span className="eyebrow">SELAMAT DATANG, PENJELAJAH KECIL</span>
        <h1>
          Petualangan besar,
          <br />
          <em>langkah kecil.</em>
        </h1>
        <img
          className="setup-map"
          src="/assets/islands.png"
          alt="Empat pulau dan mercusuar persahabatan"
        />
        <div className="kiko-greeting">
          <Kiko />
          <p>
            Hai! Aku Kiko.
            <br />
            Ayo nyalakan mercusuar persahabatan!
          </p>
        </div>
      </section>
      <section className="setup-form">
        <span className="pill">
          <ShieldCheck size={16} /> KHUSUS ORANG TUA
        </span>
        <h2>Sebelum berlayar…</h2>
        <p>
          Siapkan ruang bermain untuk Dinar dan Delisha. Setelah ini,
          petualangan mereka bisa dimulai.
        </p>
        <div className="setup-facts">
          <p>
            <Timer />
            15 menit per hari untuk setiap anak.
          </p>
          <p>
            <Sparkles />
            Satu sesi hingga 3 misi, lalu istirahat.
          </p>
        </div>
        <PinForm
          create
          label="Simpan & pilih penjelajah"
          onSubmit={async (pin) => {
            const derived = await makePin(pin);
            updateData((d) => ({ ...d, pin: derived }));
            navigate("/");
          }}
        />
        <p className="fineprint">
          PIN melindungi pengaturan di browser ini. Data tidak tersinkron. PIN
          dan batas waktu lokal dapat dilewati lewat penghapusan data atau
          manipulasi perangkat.
        </p>
      </section>
    </main>
  );
}
