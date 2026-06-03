import fs from "fs";
import path from "path";

const ROOT = path.resolve("..");
const SRC = path.join(ROOT, "src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null; // skip packages
  const base = path.resolve(path.dirname(fromFile), spec);
  const tries = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const t of tries) {
    if (fs.existsSync(t)) return t;
  }
  return base;
}

const missing = [];
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1];
    if (!spec.startsWith(".")) continue;
    const resolved = resolveImport(file, spec);
    if (!fs.existsSync(resolved)) {
      missing.push({ file: path.relative(ROOT, file), spec, resolved: path.relative(ROOT, resolved) });
    }
  }
}

if (missing.length === 0) {
  console.log("All relative imports resolve.");
} else {
  console.log(`Missing ${missing.length} imports:`);
  for (const x of missing) console.log(`  ${x.file} -> ${x.spec} (${x.resolved})`);
  process.exit(1);
}
