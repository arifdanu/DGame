import { useState } from "react";
export function RoomCode({ code }: { code: string }) {
  const [message, setMessage] = useState("");
  return (
    <div className="mp-code">
      <span>KODE ROOM</span>
      <strong data-testid="room-code">{code}</strong>
      <button
        className="k-button secondary"
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(
            () =>
              setMessage(
                "Kode disalin. Bagikan hanya kepada teman yang dikenal.",
              ),
            () => setMessage("Salin enam karakter kode di atas."),
          );
          if (!navigator.clipboard)
            setMessage("Salin enam karakter kode di atas.");
        }}
      >
        Salin kode
      </button>
      <small role="status">
        {message || "Bagikan hanya kepada teman yang dikenal."}
      </small>
    </div>
  );
}
