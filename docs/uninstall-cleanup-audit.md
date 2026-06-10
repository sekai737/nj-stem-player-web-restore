# NewJeans Stem Player — Uninstall Cleanup Audit Report

Generated for release review. Documents every path, shortcut, and registry key targeted by the Windows NSIS uninstaller.

**Source of truth:** `build/windows-paths.json`  
**Uninstall implementation:** `build/uninstall-cleanup.ps1` (invoked from `build/installer-combined.nsh` → `customUnInstall`)  
**Standard removal:** electron-builder NSIS template (application `$INSTDIR`, primary uninstall registry entry, default Start Menu shortcut)

---

## Safety rules (enforced)

| Rule | Implementation |
|------|----------------|
| Only remove app-owned data | Cleanup script deletes fixed paths derived from `windows-paths.json` and `$INSTDIR` |
| Do not remove user-selected stem libraries outside app paths | Stems are removed only when `StemsInstalledBySetup = 1` **and** the path is under `C:\Program Files\NewJeans Stem Player\` or `$INSTDIR` |
| Do not remove shared/system files | No broad `%USERPROFILE%`, `%TEMP%` (except named `nj-stems-*` files), or Program Files sweeps |
| Fresh reinstall after uninstall | Packaged profile `%APPDATA%\NewJeans Stem Player\` removed (config, cache, IndexedDB, localStorage) |
| **Never remove Cursor / dev tooling** | See [Development paths (never removed)](#development-paths-never-removed) |

---

## Development paths (never removed)

The uninstaller **does not** target anything used by `npm run dev` / `npm run electron:dev`:

| Path / artifact | Reason |
|-----------------|--------|
| `%APPDATA%\nj-stem-player-web\` | Electron dev user profile (`electron:dev`) |
| `%LOCALAPPDATA%\nj-stem-player-web\` | Dev local profile (if created) |
| Any path inside a git repo (`.git` ancestor) | Cursor project / source tree |
| Paths under folders with `node_modules\`, `vite.config.ts`, `tsconfig.electron.json`, `public\stems\`, or `.electron-library-path` | Dev workspace markers |
| `{ProjectRoot}\**` | Source, `public/stems`, `.env`, etc. (unless user installed the packaged app into the repo — then only `$INSTDIR` NSIS removal applies, and cleanup skips dev-marked `$INSTDIR`) |
| `{ProjectRoot}\.electron-library-path` | Dev stem library hint |

**Packaged vs dev profiles:** Installed app stores settings under `%APPDATA%\NewJeans Stem Player\`. Dev uses `%APPDATA%\nj-stem-player-web\` (Electron default from package name).

---

## Installation files

Removed by **electron-builder NSIS** (default uninstall):

| Path / item | Notes |
|-------------|--------|
| `{InstallDir}\**` | Entire chosen install folder (default often `{InstallDir}\NewJeans Stem Player\`). Includes `NewJeans Stem Player.exe`, `resources\`, locales, `uninstall.exe`, etc. |
| `{InstallDir}\StemLibraryInstaller\**` | Legacy bundled stem installer (older releases only); also explicitly removed by cleanup script if `$INSTDIR` still present |

Removed by **uninstall-cleanup.ps1** (conditional):

| Path / item | Condition |
|-------------|-----------|
| `C:\Program Files\NewJeans Stem Player\stems\**` | `HKLM\Software\com.sekai737.nj-stem-player\StemsInstalledBySetup = 1` and path is app-owned |
| `C:\Program Files\NewJeans Stem Player\` | Removed only if empty after stems deletion |
| `C:\Program Files\NewJeans Stem Player\Uninstall Stem Library.exe` | Legacy standalone stem-library NSIS uninstaller, if present |

**Not removed (safety):**

| Path / item | Reason |
|-------------|--------|
| User-chosen stem folder (e.g. `D:\Music\NJ Stems\`) | Outside app-owned directories; user media / explicit custom location |
| `{InstallDir}` parent folders | Only `$INSTDIR` itself is removed by NSIS |

---

## User data

Removed by **uninstall-cleanup.ps1**:

| Path | Contents |
|------|----------|
| `%APPDATA%\NewJeans Stem Player\` (entire folder) | Packaged Electron user profile |
| `%LOCALAPPDATA%\NewJeans Stem Player\` (entire folder, if created) | Packaged local profile copy |

**Inside `%APPDATA%\NewJeans Stem Player\` (all removed with folder):**

| Subpath | Purpose |
|---------|---------|
| `library-config.json` | Stem library root + search paths (installer / in-app browse) |
| `IndexedDB\` | Chromium IndexedDB (includes `njsp-track-metadata` Spotify/DJ analysis cache) |
| `Local Storage\` | Chromium localStorage |
| `Session Storage\` | Session storage |
| `Cache\` | Chromium disk cache |
| `Code Cache\` | V8/Chromium code cache |
| `GPUCache\` | GPU cache |
| `DawnGraphiteCache\`, `DawnWebGPUCache\` | Graphics caches (if present) |
| `Network\` | Network persistent state |
| `Preferences`, `Local State` | Chromium/Electron preferences |
| `Shared Dictionary\`, `SharedStorage*` | Chromium shared storage (if present) |
| `blob_storage\`, `databases\` | Legacy Chromium storage (if present) |

---

## Settings / configuration

| Path / identifier | Notes |
|-------------------|--------|
| `%APPDATA%\NewJeans Stem Player\library-config.json` | Explicitly targeted before folder delete (redundant but documented) |
| `%APPDATA%\NewJeans Stem Player\Preferences` | Electron/Chromium settings |
| `%APPDATA%\NewJeans Stem Player\Local State` | Profile state |

**Dev-only (not created by installed app):**

| Path | Notes |
|------|--------|
| `{ProjectRoot}\.electron-library-path` | Dev hint file; not touched by uninstaller |

---

## Cache / temp files

| Path / pattern | Created by |
|----------------|------------|
| `%TEMP%\nj-stems-stems.zip` | Stem download during setup (`install-stems.ps1`) |
| `%TEMP%\nj-stems-extract-*\` | Stem extract temp dirs during setup |
| `%APPDATA%\NewJeans Stem Player\Cache\` | Electron/Chromium runtime cache |
| `%APPDATA%\NewJeans Stem Player\Code Cache\` | Chromium code cache |

---

## Logs

| Path | Notes |
|------|--------|
| `%APPDATA%\NewJeans Stem Player\logs\` | Electron log output (if enabled / created) |

Application `console.info` / `console.warn` output is not persisted to disk by default.

---

## Shortcuts

Removed by **electron-builder NSIS** (default):

| Path | Notes |
|------|--------|
| `%APPDATA%\Microsoft\Windows\Start Menu\Programs\NewJeans Stem Player\NewJeans Stem Player.lnk` | Per-user Start Menu (typical) |
| `{CommonPrograms}\NewJeans Stem Player\NewJeans Stem Player.lnk` | All-users Start Menu (if per-machine install) |

Removed by **uninstall-cleanup.ps1** (explicit / legacy):

| Path | Notes |
|------|--------|
| `{UserPrograms}\NewJeans Stem Player\Stem Library Installer.lnk` | Legacy bundled stem installer shortcut |
| `{UserPrograms}\NewJeans Stem Player\NewJeans Stem Player.lnk` | Redundant safety delete |
| `{UserPrograms}\NewJeans Stem Player\` | Removed if empty |
| `{UserDesktop}\NewJeans Stem Player.lnk` | Desktop shortcut (if created manually or by future config) |
| `{PublicDesktop}\NewJeans Stem Player.lnk` | Common desktop shortcut (if present) |

**Not removed:** shortcuts to unrelated apps; user-created shortcuts pointing elsewhere.

---

## Registry entries

Removed by **electron-builder NSIS** (default):

| Key | Notes |
|-----|--------|
| `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\802e0b04-8492-56f0-bc69-5346a73bbbcd` | Primary Add/Remove Programs entry (appId-derived GUID) |

Removed by **uninstall-cleanup.ps1**:

| Key | Notes |
|-----|--------|
| `HKLM\Software\com.sekai737.nj-stem-player` | App stem-install metadata (`StemsDir`, `StemsInstalledBySetup`) |
| `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary` | Legacy standalone stem-library NSIS uninstall entry |
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\802e0b04-8492-56f0-bc69-5346a73bbbcd` | Per-user uninstall entry fallback |

**Not removed:** `njsp://` custom protocol (registered at runtime only via Electron `protocol.handle`, not in Windows registry).

---

## Update files

| Path | Notes |
|------|--------|
| `%LOCALAPPDATA%\nj-stem-player-web-updater\` | electron-builder NSIS updater cache (`installer.exe` staging) |

---

## Other app-generated files

| Path | Notes |
|------|--------|
| `{InstallDir}\StemLibraryInstaller\StemLibraryInstaller.exe` | Legacy bundled stem installer |
| `C:\Program Files\NewJeans Stem Player\Uninstall Stem Library.exe` | Legacy stem-library uninstaller |

**Release artifacts (not installed, not removed by uninstaller):**

| Path | Notes |
|------|--------|
| `release\NewJeans Stem Player Uninstall {version}.exe` | Standalone uninstaller copy for distribution; user must delete manually |

---

## Validation checklist

After uninstall, verify:

- [ ] `{InstallDir}` no longer exists
- [ ] `%APPDATA%\NewJeans Stem Player` no longer exists
- [ ] `%APPDATA%\nj-stem-player-web` **still exists** if you use `electron:dev` on the same machine
- [ ] `%LOCALAPPDATA%\nj-stem-player-web-updater` no longer exists
- [ ] Start Menu folder `NewJeans Stem Player` gone (or empty)
- [ ] No `NewJeans Stem Player` entry in Settings → Apps (except if uninstall interrupted)
- [ ] `HKLM\Software\com.sekai737.nj-stem-player` absent
- [ ] Default stems removed only if installed by setup to `C:\Program Files\NewJeans Stem Player\stems`
- [ ] Custom user stem path (if used) **still present**
- [ ] Reinstall behaves as first-time install (no saved library config, no cached metadata)

---

## File map (implementation)

| File | Role |
|------|------|
| `build/windows-paths.json` | Shared path/registry constants |
| `build/installer-combined.nsh` | NSIS install/uninstall hooks |
| `build/install-stems.ps1` | Stem download (install) |
| `build/uninstall-cleanup.ps1` | Extended cleanup (uninstall) |
| `electron/windowsPaths.ts` | App-side mirror of path constants |
| `electron/library.ts` | Writes `library-config.json` under userData |
| `electron/stemsDistribution.ts` | Default stems path (Windows) |
