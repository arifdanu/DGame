import Adventure, { type AdventureRoom } from "../../game/Adventure";
/** Same mission UI, controls and local save path as solo; only pose enters Realtime. */
export function MultiplayerGame(props: AdventureRoom) {
  return <Adventure roomSession={props} />;
}
