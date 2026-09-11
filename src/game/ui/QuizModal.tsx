import { useState } from "react";
import { ArrowRight, RotateCcw, Star } from "lucide-react";
import type { Quiz } from "../data/types";
import { Modal } from "./Modal";
import { sound } from "../utils/audio";
export function QuizModal({
  quiz,
  onComplete,
  onClose,
}: {
  quiz: Quiz;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<"none" | "wrong" | "correct">(
      "none",
    ),
    [selected, setSelected] = useState<number[]>([]);
  function check(answer: string) {
    setFeedback(answer === quiz.answer ? "correct" : "wrong");
    sound(answer === quiz.answer ? "win" : "click");
  }
  return (
    <Modal title={quiz.title} className="quiz-modal" onClose={onClose}>
      <div className="quiz-art" aria-hidden="true">
        {quiz.illustration}
      </div>
      <h3>{quiz.prompt}</h3>
      {quiz.order && (
        <div
          className="word-slots"
          aria-label={`Susunan: ${selected.map((i) => quiz.options[i]).join("") || "kosong"}`}
        >
          {Array.from({ length: quiz.options.length }, (_, i) => (
            <span key={i}>
              {selected[i] === undefined ? "·" : quiz.options[selected[i]]}
            </span>
          ))}
        </div>
      )}
      <div className={`quiz-options ${quiz.order ? "letter-options" : ""}`}>
        {quiz.options.map((option, i) => (
          <button
            key={i}
            className="k-button"
            disabled={
              feedback !== "none" || (quiz.order && selected.includes(i))
            }
            onClick={() => {
              if (quiz.order) {
                const next = [...selected, i];
                setSelected(next);
                if (next.length === quiz.options.length)
                  check(next.map((n) => quiz.options[n]).join(""));
              } else check(option);
            }}
          >
            {!quiz.order && (
              <span className="option-index">
                {String.fromCharCode(65 + i)}
              </span>
            )}
            {option}
          </button>
        ))}
      </div>
      {quiz.order && feedback === "none" && selected.length > 0 && (
        <button className="k-text-button" onClick={() => setSelected([])}>
          <RotateCcw size={17} /> Susun ulang
        </button>
      )}
      {feedback !== "none" && (
        <div className={`quiz-feedback ${feedback}`} role="status">
          <strong>
            {feedback === "correct"
              ? "Hebat, kamu menemukannya!"
              : "Belum tepat. Yuk, pelajari bersama."}
          </strong>
          <p>{quiz.explanation}</p>
          {feedback === "correct" ? (
            <button className="k-button primary" onClick={onComplete}>
              <Star size={19} /> Ambil hadiah <ArrowRight size={19} />
            </button>
          ) : (
            <button
              className="k-button secondary"
              onClick={() => {
                setFeedback("none");
                setSelected([]);
              }}
            >
              <RotateCcw size={18} /> Coba lagi
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
