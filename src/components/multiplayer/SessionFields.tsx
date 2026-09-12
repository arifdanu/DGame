import type { SessionOptions } from "../../multiplayer/types";
import { NICKNAMES } from "../../multiplayer/roomCode";
import { AVATARS } from "../../game/data/world";
export function SessionFields({
  value,
  change,
}: {
  value: SessionOptions;
  change: (next: SessionOptions) => void;
}) {
  return (
    <>
      <label className="mp-field">
        Nama panggilan rekaan
        <select
          value={value.nickname}
          onChange={(e) => change({ ...value, nickname: e.target.value })}
        >
          {NICKNAMES.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <small>Pilih nama rekaan untuk sesi ini. Tidak perlu nama asli.</small>
      </label>
      <fieldset className="mp-avatar-picker">
        <legend>Pilih avatar</legend>
        {AVATARS.map((avatar, i) => (
          <label
            key={i}
            style={{
              borderColor:
                value.avatarId === String(i) ? avatar.color : undefined,
            }}
          >
            <input
              type="radio"
              name="mp-avatar"
              value={i}
              checked={value.avatarId === String(i)}
              onChange={() =>
                change({
                  ...value,
                  avatarId: String(i) as SessionOptions["avatarId"],
                })
              }
            />
            <span>{["🧭", "🔬", "🌿"][i]}</span>
            {avatar.name}
          </label>
        ))}
      </fieldset>
      <label className="mp-field">
        Profil permainan
        <select
          value={value.profileId}
          onChange={(e) =>
            change({
              ...value,
              profileId: e.target.value as SessionOptions["profileId"],
            })
          }
        >
          <option value="dinar">Mode Dinar</option>
          <option value="delisha">Mode Delisha</option>
        </select>
        <small>
          Progres pemain tunggal tetap tersimpan seperti sebelumnya.
        </small>
      </label>
    </>
  );
}
