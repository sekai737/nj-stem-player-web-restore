import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: "pink" | "ghost";
}

export default function IconButton({
  label,
  children,
  variant = "ghost",
  className = "",
  ...props
}: IconButtonProps) {
  const base =
    variant === "pink"
      ? "bg-nj-pink text-white shadow-md shadow-nj-pink/30 hover:bg-nj-pink-dark"
      : "bg-white/80 text-nj-ink ring-1 ring-black/10 hover:ring-nj-pink/40";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${base} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
