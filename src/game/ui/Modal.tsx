import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`k-modal ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }}
    >
      <div className="modal-heading">
        <span className="k-eyebrow">PETUALANGAN KRAKATAU PINTAR</span>
        {onClose && (
          <button className="k-icon" aria-label="Tutup" onClick={onClose}>
            <X size={22} />
          </button>
        )}
      </div>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
export interface Dialogue {
  name: string;
  pages: string[];
  action?: string;
  onDone?: () => void;
}
export function DialogPanel({
  dialogue,
  onClose,
}: {
  dialogue: Dialogue;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const last = page === dialogue.pages.length - 1;
  return (
    <Modal title={dialogue.name} className="npc-dialog" onClose={onClose}>
      <div className="dialog-person">🌻</div>
      <p aria-live="polite">{dialogue.pages[page]}</p>
      <button
        className="k-button primary"
        onClick={() => {
          if (!last) setPage((p) => p + 1);
          else {
            onClose();
            dialogue.onDone?.();
          }
        }}
      >
        {last ? dialogue.action || "Tutup" : "Lanjut"}
      </button>
    </Modal>
  );
}
