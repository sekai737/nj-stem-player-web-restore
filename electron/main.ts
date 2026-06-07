import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  net,
  protocol,
  type BrowserWindow as BrowserWindowType,
} from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ensureDefaultLibrary,
  normalizeLibraryRoot,
  readLibraryRoot,
  resolveStemFile,
  setLibraryRoot,
} from "./library.js";

const PROTOCOL = "njsp";
const isDev = !app.isPackaged;

protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function distDir(): string {
  return path.join(app.getAppPath(), "dist");
}

function preloadPath(): string {
  return path.join(app.getAppPath(), "dist-electron", "preload.js");
}

function resolveBundledAsset(pathname: string): string {
  const clean = decodeURIComponent(pathname.split("?")[0] || "/");
  const rel = clean === "/" || clean === "" ? "index.html" : clean.replace(/^\//, "");
  const candidate = path.join(distDir(), rel);

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(distDir(), "index.html");
}

function registerProtocolHandler(): void {
  protocol.handle(PROTOCOL, async (request) => {
    const url = new URL(request.url);
    const libraryRoot = readLibraryRoot();

    if (url.pathname.startsWith("/stems/")) {
      if (!libraryRoot) {
        return new Response("Stem library not configured.", { status: 404 });
      }
      const stemFile = resolveStemFile(libraryRoot, url.pathname);
      if (!stemFile) {
        return new Response("Stem file not found.", { status: 404 });
      }
      return net.fetch(pathToFileURL(stemFile).href);
    }

    const assetPath = resolveBundledAsset(url.pathname);
    return net.fetch(pathToFileURL(assetPath).href);
  });
}

async function chooseLibraryFolder(win: BrowserWindowType | null): Promise<string | null> {
  const dialogOptions = {
    title: "Choose stem library folder",
    message: "Select the folder that contains a `stems` directory.",
    properties: ["openDirectory"] as ("openDirectory")[],
  };

  const result = win
    ? await dialog.showOpenDialog(win, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return readLibraryRoot();
  }

  const normalized = normalizeLibraryRoot(result.filePaths[0]!);
  if (!normalized) {
    const messageOptions = {
      type: "error" as const,
      title: "Invalid library folder",
      message: "That folder must contain a `stems` directory (or be the `stems` folder itself).",
    };
    if (win) {
      await dialog.showMessageBox(win, messageOptions);
    } else {
      await dialog.showMessageBox(messageOptions);
    }
    return readLibraryRoot();
  }

  setLibraryRoot(normalized);
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("library:pathChanged", normalized);
  }
  return normalized;
}

function buildMenu(win: BrowserWindowType): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Choose Stem Library…",
          click: () => {
            void chooseLibraryFolder(win);
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow(): Promise<BrowserWindowType> {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  buildMenu(win);

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDev) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadURL(`${PROTOCOL}://local/index.html`);
  }

  return win;
}

app.whenReady().then(async () => {
  registerProtocolHandler();
  ensureDefaultLibrary();

  ipcMain.handle("library:getPath", () => readLibraryRoot());
  ipcMain.handle("library:selectFolder", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return chooseLibraryFolder(win);
  });

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
