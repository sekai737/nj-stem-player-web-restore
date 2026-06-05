import type { CSSProperties } from "react";
import "./slider-knob.css";

interface SliderKnobProps {
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** Figma slider knob — white circle, 2px black stroke (replaces slider-knob.svg). */
export default function SliderKnob({ size, className = "", style }: SliderKnobProps) {
  return (
    <span
      className={`slider-knob ${className}`.trim()}
      aria-hidden
      style={{ width: size, height: size, ...style }}
    />
  );
}
