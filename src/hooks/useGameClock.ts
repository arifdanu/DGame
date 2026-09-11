import { useEffect, useState } from "react";
import type { ProfileId, IslandId } from "../types";
import { charge, ActiveClock } from "../engine/timer";
import { updateProfile } from "../storage/store";
export function useGameClock(id: ProfileId, active: boolean, island: IslandId) {
  useEffect(() => {
    const clock = new ActiveClock((start, end) =>
      updateProfile(id, (p) => charge(p, start, end, island)),
    );
    const change = () =>
      clock.setActive(
        active && document.visibilityState === "visible",
        Date.now(),
      );
    const hide = () => clock.setActive(false, Date.now());
    change();
    const timer = window.setInterval(() => clock.flush(Date.now()), 1000);
    document.addEventListener("visibilitychange", change);
    window.addEventListener("pagehide", hide);
    return () => {
      hide();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", change);
      window.removeEventListener("pagehide", hide);
    };
  }, [id, active, island]);
}
export function useProfileLock(id: ProfileId) {
  const [status, setStatus] = useState<
    "waiting" | "owned" | "busy" | "unsupported"
  >("waiting");
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    setStatus("waiting");
    if (!navigator.locks) {
      setStatus("unsupported");
      return;
    }
    void navigator.locks
      .request(
        `pulau-pintar:play:${id}`,
        { ifAvailable: true },
        async (lock) => {
          if (disposed) return;
          if (!lock) {
            setStatus("busy");
            return;
          }
          setStatus("owned");
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        },
      )
      .catch(() => {
        if (!disposed) setStatus("unsupported");
      });
    return () => {
      disposed = true;
      release?.();
    };
  }, [id]);
  return status;
}
