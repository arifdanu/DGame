import { useState } from "react";
import type { FormEvent } from "react";
export function PinForm({
  label,
  onSubmit,
  create = false,
  disabled = false,
}: {
  label: string;
  onSubmit: (pin: string) => Promise<void>;
  create?: boolean;
  disabled?: boolean;
}) {
  const [pin, setPin] = useState(""),
    [repeat, setRepeat] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || disabled) return;
    if (!/^\d{6}$/.test(pin)) {
      setError("Masukkan tepat enam digit.");
      return;
    }
    if (create && pin !== repeat) {
      setError("Kedua PIN belum sama. Coba periksa kembali.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(pin);
      setPin("");
      setRepeat("");
    } catch {
      setError(
        "PIN belum dapat diproses. Gunakan browser modern melalui localhost atau HTTPS.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="pin-form" onSubmit={(e) => void submit(e)}>
      <label>
        {create ? "Buat PIN enam digit" : "PIN enam digit"}
        <input
          aria-label={create ? "Buat PIN enam digit" : "PIN enam digit"}
          autoComplete={create ? "new-password" : "current-password"}
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
      </label>
      {create && (
        <label>
          Ulangi PIN
          <input
            aria-label="Ulangi PIN"
            autoComplete="new-password"
            type="password"
            inputMode="numeric"
            maxLength={6}
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value.replace(/\D/g, ""))}
          />
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <button className="primary" disabled={busy || disabled} type="submit">
        {busy ? "Sebentar…" : label}
      </button>
    </form>
  );
}
