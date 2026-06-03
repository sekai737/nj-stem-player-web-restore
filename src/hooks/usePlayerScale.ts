import { useEffect, useState } from "react";
import { FIGMA } from "../figma/layout";

/** Scale 1800×956 content to fit viewport while preserving Figma proportions. */
export function usePlayerScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const padX = FIGMA.inset.x * 2;
      const padY = FIGMA.inset.y * 2;
      const frameWidth = Math.min(window.innerWidth, FIGMA.frame.width);
      const frameHeight = Math.min(window.innerHeight, FIGMA.frame.height);
      const sx = (frameWidth - padX) / FIGMA.content.width;
      const sy = (frameHeight - padY) / FIGMA.content.height;
      setScale(Math.min(1, sx, sy));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
