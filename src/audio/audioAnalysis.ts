/**
 * Offline audio analysis produced by `audio-analyzer-rs`
 * (https://github.com/JuzzyDee/audio-analyzer-rs).
 *
 * `audio-analyzer-rs` is a **pure-Rust, offline** analyzer exposed as a CLI /
 * MCP server. It cannot run inside the browser runtime (no WASM build, decodes
 * files from disk via Symphonia), so it is integrated as a *preprocessing*
 * step: `scripts/analyze-stems.mjs` runs the analyzer over the FLAC stems +
 * master and writes the structured results to `public/analysis/<releaseId>.json`.
 *
 * The app loads that JSON at runtime and uses it as a **validated reference**
 * for the live meters (stereo field, dynamics, spectral balance, channel
 * balance). Live metering still runs on the real Web Audio signal — the
 * reference is never substituted for live movement, only displayed alongside
 * it. When no analysis file exists the app silently falls back to live-only.
 */

/** Stereo field metrics — mirrors `audio-analyzer-rs` `stereo.rs`. */
export interface StereoFieldAnalysis {
  /** Average phase correlation, -1 (anti-phase) … +1 (mono/in-phase). */
  correlationAvg: number;
  correlationMin: number;
  /** Side/Mid RMS ratio. ~0 mono, ~1 fully wide, > 1 very wide / anti-phase. */
  widthAvg: number;
  widthMax: number;
  /** L/R balance, -1 (left) … +1 (right). */
  balance: number;
  /** Mono-compatibility score, 0 … 1 (1 = fully mono-safe). */
  monoCompatibility?: number;
  /** Fraction of frames with negative correlation (phase warnings), 0 … 1. */
  phaseWarningRatio?: number;
}

/** Dynamic range / loudness — mirrors `temporal.rs` + EBU R128. */
export interface DynamicsAnalysis {
  peakDbfs?: number;
  crestFactorDb?: number;
  loudnessRangeDb?: number;
  integratedLufs?: number;
  truePeakDbtp?: number;
  loudnessRangeLu?: number;
}

/** RMS energy per standard producer band (matches the crate's 7 bands). */
export interface BandEnergyAnalysis {
  subBass?: number;
  bass?: number;
  lowMid?: number;
  mid?: number;
  upperMid?: number;
  presence?: number;
  brilliance?: number;
}

/** Per-file analysis result. */
export interface FileAnalysis {
  durationSec?: number;
  sampleRate?: number;
  stereo?: StereoFieldAnalysis;
  dynamics?: DynamicsAnalysis;
  bandEnergy?: BandEnergyAnalysis;
}

/** Full per-song analysis bundle written by the preprocessing script. */
export interface SongAnalysis {
  /** Tool + version that produced this file. */
  generator: string;
  releaseId: string;
  songId: string;
  /** The pre-mixed master mix (what the meters reference during full playback). */
  master?: FileAnalysis;
  /** Individual stems, keyed by stem id. */
  stems?: Record<string, FileAnalysis>;
}

const cache = new Map<string, SongAnalysis | null>();

/**
 * Load the offline analysis for a release's master/stems, if present.
 * Resolves to `null` (cached) when no analysis has been generated, so callers
 * can fall back to live-only metering without error noise.
 */
export async function loadSongAnalysis(
  releaseId: string,
  songId: string,
): Promise<SongAnalysis | null> {
  const key = `${releaseId}/${songId}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const res = await fetch(
      `/analysis/${encodeURIComponent(releaseId)}.json`,
      { cache: "force-cache" },
    );
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as
      | SongAnalysis
      | Record<string, SongAnalysis>;

    /** File may be a single song or a `{ songId: SongAnalysis }` map. */
    const resolved: SongAnalysis | null =
      "generator" in data
        ? (data as SongAnalysis)
        : ((data as Record<string, SongAnalysis>)[songId] ?? null);

    cache.set(key, resolved);
    return resolved;
  } catch {
    cache.set(key, null);
    return null;
  }
}
