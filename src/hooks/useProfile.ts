import { useStore } from "./useStore";
import type { ProfileId } from "../types";
export function useProfile() {
  const store = useStore();
  let id = store.data.selected;
  try {
    const selected = sessionStorage.getItem("pulau:selected");
    if (selected === "dinar" || selected === "delisha") id = selected;
  } catch {
    /* Use the persisted selection. */
  }
  return {
    ...store,
    id: id as ProfileId | null,
    profile: id ? store.data.profiles[id] : null,
  };
}
