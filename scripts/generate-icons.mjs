/**
 * Generate electron-builder icons from build/icon-source.png.
 * Outputs: build/icon.png (1024), build/icon.ico, build/icon.icns
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import png2icons from "png2icons";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const sourcePath = path.join(buildDir, "icon-source.png");
const pngOut = path.join(buildDir, "icon.png");
const icoOut = path.join(buildDir, "icon.ico");
const icnsOut = path.join(buildDir, "icon.icns");

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing source image: ${sourcePath}`);
  process.exit(1);
}

fs.mkdirSync(buildDir, { recursive: true });

const png1024 = await sharp(sourcePath)
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

fs.writeFileSync(pngOut, png1024);

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(
  icoSizes.map((size) =>
    sharp(png1024).resize(size, size).png().toBuffer(),
  ),
);

const icoBuffer = await pngToIco(icoBuffers);
fs.writeFileSync(icoOut, icoBuffer);

const icnsBuffer = png2icons.createICNS(png1024, png2icons.BILINEAR, 0);
if (!icnsBuffer) {
  console.error("Failed to generate icon.icns");
  process.exit(1);
}
fs.writeFileSync(icnsOut, icnsBuffer);

console.log("Generated:");
console.log(`  ${path.relative(root, pngOut)}`);
console.log(`  ${path.relative(root, icoOut)}`);
console.log(`  ${path.relative(root, icnsOut)}`);
