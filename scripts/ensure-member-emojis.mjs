/**
 * Ensures /public/members/emoji-{id}.png exist.
 * Minji/Hanni: Figma MemberEmoji component assets when localhost:3845 is up.
 * Others: copy from member-{id}.png (same export batch) until dedicated emoji exports exist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const membersDir = path.join(root, "public", "members");
const figmaBase = "http://localhost:3845/assets";
const figmaEmoji = {
  minji: "c1768d4cb5255ece181bc2d3ced3f4f8a195fedc.png",
  hanni: "548f23dfe9291691848df26e8ba0d1e881935502.png",
};
const allIds = ["minji", "hanni", "danielle", "haerin", "hyein", "group"];

async function fetchFigma(hash, dest) {
  const res = await fetch(`${figmaBase}/${hash}`);
  if (!res.ok) throw new Error(`${res.status} ${hash}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

fs.mkdirSync(membersDir, { recursive: true });

for (const id of allIds) {
  const dest = path.join(membersDir, `emoji-${id}.png`);
  if (figmaEmoji[id]) {
    try {
      await fetchFigma(figmaEmoji[id], dest);
      console.log(`Figma emoji ${id}`);
      continue;
    } catch {
      /* fall through */
    }
  }
  const src = path.join(membersDir, `member-${id}.png`);
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied member → emoji ${id}`);
  } else if (fs.existsSync(dest)) {
    console.log(`OK ${id}`);
  } else {
    console.warn(`Missing emoji for ${id}`);
  }
}
