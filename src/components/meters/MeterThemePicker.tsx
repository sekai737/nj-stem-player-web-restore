import { useEffect, useId, useRef, useState } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import {
  METER_THEME_LABELS,
  METER_VISUAL_THEME_IDS,
  type MeterVisualThemeId,
} from "../../meters/meterVisualThemes";
import { useMeterVisualThemeStore } from "../../store/meterVisualThemeStore";

const P = FIGMA.meters.themePicker;

export default function MeterThemePicker() {
  const visualThemeId = useMeterVisualThemeStore((s) => s.visualThemeId);
  const setVisualThemeId = useMeterVisualThemeStore((s) => s.setVisualThemeId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (id: MeterVisualThemeId) => {
    setVisualThemeId(id);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="meter-theme-dropdown"
      style={{ left: P.left, top: P.top }}
    >
      <button
        type="button"
        className={`meter-theme-dropdown__trigger${open ? " meter-theme-dropdown__trigger--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Meter color theme: ${METER_THEME_LABELS[visualThemeId]}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="meter-theme-dropdown__icon-wrap" aria-hidden>
          <img
            src={figmaAssets.dropDown}
            alt=""
            width={P.icon}
            height={P.icon}
            className="meter-theme-dropdown__icon"
            draggable={false}
          />
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          className="meter-theme-dropdown__menu figma-surface"
          role="listbox"
          aria-label="Meter color theme"
        >
          {METER_VISUAL_THEME_IDS.map((id) => {
            const selected = visualThemeId === id;
            return (
              <li key={id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`meter-theme-dropdown__option${selected ? " meter-theme-dropdown__option--selected" : ""}`}
                  onClick={() => select(id)}
                >
                  {METER_THEME_LABELS[id]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
