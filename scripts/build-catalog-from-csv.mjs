#!/usr/bin/env node
/**
 * Merge NewJeans.csv into src/data/catalog.json, preserving existing song metadata.
 *
 *   node scripts/build-catalog-from-csv.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSV_PATH = resolve(ROOT, "NewJeans.csv");
const CATALOG_PATH = resolve(ROOT, "src/data/catalog.json");

/** @type {Record<string, { id: string; title: string }>} */
const RELEASE_BY_ALBUM = {
  Supernatural: { id: "supernatural", title: "Supernatural" },
  "How Sweet": { id: "how-sweet", title: "How Sweet" },
  NJWMX: { id: "njwmx", title: "NJWMX" },
  "NewJeans X MY DEMON": { id: "newjeans-x-my-demon", title: "NewJeans X MY DEMON" },
  GODS: { id: "gods", title: "GODS" },
  "A Time Called You (Original Soundtrack from the Netflix Series)": {
    id: "a-time-called-you",
    title: "A Time Called You",
  },
  "NewJeans 2nd EP 'Get Up'": { id: "get-up", title: "Get Up" },
  "Be Who You Are (Real Magic)": {
    id: "be-who-you-are",
    title: "Be Who You Are (Real Magic)",
  },
  Zero: { id: "zero", title: "Zero" },
  "NewJeans 'OMG'": { id: "omg", title: "OMG" },
  "NewJeans 1st EP 'New Jeans'": { id: "new-jeans", title: "New Jeans" },
};

/** Cover filenames under /public/covers (release id → file). */
const RELEASE_COVER_FILE = {
  supernatural: "Supernatural_album_cover.jpg",
  "how-sweet": "How Sweet_album_cover.jpg",
  njwmx: "NJWMX_album_cover.jpg",
  "newjeans-x-my-demon": "NewJeans X MY DEMON_album_cover.jpg",
  gods: "GODS_album_cover.jpg",
  "a-time-called-you":
    "A Time Called You (Original Soundtrack from the Netflix Series)_album_cover.jpg",
  "get-up": "NewJeans 2nd EP 'Get Up'_album_cover.jpg",
  "be-who-you-are": "Be Who You Are (Real Magic)_album_cover.jpg",
  zero: "Zero_album_cover.jpg",
  omg: "NewJeans 'OMG'_album_cover.jpg",
  "new-jeans": "NewJeans 1st EP 'New Jeans'_album_cover.jpg",
};

function releaseCoverArt(releaseId) {
  const file = RELEASE_COVER_FILE[releaseId];
  return file ? `/covers/${encodeURIComponent(file)}` : undefined;
}

/** Preserve stable ids for songs already in the catalog. */
const SONG_ID_OVERRIDE = {
  "supernatural|Supernatural": "supernatural-title",
  "how-sweet|How Sweet": "how-sweet-title",
  "get-up|New Jeans": "new-jeans",
  "get-up|Super Shy": "super-shy",
  "get-up|Get Up": "get-up-track",
};

const DEMO_STEMS = [
  { id: "vocals", label: "Vocals", src: "/stems/demo/vocals.mp3" },
  { id: "instruments", label: "Instruments", src: "/stems/demo/instruments.mp3" },
  { id: "drums", label: "Drums", src: "/stems/demo/drums.mp3" },
  { id: "bass", label: "Bass", src: "/stems/demo/bass.mp3" },
];

const FLAC_STEMS = [
  { id: "vocals", label: "Vocals" },
  { id: "instruments", label: "Other" },
  { id: "drums", label: "Drums" },
  { id: "bass", label: "Bass" },
];

const DEFAULT_SONG = {
  durationSec: 200,
  bpm: 120,
  key: "—",
};

/** Releases that use /stems/{releaseId}/{slug}-*.flac convention (no demo mp3). */
const FLAC_RELEASE_IDS = new Set(["supernatural"]);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        fields.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    fields.push(cur);
    const [albumName, discNumber, trackNumber, name, artists, type, releaseDate] = fields;
    rows.push({
      albumName,
      discNumber: Number(discNumber),
      trackNumber: Number(trackNumber),
      name,
      artists,
      type,
      releaseDate,
      year: Number(releaseDate?.slice(0, 4) ?? 0),
    });
  }
  return rows;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isInstrumentalName(name) {
  return /\(instrumental\)|\(inst\.\)/i.test(name);
}

function songIdFor(releaseId, name) {
  if (releaseId === "supernatural" && /^Supernatural \(Instrumental\)$/i.test(name)) {
    return "supernatural-instrumental";
  }

  const overrideKey = `${releaseId}|${name.replace(/\s*\((instrumental|inst\.)\)\s*/i, "").trim()}`;
  if (SONG_ID_OVERRIDE[overrideKey]) {
    const base = SONG_ID_OVERRIDE[overrideKey];
    return isInstrumentalName(name) ? `${base.replace(/-instrumental$/, "")}-instrumental` : base;
  }

  let base = name
    .replace(/\s*\(instrumental\)\s*/gi, "")
    .replace(/\s*\(inst\.\)\s*/gi, "")
    .trim();
  let id = slugify(base);
  if (!id) id = `track-${slugify(releaseId)}`;
  if (isInstrumentalName(name)) id = `${id}-instrumental`;
  return id;
}

function mapReleaseType(csvType) {
  if (csvType === "ALBUM") return "Album";
  if (csvType === "SINGLE") return "Single";
  return "EP";
}

function defaultStemsFor(releaseId) {
  return FLAC_RELEASE_IDS.has(releaseId)
    ? FLAC_STEMS.map((s) => ({ ...s }))
    : DEMO_STEMS.map((s) => ({ ...s }));
}

function newSongFromCsv(releaseId, row) {
  const id = songIdFor(releaseId, row.name);
  const song = {
    id,
    title: row.name,
    durationSec: DEFAULT_SONG.durationSec,
    bpm: DEFAULT_SONG.bpm,
    key: DEFAULT_SONG.key,
    stems: defaultStemsFor(releaseId),
  };
  if (FLAC_RELEASE_IDS.has(releaseId) && id !== "supernatural-title") {
    song.stemSlug = id;
  }
  return song;
}

function loadExistingCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
}

function buildSongIndex(catalog) {
  /** @type {Map<string, object>} */
  const index = new Map();
  for (const release of catalog.releases) {
    for (const song of release.songs) {
      index.set(`${release.id}|${song.id}`, song);
    }
  }
  return index;
}

function mergeSong(releaseId, row, existingIndex) {
  const id = songIdFor(releaseId, row.name);
  const key = `${releaseId}|${id}`;
  const existing = existingIndex.get(key);
  if (existing) {
    return JSON.parse(JSON.stringify(existing));
  }
  return newSongFromCsv(releaseId, row);
}

function main() {
  const csv = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csv);
  const catalog = loadExistingCatalog();
  const existingIndex = buildSongIndex(catalog);

  /** @type {Map<string, { meta: typeof RELEASE_BY_ALBUM[string]; rows: typeof rows }>} */
  const byRelease = new Map();

  for (const row of rows) {
    const meta = RELEASE_BY_ALBUM[row.albumName];
    if (!meta) {
      console.warn(`Skipping unknown album: ${row.albumName}`);
      continue;
    }
    if (!byRelease.has(meta.id)) {
      byRelease.set(meta.id, { meta, rows: [] });
    }
    byRelease.get(meta.id).rows.push(row);
  }

  /** Preserve remix-only songs not listed in CSV (per release). */
  const extraSongsByRelease = new Map();
  for (const release of catalog.releases) {
    const csvIds = new Set(
      (byRelease.get(release.id)?.rows ?? []).map((r) => songIdFor(release.id, r.name)),
    );
    const extras = release.songs.filter((s) => s.isRemix && !csvIds.has(s.id));
    if (extras.length) extraSongsByRelease.set(release.id, extras);
  }

  const releases = [...byRelease.entries()]
    .map(([releaseId, { meta, rows: releaseRows }]) => {
      const sorted = [...releaseRows].sort((a, b) => a.trackNumber - b.trackNumber);
      const first = sorted[0];
      const songs = sorted.map((row) => mergeSong(releaseId, row, existingIndex));
      const extras = extraSongsByRelease.get(releaseId) ?? [];
      const existingRelease = catalog.releases.find((r) => r.id === releaseId);
      const coverArt = existingRelease?.coverArt ?? releaseCoverArt(releaseId);
      return {
        id: meta.id,
        title: meta.title,
        year: first?.year ?? 0,
        type: mapReleaseType(first?.type ?? "EP"),
        releaseDate: first?.releaseDate ?? "",
        ...(coverArt ? { coverArt } : {}),
        songs: [...songs, ...extras.map((s) => JSON.parse(JSON.stringify(s)))],
      };
    })
    .sort(
      (a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || "") ||
        a.title.localeCompare(b.title),
    )
    .map(({ releaseDate: _releaseDate, ...release }) => release);

  const next = {
    ...catalog,
    releases,
  };

  writeFileSync(CATALOG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  const songCount = releases.reduce((n, r) => n + r.songs.length, 0);
  console.log(`Wrote ${releases.length} releases, ${songCount} songs → ${CATALOG_PATH}`);
}

main();
