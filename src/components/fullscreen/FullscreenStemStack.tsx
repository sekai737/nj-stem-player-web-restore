import type { CSSProperties, MouseEvent } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";
import { fullscreenMuteIconSvg, fullscreenSoloIconSvg } from "../../figma/stemAssets";
import type { StemId } from "../../types";
import { usePlayerStore } from "../../store/playerStore";
import "./fullscreen-stem-stack.css";

const S = FS.stemStack;

const STEMS: {
  id: StemId;
  icon: string;
  radius: number;
  nodeId: string;
  labelsNodeId: string;
  soloNodeId: string;
  muteNodeId: string;
}[] = [
  {
    id: "vocals",
    icon: figmaAssets.vocalIcon,
    radius: S.radiusLead,
    nodeId: "121:435",
    labelsNodeId: "121:437",
    soloNodeId: "121:438",
    muteNodeId: "121:439",
  },
  {
    id: "instruments",
    icon: figmaAssets.otherIcon,
    radius: S.radiusRest,
    nodeId: "121:440",
    labelsNodeId: "121:442",
    soloNodeId: "121:443",
    muteNodeId: "121:444",
  },
  {
    id: "drums",
    icon: figmaAssets.drumsIcon,
    radius: S.radiusRest,
    nodeId: "121:450",
    labelsNodeId: "121:452",
    soloNodeId: "121:453",
    muteNodeId: "121:454",
  },
  {
    id: "bass",
    icon: figmaAssets.bassIcon,
    radius: S.radiusRest,
    nodeId: "121:445",
    labelsNodeId: "121:447",
    soloNodeId: "121:448",
    muteNodeId: "121:449",
  },
];

function SoloMuteButton({
  kind,
  active,
  nodeId,
  onClick,
}: {
  kind: "solo" | "mute";
  active: boolean;
  nodeId: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const isSolo = kind === "solo";
  const icon = isSolo
    ? active
      ? fullscreenSoloIconSvg.clicked
      : fullscreenSoloIconSvg.default
    : active
      ? fullscreenMuteIconSvg.clicked
      : fullscreenMuteIconSvg.default;

  return (
    <button
      type="button"
      className={`fs-stem-btn__sm ${isSolo ? "fs-stem-btn__sm--solo" : "fs-stem-btn__sm--mute"}${active ? " fs-stem-btn__sm--on" : ""}`}
      aria-label={isSolo ? "Solo" : "Mute"}
      aria-pressed={active}
      onClick={onClick}
      data-node-id={nodeId}
    >
      <img src={icon.src} alt="" width={icon.width} height={icon.height} draggable={false} />
    </button>
  );
}

export default function FullscreenStemStack() {
  const channels = usePlayerStore((s) => s.channels);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleSolo = usePlayerStore((s) => s.toggleSolo);

  const stemVars = {
    "--fs-stem-design-w": `${S.designWidth}px`,
    "--fs-stem-design-h": `${S.designHeight}px`,
    "--fs-stem-offset-x-design": `${S.offsetX}px`,
    "--fs-stem-offset-top": `${S.offsetTop}px`,
    "--fs-stem-gap": `${S.gap}px`,
    "--fs-stem-btn-width": `${S.buttonWidth}px`,
    "--fs-stem-btn-height": `${S.buttonHeight}px`,
    "--fs-stem-padding-x": `${S.paddingX}px`,
    "--fs-stem-padding-y": `${S.paddingY}px`,
    "--fs-stem-icon-gap": `${S.iconGap}px`,
    "--fs-stem-icon-size": `${S.iconSize}px`,
    "--fs-stem-labels-width": `${S.labelsWidth}px`,
    "--fs-stem-solo-width": `${S.soloWidth}px`,
    "--fs-stem-mute-width": `${S.muteWidth}px`,
    "--fs-stem-solo-mute-height": `${S.soloMuteHeight}px`,
    "--fs-stem-solo-mute-gap": `${S.soloMuteGap}px`,
  } as CSSProperties;

  return (
    <div className="fs-stem-stack" style={stemVars} data-node-id="121:434">
      <div className="fs-stem-stack__scale">
        {STEMS.map((stem) => {
          const ch = channels[stem.id];
          return (
            <div
              key={stem.id}
              className="fs-stem-btn"
              style={{ borderRadius: stem.radius }}
              data-node-id={stem.nodeId}
            >
              <img
                src={stem.icon}
                alt=""
                className="fs-stem-btn__icon"
                width={S.iconSize}
                height={S.iconSize}
                draggable={false}
              />
              <div className="fs-stem-btn__labels" data-node-id={stem.labelsNodeId}>
                <SoloMuteButton
                  kind="solo"
                  active={ch.solo}
                  nodeId={stem.soloNodeId}
                  onClick={(e) => toggleSolo(stem.id, e.shiftKey)}
                />
                <SoloMuteButton
                  kind="mute"
                  active={ch.muted && !ch.solo}
                  nodeId={stem.muteNodeId}
                  onClick={() => toggleMute(stem.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
