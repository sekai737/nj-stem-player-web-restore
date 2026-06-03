import { usePlayerStore } from "../../store/playerStore";

export default function VolumeRail() {
  const volume = usePlayerStore((s) => s.masterVolume);
  const muted = usePlayerStore((s) => s.masterMuted);
  const setMasterVolume = usePlayerStore((s) => s.setMasterVolume);
  const toggleMasterMute = usePlayerStore((s) => s.toggleMasterMute);

  const pct = Math.round(volume * 100);

  return (
    <aside className="fs-volume-rail" aria-label="Volume">
      <span className="fs-volume-rail__pct">{muted ? "Muted" : `${pct}%`}</span>
      <div className="fs-volume-rail__slider-wrap">
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          className="fs-volume-rail__slider"
          aria-label="Master volume"
          onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
        />
      </div>
      <button
        type="button"
        className="fs-icon-btn fs-volume-rail__mute"
        onClick={toggleMasterMute}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔈"}
      </button>
    </aside>
  );
}
