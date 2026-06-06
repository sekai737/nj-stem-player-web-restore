#!/usr/bin/env node
/**
 * Offline audio analysis preprocessing for the meters section.
 *
 * `audio-analyzer-rs` (https://github.com/JuzzyDee/audio-analyzer-rs) is a pure
 * Rust analyzer exposed as a CLI / MCP server. It decodes files from disk and
 * CANNOT run in the browser runtime, so accurate stereo-field / dynamics /
 * spectral / channel-balance data is produced here as a build-time step and
 * written to `public/analysis/<releaseId>.json`. The app loads that JSON and
 * uses it as a validated reference for the live (Web Audio) meters.
 *
 * Usage:
 *   AUDIO_ANALYZER_BIN=/path/to/cli node scripts/analyze-stems.mjs
 *
 * The binary must accept `<binary> <audioFile>` and print the analyzer's
 * text report to stdout (the `cli` binary from `cargo build --release`, or any
 * wrapper that does the same). If the binary is missing the script prints
 * install instructions and exits without touching existing analysis files.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");
const OUT_DIR = resolve(PUBLIC, "analysis");

const STEM_FILE_SEGMENT = {
  vocals: "vocals",
  instruments: "other",
  drums: "drums",
  bass: "bass",
  master: "master",
};

function findAnalyzerBin() {
  const candidates = [
    process.env.AUDIO_ANALYZER_BIN,
    "audio-analyzer-cli",
    "audio-analyzer",
    "cli",
  ].filter(Boolean);

  for (const bin of candidates) {
    const probe = spawnSync(bin, ["--help"], { encoding: "utf8" });
    if (!probe.error) return bin;
  }
  return null;
}

function num(match) {
  if (!match) return undefined;
  const v = Number.parseFloat(match[1]);
  return Number.isFinite(v) ? v : undefined;
}

/** Parse the analyzer's text report into a structured FileAnalysis object. */
function parseReport(text) {
  const file = {};

  const dur = text.match(/Duration:\s*([\d.]+)\s*sec/i);
  const sr = text.match(/Sample rate:\s*(\d+)\s*Hz/i);
  if (dur) file.durationSec = num(dur);
  if (sr) file.sampleRate = num(sr);

  const correlation = text.match(
    /Phase correlation:\s*(-?[\d.]+)\s*avg,\s*(-?[\d.]+)\s*min/i,
  );
  const width = text.match(
    /Stereo width:\s*(-?[\d.]+)\s*avg,\s*(-?[\d.]+)\s*max/i,
  );
  const balance = text.match(/Balance:\s*(-?[\d.]+)/i);
  const mono = text.match(/Mono compatibility:\s*(-?[\d.]+)\s*avg/i);
  const phaseWarn = text.match(/Phase warnings:\s*([\d.]+)%/i);

  if (correlation || width || balance) {
    file.stereo = {
      correlationAvg: num(correlation) ?? 0,
      correlationMin: correlation
        ? Number.parseFloat(correlation[2])
        : 0,
      widthAvg: num(width) ?? 0,
      widthMax: width ? Number.parseFloat(width[2]) : 0,
      balance: num(balance) ?? 0,
    };
    const monoVal = num(mono);
    if (monoVal !== undefined) file.stereo.monoCompatibility = monoVal;
    const pw = num(phaseWarn);
    if (pw !== undefined) file.stereo.phaseWarningRatio = pw / 100;
  }

  const peak = text.match(/Peak:\s*(-?[\d.]+)\s*dBFS/i);
  const crest = text.match(/Crest factor:\s*(-?[\d.]+)\s*dB/i);
  const integrated = text.match(/Integrated:\s*(-?[\d.]+)\s*LUFS/i);
  const truePeak = text.match(/True peak:\s*(-?[\d.]+)\s*dBTP/i);
  const lra = text.match(/Loudness range:\s*(-?[\d.]+)\s*LU\b/i);

  if (peak || crest || integrated || truePeak) {
    file.dynamics = {};
    if (num(peak) !== undefined) file.dynamics.peakDbfs = num(peak);
    if (num(crest) !== undefined) file.dynamics.crestFactorDb = num(crest);
    if (num(integrated) !== undefined)
      file.dynamics.integratedLufs = num(integrated);
    if (num(truePeak) !== undefined) file.dynamics.truePeakDbtp = num(truePeak);
    if (num(lra) !== undefined) file.dynamics.loudnessRangeLu = num(lra);
  }

  const bandSpecs = [
    ["subBass", /Sub bass\s*\([^)]*\):\s*([\d.]+)/i],
    ["bass", /\bBass\s*\([^)]*\):\s*([\d.]+)/i],
    ["lowMid", /Low-mid\s*\([^)]*\):\s*([\d.]+)/i],
    ["mid", /\bMid\s*\([^)]*\):\s*([\d.]+)/i],
    ["upperMid", /Upper-mid\s*\([^)]*\):\s*([\d.]+)/i],
    ["presence", /Presence\s*\([^)]*\):\s*([\d.]+)/i],
    ["brilliance", /Brilliance\s*\([^)]*\):\s*([\d.]+)/i],
  ];
  const bandEnergy = {};
  for (const [key, re] of bandSpecs) {
    const v = num(text.match(re));
    if (v !== undefined) bandEnergy[key] = v;
  }
  if (Object.keys(bandEnergy).length > 0) file.bandEnergy = bandEnergy;

  return file;
}

function analyzeFile(bin, absPath) {
  const res = spawnSync(bin, [absPath], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (res.error || res.status !== 0) {
    console.warn(`  ! analysis failed for ${absPath}: ${res.error ?? res.stderr}`);
    return null;
  }
  return parseReport(res.stdout ?? "");
}

function publicFilePath(releaseId, slug, segment) {
  return resolve(PUBLIC, "stems", releaseId, `${slug}-${STEM_FILE_SEGMENT[segment]}.flac`);
}

function main() {
  const bin = findAnalyzerBin();
  if (!bin) {
    console.error(
      [
        "audio-analyzer-rs binary not found.",
        "",
        "This analyzer is offline-only (pure Rust, cannot run in the browser).",
        "Install it, then re-run this script:",
        "",
        "  git clone https://github.com/JuzzyDee/audio-analyzer-rs.git",
        "  cd audio-analyzer-rs && cargo build --release",
        "  AUDIO_ANALYZER_BIN=$(pwd)/target/release/cli node scripts/analyze-stems.mjs",
        "",
        "(or download a prebuilt binary from the project's GitHub Releases)",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`Using analyzer: ${bin}`);
  const catalog = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/catalog.json"), "utf8"),
  );

  mkdirSync(OUT_DIR, { recursive: true });

  for (const release of catalog.releases ?? []) {
    const releaseId = release.id;
    const songsOut = {};

    for (const song of release.songs ?? []) {
      const usesConvention =
        Array.isArray(song.stems) &&
        song.stems.length > 0 &&
        song.stems.every((s) => !s.src);
      if (!usesConvention) continue;

      const slug = song.stemSlug ?? releaseId;
      const masterPath = publicFilePath(releaseId, slug, "master");
      if (!existsSync(masterPath)) continue;

      console.log(`Analyzing ${releaseId}/${song.id} …`);
      const result = {
        generator: "audio-analyzer-rs",
        releaseId,
        songId: song.id,
      };

      const master = analyzeFile(bin, masterPath);
      if (master) result.master = master;

      const stems = {};
      for (const stem of song.stems) {
        const stemPath = publicFilePath(releaseId, slug, stem.id);
        if (!existsSync(stemPath)) continue;
        const analyzed = analyzeFile(bin, stemPath);
        if (analyzed) stems[stem.id] = analyzed;
      }
      if (Object.keys(stems).length > 0) result.stems = stems;

      if (result.master || result.stems) songsOut[song.id] = result;
    }

    if (Object.keys(songsOut).length > 0) {
      const outPath = resolve(OUT_DIR, `${releaseId}.json`);
      writeFileSync(outPath, `${JSON.stringify(songsOut, null, 2)}\n`);
      console.log(`Wrote ${outPath}`);
    }
  }

  console.log("Done.");
}

main();
