import { lazy, Suspense } from "react";
const Adventure = lazy(() => import("./game/Adventure"));
import Classic from "./LegacyApp";
export default function App() {
  const classic = location.pathname.startsWith("/classic");
  if (/^\/(map|play|parent|session|rest)(\/|$)/.test(location.pathname)) {
    location.replace(`/classic${location.pathname}${location.search}`);
    return null;
  }
  if (classic) return <Classic />;
  return (
    <Suspense
      fallback={
        <div className="boot-screen">Menyiapkan pulau petualangan…</div>
      }
    >
      <Adventure />
    </Suspense>
  );
}
