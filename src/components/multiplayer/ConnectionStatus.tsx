import type { ConnectionState } from "../../multiplayer/types";
const LABELS: Record<ConnectionState, string> = {
  idle: "Siap menjelajah",
  connecting: "Menghubungkan",
  connected: "Terhubung",
  disconnected: "Terputus",
  full: "Room penuh",
  "not-found": "Room tidak ditemukan",
  closed: "Room ditutup",
  unconfigured: "Belum dikonfigurasi",
  error: "Belum dapat terhubung",
};
export function ConnectionStatus({ status }: { status: ConnectionState }) {
  return (
    <span role="status" className={`mp-connection ${status}`}>
      <i />
      {LABELS[status]}
    </span>
  );
}
