import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, ShieldCheck } from "lucide-react";
export const names = { delisha: "Delisha", dinar: "Dinar" };
export const avatarNames = [
  "Kiko Pelaut",
  "Kiko Penjelajah",
  "Kiko Pemimpi",
  "Kiko Penjaga",
];
export function Kiko({
  className = "",
  avatar = 0,
}: {
  className?: string;
  avatar?: number;
}) {
  return (
    <img
      className={`kiko avatar-${avatar} ${className}`}
      src="/assets/kiko.png"
      alt="Kiko, kura-kura sahabatmu"
    />
  );
}
export function Header() {
  return (
    <header className="header">
      <Link to="/" className="brand">
        <Compass aria-hidden="true" />
        <span>
          petualangan
          <strong>
            Pulau Pintar<span className="brand-dot">.</span>
          </strong>
        </span>
      </Link>
      <Link className="parent-link" to="/parent">
        <ShieldCheck size={19} /> <span>Ruang Orang Tua</span>
      </Link>
    </header>
  );
}
export function Back({
  to = "/map",
  children = "Kembali ke peta",
}: {
  to?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={18} />
      {children}
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      aria-label={title}
    >
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="narrow center">
      <Kiko />
      <h1>{title}</h1>
      {children}
    </main>
  );
}
