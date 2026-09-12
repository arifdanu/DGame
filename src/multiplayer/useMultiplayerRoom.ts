import { useEffect, useState, useSyncExternalStore } from "react";
import { MultiplayerService } from "./multiplayerService";
export function useMultiplayerRoom() {
  const [service] = useState(() => new MultiplayerService());
  const state = useSyncExternalStore(service.subscribe, service.getSnapshot);
  useEffect(() => {
    const exit = () => {
      void service.leave();
    };
    window.addEventListener("pagehide", exit);
    return () => {
      window.removeEventListener("pagehide", exit);
      void service.leave();
    };
  }, [service]);
  return { state, service };
}
