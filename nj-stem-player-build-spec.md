# NewJeans Stem Player — Build & Distribution Spec

## Project Overview

A cross-platform Electron desktop app built with React + TypeScript + Vite. Users can play NewJeans stem audio files. Stems are distributed separately via torrent, not bundled in the app.

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS |
| Bundler | Vite |
| Desktop wrapper | Electron 34 |
| Packaging | electron-builder 25 |
| Package manager | npm |

---

## App Details

| Field | Value |
|---|---|
| App name | NewJeans Stem Player |
| App ID | com.sekai737.nj-stem-player |
| Version | 1.0.0 |
| Icon | `build/icon.ico` (Win), `build/icon.icns` (Mac), `build/icon.png` (Linux) |

---

## Build Commands

| Command | Purpose |
|---|---|
| `npm run build` | Vite bundle only (sanity check) |
| `npm run electron:start` | Build + launch locally |
| `npm run electron:build` | Player installer only → `/release` |
| `npm run release:build` | **Combined installer** (player + stem library tool) → `/release` |

---

## Output Targets

| Platform | Format | Output |
|---|---|---|
| Windows | NSIS installer | `NewJeans Stem Player Setup 1.0.0.exe` |
| macOS | DMG | `NewJeans Stem Player-1.0.0.dmg` |
| Linux | AppImage | `NewJeans Stem Player-1.0.0.AppImage` |

Player-only builds go to `/release`. Use `npm run release:build` for the **combined** Windows installer — one Setup exe that installs the player and bundles the Stem Library Installer (Start Menu shortcut). Setup can prompt to download stems immediately.

---

## Stem Library Installer

Pure **NSIS** installer in `stem-library-installer/nsis/` (no Electron). Downloads `stems.zip` from Archive.org and extracts to `C:\Program Files\NewJeans Stem Player\stems`.

| Field | Value |
|---|---|
| Installer name | NewJeans Stem Library Installer |
| Output (standalone) | `stem-library-installer/release/NewJeans Stem Library Installer 1.0.0.exe` (~1–2 MB) |
| Distribution | Bundled inside `npm run release:build` combined player Setup |

### Commands

| Command | Purpose |
|---|---|
| `npm run stem-installer:build` | Build NSIS stem installer only |
| `npm run release:build` | Combined player Setup (includes stem NSIS installer) |

### Installer behaviour

- NSIS wizard → downloads from Archive.org → extracts to Program Files stems path.
- Requires **administrator** privileges and an internet connection.
- Bundled into the main player Setup; user is prompted to run it after player install.

---

## Stem File Distribution

Stems are **not bundled** in the app installer. They are distributed separately via torrent.

### Torrent Details

| Field | Value |
|---|---|
| Archive.org page | https://archive.org/details/newjeans-stem-player-stems |
| Magnet link | `magnet:?xt=urn:btih:559cadfd07a588cd655e4c6682bc9cf9f922bc99&dn=stems&xl=1636194123&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce` |
| Seeded by | Archive.org (permanent) + local machine via qBittorrent |
| Total size | ~1.6 GB |

### Default Install Paths (per platform)

| Platform | Path |
|---|---|
| Windows | `C:\Program Files\NewJeans Stem Player\stems` |
| macOS | `~/Music/NewJeans Stem Player/stems` |
| Linux | `~/.local/share/NewJeans Stem Player/stems` |

> **Note:** The Windows path requires admin privileges to write to. The stem pack installer runs as admin (NSIS default). The app itself only reads from this path — never writes.

---

## Constants File

**`src/constants/stems.ts`** — create this file:

```ts
export const STEMS_MAGNET_LINK = 'magnet:?xt=urn:btih:559cadfd07a588cd655e4c6682bc9cf9f922bc99&dn=stems&xl=1636194123&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';

export const STEMS_ARCHIVE_URL = 'https://archive.org/details/newjeans-stem-player-stems';

export const STEMS_INSTALL_PATH_WINDOWS = 'C:\\Program Files\\NewJeans Stem Player\\stems';
export const STEMS_INSTALL_PATH_MAC = '~/Music/NewJeans Stem Player/stems';
export const STEMS_INSTALL_PATH_LINUX = '~/.local/share/NewJeans Stem Player/stems';
```

---

## Electron Main Process Changes

**File:** `electron/main.ts`

Add the following:

```ts
import { shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

const STEMS_MAGNET_LINK = 'magnet:?xt=urn:btih:559cadfd07a588cd655e4c6682bc9cf9f922bc99&dn=stems&xl=1636194123&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';

function getDefaultStemsPath(): string {
  switch (process.platform) {
    case 'win32':
      return 'C:\\Program Files\\NewJeans Stem Player\\stems';
    case 'darwin':
      return path.join(os.homedir(), 'Music', 'NewJeans Stem Player', 'stems');
    case 'linux':
      return path.join(os.homedir(), '.local', 'share', 'NewJeans Stem Player', 'stems');
    default:
      return path.join(os.homedir(), 'NewJeans Stem Player', 'stems');
  }
}

// IPC Handlers
ipcMain.handle('get-stems-path', () => getDefaultStemsPath());

ipcMain.handle('check-stems-path', (_event, folderPath: string) => {
  if (!fs.existsSync(folderPath)) return false;
  const files = fs.readdirSync(folderPath, { recursive: true }) as string[];
  return files.some(f => f.endsWith('.mp3'));
});

ipcMain.handle('open-folder-picker', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-magnet-link', () => {
  shell.openExternal(STEMS_MAGNET_LINK);
});

ipcMain.handle('open-archive-page', () => {
  shell.openExternal('https://archive.org/details/newjeans-stem-player-stems');
});
```

---

## Preload Script Changes

**File:** `electron/preload.ts`

Expose all handlers via `contextBridge`:

```ts
contextBridge.exposeInMainWorld('electronAPI', {
  getStemsPath: () => ipcRenderer.invoke('get-stems-path'),
  checkStemsPath: (folderPath: string) => ipcRenderer.invoke('check-stems-path', folderPath),
  openFolderPicker: () => ipcRenderer.invoke('open-folder-picker'),
  openMagnetLink: () => ipcRenderer.invoke('open-magnet-link'),
  openArchivePage: () => ipcRenderer.invoke('open-archive-page'),
});
```

---

## New Component: StemsNotFound

**File:** `src/components/StemsNotFound.tsx`

### Props

```ts
interface StemsNotFoundProps {
  onStemsFound: (path: string) => void;
}
```

### Behaviour

- On mount: call `window.electronAPI.getStemsPath()` and display the platform-appropriate default path
- **"Download Stem Pack" button:** calls `window.electronAPI.openMagnetLink()`, then changes to disabled "Waiting for install..." state and reveals the Browse button
- **"or download from Archive.org" link:** calls `window.electronAPI.openArchivePage()`
- **"Browse Folder..." button:** calls `window.electronAPI.openFolderPicker()`, updates displayed path
- **"Continue" button:** calls `window.electronAPI.checkStemsPath(path)`:
  - If `true` → calls `onStemsFound(path)`
  - If `false` → shows inline error: "No stem files found in that folder."
- Helper text below buttons: "Opens in your torrent client. Once the download is complete, install the files to:" followed by the path in monospace

---

## App Entry Point Changes

**File:** `src/App.tsx`

```ts
const [stemsReady, setStemsReady] = useState(false);
const [stemsPath, setStemsPath] = useState('');

useEffect(() => {
  window.electronAPI.getStemsPath().then((defaultPath: string) => {
    setStemsPath(defaultPath);
    window.electronAPI.checkStemsPath(defaultPath).then((found: boolean) => {
      setStemsReady(found);
    });
  });
}, []);

if (!stemsReady) {
  return (
    <StemsNotFound
      onStemsFound={(p) => {
        setStemsPath(p);
        setStemsReady(true);
      }}
    />
  );
}

// render normal app
```

---

## Files to Create or Modify

| File | Action | Notes |
|---|---|---|
| `package.json` | Modify | Version → `1.0.0`; add icon paths to win/mac/linux build blocks |
| `src/constants/stems.ts` | **Create** | Magnet link, archive URL, install paths |
| `electron/main.ts` | Modify | Add 5 ipcMain handlers + `getDefaultStemsPath()` |
| `electron/preload.ts` | Modify | Expose 5 handlers via contextBridge |
| `src/components/StemsNotFound.tsx` | **Create** | Stems not found UI with download + browse flow |
| `src/App.tsx` | Modify | Add stems check on launch; render StemsNotFound if not found |
| `build/icon.ico` | **Create** | Windows icon (512×512 source, .ico format) |
| `build/icon.icns` | **Create** | macOS icon (512×512) |
| `build/icon.png` | **Create** | Linux icon (512×512) |
| `.gitignore` | Modify | Add `.env`, `public/stems/`, stem asset folders |

---

## package.json Build Block (final state)

```json
"build": {
  "appId": "com.sekai737.nj-stem-player",
  "productName": "NewJeans Stem Player",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "build/icon.icns"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "build/icon.png"
  }
}
```

---

## Pre-Commit Checklist

```
[ ] version is 1.0.0 in package.json
[ ] build/icon.ico exists (512×512)
[ ] build/icon.icns exists (512×512)
[ ] build/icon.png exists (512×512)
[ ] icon paths added to win/mac/linux blocks in package.json
[ ] src/constants/stems.ts created with correct magnet link and paths
[ ] electron/main.ts has all 5 ipcMain handlers
[ ] electron/preload.ts exposes all 5 handlers via contextBridge
[ ] StemsNotFound.tsx created and renders correctly in dev mode
[ ] App.tsx checks for stems on launch
[ ] App loads normally when stems ARE present at expected path
[ ] App shows StemsNotFound screen when stems are NOT present
[ ] Download Stem Pack button opens torrent client
[ ] Archive.org link opens browser
[ ] Browse Folder picker works and updates path display
[ ] Continue button detects .mp3 files correctly
[ ] .gitignore includes .env and stems asset folders
[ ] npm run build completes without errors
[ ] npm run electron:start launches app correctly
[ ] npm run electron:build produces installer in /release
[ ] Installer tested on a clean Windows machine
```

---

## Risks & Notes

- **Program Files requires admin at write time** — the stem installer runs as admin (fine). The app must never attempt to write to this path at runtime.
- **macOS Gatekeeper** — unsigned `.dmg` will be blocked for external users. For personal/small group use, right-click → Open works. For public release, an Apple Developer ID is required.
- **Torrent seeding** — Archive.org is the permanent seeder. Keep your local qBittorrent seeding when possible to improve speeds for new users.
- **`tsconfig.electron.json`** — must exist and output to `dist-electron/main.js` exactly, or the app will launch a blank window.
- **`ensure-electron.mjs` and `ensure-fonts.mjs`** — run these manually before the full build to confirm they pass independently.
