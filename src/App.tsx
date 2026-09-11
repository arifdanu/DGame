import { useWebTools } from "./hooks/useWebTools";
import { Component, useEffect } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Header } from "./components/Common";
import { Setup } from "./pages/Setup";
import { Profiles } from "./pages/Profiles";
import { MapPage } from "./pages/Map";
import { PlayRoute } from "./pages/Play";
import { Parent } from "./pages/Parent";
import { SessionPage, RestPage } from "./pages/Session";
import { useStore } from "./hooks/useStore";
import { stopSpeech } from "./hooks/useSpeech";
function Screen() {
  useWebTools();
  const { data, warning, blocked } = useStore(),
    location = useLocation();
  useEffect(() => {
    stopSpeech();
    window.scrollTo(0, 0);
    const el = document.querySelector("main h1") as HTMLElement | null;
    if (el) {
      el.tabIndex = -1;
      el.focus();
    }
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#content">
        Lewati ke isi
      </a>
      <Header />
      {warning && (
        <div className="storage-warning" role="alert">
          {warning}
        </div>
      )}
      <div id="content">
        {blocked ? (
          <main className="narrow">
            <h1>Data perlu diperiksa orang tua</h1>
            <p>
              Permainan dijeda agar data asli tidak tertimpa. Simpan salinan
              data browser dan ikuti panduan pemulihan di README.
            </p>
          </main>
        ) : !data.pin ? (
          <Setup />
        ) : (
          <Routes>
            <Route path="/" element={<Profiles />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/play/:levelId" element={<PlayRoute />} />
            <Route path="/parent" element={<Parent />} />
            <Route path="/session" element={<SessionPage />} />
            <Route path="/rest" element={<RestPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        )}
      </div>
      <footer className="site-footer">
        <span>Petualangan Pulau Pintar</span>
        <span>Langkah kecil. Penemuan besar.</span>
      </footer>
    </>
  );
}
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="narrow">
        <h1>Perjalanan terhenti sebentar</h1>
        <p>
          Data yang tersimpan tetap ada. Minta orang tua memuat ulang halaman.
        </p>
        <button onClick={() => location.reload()}>Muat ulang</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <Boundary>
      <BrowserRouter>
        <Screen />
      </BrowserRouter>
    </Boundary>
  );
}
