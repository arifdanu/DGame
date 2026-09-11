import { useState } from "react";
import {
  Apple,
  Fish,
  Leaf,
  Shell,
  Star,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  X,
} from "lucide-react";
import type { Activity } from "../types";
import { move } from "../engine/game";
export function ObjectIcon({ name }: { name: string }) {
  const Icon =
    { apel: Apple, ikan: Fish, daun: Leaf, kerang: Shell, bintang: Star }[
      name
    ] ?? Star;
  return <Icon aria-hidden="true" strokeWidth={1.7} />;
}
export function Interaction({
  activity,
  input,
  onChange,
  disabled,
  review = false,
}: {
  activity: Activity;
  input: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
  review?: boolean;
}) {
  const [opened, setOpened] = useState<number[]>([]);
  const t = activity.interaction;
  switch (t.kind) {
    case "story":
    case "choice":
      return (
        <div className="choices">
          {t.options.map((option) => (
            <button
              disabled={disabled}
              className={`choice ${input[0] === option ? "selected" : ""}`}
              aria-pressed={input[0] === option}
              key={option}
              onClick={() => onChange([option])}
            >
              <span className="choice-dot" />
              {option}
            </button>
          ))}
          {t.kind === "story" && review && input[0] && (
            <div className="story-branch" role="status">
              <strong>Lanjutan cerita</strong>
              <p>{t.branches[input[0]]}</p>
            </div>
          )}
        </div>
      );
    case "order":
      return (
        <div className="order-game">
          <p className="quiet">
            Ketuk potongan sesuai urutan. Ketuk jawaban untuk mengembalikannya.
          </p>
          <div className="answer-slots" aria-label="Urutan jawaban">
            {t.answer.map((_, i) => (
              <button
                key={i}
                disabled={disabled || !input[i]}
                aria-label={
                  input[i] ? `Kembalikan ${input[i]}` : `Tempat ${i + 1}`
                }
                onClick={() => onChange(input.filter((__, n) => n !== i))}
              >
                {input[i] || <span>{i + 1}</span>}
              </button>
            ))}
          </div>
          <div className="word-pieces">
            {t.pieces.map((piece) => (
              <button
                disabled={disabled || input.includes(piece)}
                key={piece}
                onClick={() => onChange([...input, piece])}
              >
                {piece}
              </button>
            ))}
          </div>
        </div>
      );
    case "count":
      return (
        <div>
          <div className="count-field">
            {t.objects.map((name, i) => (
              <button
                key={i}
                className={`count-object ${input.includes(String(i)) ? "selected" : ""}`}
                aria-label={`${name} ${i + 1}`}
                aria-pressed={input.includes(String(i))}
                disabled={disabled}
                onClick={() =>
                  onChange(
                    input.includes(String(i))
                      ? input.filter((v) => v !== String(i))
                      : [...input, String(i)],
                  )
                }
              >
                <ObjectIcon name={name} />
                {input.includes(String(i)) && (
                  <small>{input.indexOf(String(i)) + 1}</small>
                )}
              </button>
            ))}
          </div>
          <p className="count-total" aria-live="polite">
            Sudah dipilih: <strong>{input.length}</strong>
          </p>
        </div>
      );
    case "number":
      return (
        <div>
          {t.groups ? (
            <div className="groups">
              {Array.from({ length: t.groups.count }, (_, i) => (
                <button
                  className="group"
                  key={i}
                  disabled={disabled}
                  aria-label={`Buka kelompok ${i + 1}`}
                  aria-expanded={opened.includes(i)}
                  onClick={() => setOpened([...new Set([...opened, i])])}
                >
                  <strong>Kelompok {i + 1}</strong>
                  <span>
                    {opened.includes(i)
                      ? Array.from({ length: t.groups!.size }, (_, n) => (
                          <ObjectIcon key={n} name={t.groups!.object} />
                        ))
                      : "Ketuk untuk melihat"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="number-display">{t.display}</div>
          )}
          <output className="number-answer" aria-label="Jawaban angka">
            {input[0] || "?"}
          </output>
          <div className="keypad">
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "Hapus",
              "0",
              "Bersihkan",
            ].map((key) => (
              <button
                key={key}
                aria-label={key === "Hapus" ? "Hapus angka terakhir" : key}
                disabled={disabled}
                onClick={() =>
                  onChange([
                    key === "Hapus"
                      ? (input[0] ?? "").slice(0, -1)
                      : key === "Bersihkan"
                        ? ""
                        : ((input[0] ?? "") + key).slice(0, 6),
                  ])
                }
              >
                {key === "Hapus" ? (
                  <ArrowLeft />
                ) : key === "Bersihkan" ? (
                  <X />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </div>
      );
    case "grid": {
      const pos = input.reduce(
        (p, d) => move(p, d, t.size, t.blocked),
        t.start,
      );
      return (
        <div className="grid-game">
          <div
            className="path-grid"
            role="img"
            aria-label={`Kiko baris ${Math.floor(pos / t.size) + 1} kolom ${(pos % t.size) + 1}. Tujuan baris ${Math.floor(t.goal / t.size) + 1} kolom ${(t.goal % t.size) + 1}. Batu di ${t.blocked.map((b) => `baris ${Math.floor(b / t.size) + 1} kolom ${(b % t.size) + 1}`).join(", ")}.`}
          >
            {Array.from({ length: t.size * t.size }, (_, i) => (
              <div key={i} className={t.blocked.includes(i) ? "blocked" : ""}>
                {i === pos ? (
                  <img src="/assets/kiko.png" alt="Kiko" />
                ) : i === t.goal ? (
                  <Star aria-label="Tujuan" />
                ) : t.blocked.includes(i) ? (
                  <X aria-label="Batu" />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
          <div className="directions">
            {[
              { d: "atas", Icon: ArrowUp },
              { d: "kiri", Icon: ArrowLeft },
              { d: "bawah", Icon: ArrowDown },
              { d: "kanan", Icon: ArrowRight },
            ].map(({ d, Icon }) => (
              <button
                key={d}
                disabled={disabled || input.length >= 100}
                aria-label={`Jalan ${d}`}
                onClick={() => onChange([...input, d])}
              >
                <Icon />
              </button>
            ))}
            <button
              aria-label="Ulangi jalur"
              disabled={disabled}
              onClick={() => onChange([])}
            >
              <RotateCcw />
            </button>
          </div>
          <p className="quiet">
            × adalah batu. Bintang adalah tujuan. Gunakan tombol arah.
          </p>
        </div>
      );
    }
  }
}
