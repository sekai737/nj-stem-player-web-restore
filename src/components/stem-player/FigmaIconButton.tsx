import { Link } from "react-router-dom";
import { FIGMA } from "../../figma/layout";

interface FigmaIconButtonProps {
  label: string;
  src: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Figma icon frame size (header 44px, transport song nav 40px). */
  size?: number;
  "data-node-id"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "dialog" | "menu" | "listbox" | "tree" | "grid";
}

const interactiveClass =
  "inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 leading-none";

export default function FigmaIconButton({
  label,
  src,
  to,
  onClick,
  disabled = false,
  size = FIGMA.header.icon,
  "data-node-id": nodeId,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHaspopup,
}: FigmaIconButtonProps) {
  const icon = (
    <span className="figma-header-icon" style={{ width: size, height: size }}>
      <img src={src} alt="" width={size} height={size} draggable={false} />
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={interactiveClass} aria-label={label} data-node-id={nodeId}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${interactiveClass} disabled:cursor-not-allowed disabled:opacity-40`}
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      data-node-id={nodeId}
    >
      {icon}
    </button>
  );
}
