import type { ReactNode } from "react";
import { FIGMA } from "../../figma/layout";
import "./fixed-page-nav.css";

interface FixedPageNavProps {
  children: ReactNode;
  hidden?: boolean;
  side?: "left" | "right";
}

/**
 * Header icons pinned to the viewport at Figma inset (60×56).
 * Lives outside scaled frames so controls never drift between pages.
 */
export default function FixedPageNav({
  children,
  hidden = false,
  side = "left",
}: FixedPageNavProps) {
  const inset = FIGMA.inset.x;

  return (
    <nav
      className={`page-fixed-nav${hidden ? " page-fixed-nav--hidden" : ""}`}
      style={{
        ...(side === "left" ? { left: inset } : { right: inset }),
        top: FIGMA.inset.y,
        gap: FIGMA.header.fixedNavIconGap,
        height: FIGMA.header.fixedNavIcon,
      }}
      aria-label={side === "left" ? "Page navigation" : "Page actions"}
    >
      {children}
    </nav>
  );
}
