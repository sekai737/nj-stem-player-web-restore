/**
 * Build the Windows release package (player installer + README + zip).
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(projectRoot, "release");

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const version = pkg.version ?? "0.0.0";
const setupName = `${pkg.build?.productName ?? pkg.name} Setup ${version}.exe`;

function run(command, args, { cwd = projectRoot, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function writeReadme() {
  const readme = `NewJeans Stem Player — Release ${version}
=====================================

Run this installer:

  ${setupName}

It installs NewJeans Stem Player. During setup you can optionally download
and install the stem audio pack (~1.6 GB) in the same wizard.

Default stem location:
  C:\\Program Files\\NewJeans Stem Player\\stems
`;
  fs.writeFileSync(path.join(releaseDir, "README.txt"), readme, "utf8");
  console.info("[release] README.txt");
}

function createZip() {
  const setupPath = path.join(releaseDir, setupName);
  if (!fs.existsSync(setupPath)) return;

  const zipName = `${pkg.build?.productName ?? pkg.name} ${version}.zip`;
  const zipPath = path.join(releaseDir, zipName);
  const readmePath = path.join(releaseDir, "README.txt");

  try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    const items = [setupPath, readmePath].filter((p) => fs.existsSync(p));
    const literalPaths = items.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -LiteralPath @(${literalPaths}) -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "inherit" },
    );
    const sizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
    console.info(`[release] ${zipName} (${sizeMb} MB)`);
  } catch (error) {
    console.warn(`[release] Could not create zip: ${error.message}`);
  }
}

async function main() {
  console.info("[release] Step 1/2 — Build player app bundle…");
  await run("npm", ["run", "electron:build:app"]);

  console.info("[release] Step 2/2 — Package NSIS installer…");
  await run("node", ["scripts/run-electron-builder.mjs"], {
    env: { ...process.env, COMBINED_RELEASE: "1" },
  });

  const setupPath = path.join(releaseDir, setupName);
  if (!fs.existsSync(setupPath)) {
    throw new Error(`Installer not found: ${setupPath}`);
  }

  const sizeMb = (fs.statSync(setupPath).size / 1024 / 1024).toFixed(1);
  console.info(`[release] ${setupName} (${sizeMb} MB)`);

  writeReadme();
  createZip();

  console.info(`\n[release] Done — release files in:\n  ${releaseDir}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
