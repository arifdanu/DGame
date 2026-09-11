import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../storage/store";
export const useStore = () => useSyncExternalStore(subscribe, getSnapshot);
