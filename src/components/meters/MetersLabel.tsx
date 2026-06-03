import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import "./meters-label.css";

const L = FIGMA.meters.label;

export default function MetersLabel() {
  return (
    <div
      className="meters-label"
      data-node-id="10:84"
      data-name="Meters label"
      style={{ left: L.left, top: L.top }}
      aria-hidden
    >
      <div className="meters-label__pill">
        <img
          className="meters-label__text"
          src={figmaAssets.meterText}
          alt=""
          width={44}
          height={17}
          draggable={false}
        />
      </div>
    </div>
  );
}
