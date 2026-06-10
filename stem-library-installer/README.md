# NewJeans Stem Library Installer

Pure **NSIS** installer (no Electron). Downloads `stems.zip` from Archive.org and extracts to:

`C:\Program Files\NewJeans Stem Player\stems`

## Build

```bash
npm run build
```

Output: `release/NewJeans Stem Library Installer 1.0.0.exe` (~1–2 MB)

Requires `makensis` from the electron-builder NSIS cache (install root `electron` devDependency) or NSIS on PATH.

## Distribution

For end users, build the **combined** player installer from the repo root:

```bash
npm run release:build
```

That bundles this NSIS installer inside `NewJeans Stem Player Setup 1.0.0.exe`.

## Standalone use

Run `NewJeans Stem Library Installer 1.0.0.exe` as administrator. Internet required.
