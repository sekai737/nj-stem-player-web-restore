/**
 * One-off diagnostic — run: node scripts/test-spotify-metadata.mjs
 * Does not print secrets; reports API status codes only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error("FAIL: No .env file at project root");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    console.error("FAIL: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET missing in .env");
    process.exit(1);
  }
  console.log("OK: .env has Spotify credentials");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  console.log(`Token endpoint: HTTP ${tokenRes.status}`);
  if (!tokenRes.ok) {
    console.error("FAIL: Could not get access token — check Client ID/Secret in dashboard");
    process.exit(1);
  }
  const { access_token: token } = await tokenRes.json();

  const searchQ = encodeURIComponent('track:"Supernatural" artist:NewJeans');
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${searchQ}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log(`Search endpoint: HTTP ${searchRes.status}`);
  const searchJson = await searchRes.json();
  const track = searchJson?.tracks?.items?.[0];
  if (!track) {
    console.error("FAIL: Search returned no tracks");
    process.exit(1);
  }
  console.log(`OK: Found track "${track.name}" (${track.id})`);

  const featuresRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${track.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log(`Audio-features endpoint: HTTP ${featuresRes.status}`);
  if (featuresRes.status === 403) {
    console.log(
      "\n>>> This is the blocker. Spotify deprecated /audio-features for NEW developer apps (Nov 2024).",
    );
    console.log(
      ">>> BPM and key cannot come from the public Web API. spicetify-dj-info uses Spotify Desktop's internal API instead.",
    );
    console.log(">>> Fix: put real BPM/key in catalog.json for each song.");
  } else if (featuresRes.ok) {
    const features = (await featuresRes.json())?.audio_features?.[0];
    console.log(`OK: tempo=${features?.tempo}, key=${features?.key}, mode=${features?.mode}`);
  } else {
    const body = await featuresRes.text();
    console.log(`Audio-features body: ${body.slice(0, 200)}`);
  }

  const tracksRes = await fetch(
    `https://api.spotify.com/v1/tracks?ids=${track.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log(`Tracks endpoint: HTTP ${tracksRes.status} (popularity/year still work)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
