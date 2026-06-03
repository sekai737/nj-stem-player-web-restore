import { useCallback } from "react";
import { FIGMA } from "../../figma/layout";
import { getMeterVisualTokens } from "../../meters/meterVisualThemes";
import {
  drawSpectrogram,
  drawSpectrum,
  drawStereo,
  drawWaveform,
} from "../../meters/drawMeters";
import { getMeterSnapshot } from "../../meters/meterStore";
import { useMeterVisualThemeStore } from "../../store/meterVisualThemeStore";
import MeterCanvas from "./MeterCanvas";
import MetersLabel from "./MetersLabel";
import MeterThemePicker from "./MeterThemePicker";
import "./meter-panel.css";

interface MeterPanelProps {
  className?: string;
}

const P = FIGMA.meters.plotsInset;

export default function MeterPanel({ className = "" }: MeterPanelProps) {
  const visualThemeId = useMeterVisualThemeStore((s) => s.visualThemeId);
  const meterTokens = getMeterVisualTokens(visualThemeId);

  const drawSpec = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => {
      drawSpectrogram(ctx, w, h, getMeterSnapshot(), 3, meterTokens, dpr);
    },
    [meterTokens],
  );

  const drawSpecLine = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawSpectrum(ctx, w, h, getMeterSnapshot(), meterTokens);
    },
    [meterTokens],
  );

  const drawScope = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawStereo(ctx, w, h, getMeterSnapshot(), meterTokens);
    },
    [meterTokens],
  );

  const drawWave = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawWaveform(ctx, w, h, getMeterSnapshot(), meterTokens);
    },
    [meterTokens],
  );

  return (
    <aside
      className={`meter-panel figma-surface absolute left-0 top-0 overflow-hidden rounded-cr ${className}`}
      style={{ width: FIGMA.meters.width, height: FIGMA.meters.height }}
      aria-label="Meters"
    >
      <MetersLabel />

      <MeterThemePicker />

      <div
        className="absolute flex flex-col"
        style={{
          left: P.x,
          right: P.x,
          top: P.top,
          bottom: P.bottom,
          gap: P.gap,
        }}
      >
        <div className="meter-plot-slot flex-[1.35]">
          <MeterCanvas draw={drawSpec} />
        </div>
        <div className="meter-plot-slot flex-[1.05]">
          <MeterCanvas draw={drawSpecLine} />
        </div>
        <div className="meter-plot-slot flex-[1.05]">
          <MeterCanvas draw={drawScope} />
        </div>
        <div className="meter-plot-slot flex-[1.2]">
          <MeterCanvas draw={drawWave} />
        </div>
      </div>
    </aside>
  );
}
