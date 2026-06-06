# Meters accuracy & `audio-analyzer-rs` integration

The meters section combines two layers of analysis:

## 1. Live metering (real-time, in-browser)

All on-screen meters are driven by the **actual playback signal** via the Web
Audio API (`AnalyserNode`s tapped off the post-limiter master in
`src/audio/meterBus.ts`). Nothing is faked or approximated for visual effect.

The stereometer / stereo-field math lives in
`src/meters/meterStore.ts` (`processMeterFrame`) and is computed from the real
left/right time-domain frames:

| Metric | Definition | Behaviour |
| --- | --- | --- |
| Phase correlation | Pearson coefficient of L,R | `+1` mono/in-phase · `0` decorrelated · `-1` anti-phase |
| Stereo width (display) | `RMS(side) / (RMS(mid) + RMS(side))` | `0` mono · `0.5` equal M/S energy · `1` anti-phase |
| Stereo width (ratio) | `RMS(side) / RMS(mid)` | matches `audio-analyzer-rs` (`stereo.rs`) |
| Balance | `(RMS_R - RMS_L) / (RMS_R + RMS_L)` | `-1` left · `0` centred · `+1` right |

The correlation meter (`drawStereo` in `src/meters/drawMeters.ts`) is a true
bipolar phase meter: in-phase fills toward the top, the centre line marks
fully-decorrelated, and **negative (out-of-phase) correlation is shown in red**
so phase cancellation reads correctly. The goniometer scope is sampled on an
even stride across each frame so it reflects the whole signal.

Validation expectations:

- **Mono** → correlation ≈ `+1`, width ≈ `0`, scope collapses to centre.
- **Narrow stereo** → high positive correlation, small width.
- **Wide stereo** → correlation toward `0`, larger width, scope spreads.
- **Out-of-phase** → correlation goes negative (red bar below centre).

## 2. Offline ground-truth (`audio-analyzer-rs`)

[`audio-analyzer-rs`](https://github.com/JuzzyDee/audio-analyzer-rs) is a
**pure-Rust, offline** analyzer (CLI / MCP server). It decodes audio files from
disk with Symphonia and computes research-grade stereo-field, dynamics, LUFS,
and spectral-band data.

### Limitation

It **cannot run in the app runtime**: there is no WASM build, and it reads
files from the local filesystem rather than a live Web Audio stream. It is
therefore integrated as a **preprocessing step**, not a live engine.

### Workflow

```bash
# 1. Build / install the analyzer (offline, one-time)
git clone https://github.com/JuzzyDee/audio-analyzer-rs.git
cd audio-analyzer-rs && cargo build --release

# 2. Generate analysis JSON for every song that uses real FLAC stems
AUDIO_ANALYZER_BIN=$(pwd)/target/release/cli \
  node scripts/analyze-stems.mjs
```

This writes `public/analysis/<releaseId>.json` (`scripts/analyze-stems.mjs`).
At runtime `src/hooks/useAudioAnalysis.ts` loads it and attaches the master
mix's measured stereo metrics to the meter store
(`setMeterStereoReference`). The stereometer then draws a dashed **reference
tick** at the validated correlation value next to the live reading.

If the JSON has not been generated, the app silently falls back to live-only
metering — the analyzer is never required for the app to run.
