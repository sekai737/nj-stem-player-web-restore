/**
 * Windows install/uninstall path constants.
 * Keep in sync with build/windows-paths.json (single source for NSIS + PowerShell).
 */
export const WINDOWS_PATHS = {
  appId: "com.sekai737.nj-stem-player",
  packageName: "nj-stem-player-web",
  productName: "NewJeans Stem Player",
  defaultStemsDir: "C:\\Program Files\\NewJeans Stem Player\\stems",
  defaultProgramFilesParent: "C:\\Program Files\\NewJeans Stem Player",
  registryKey: "Software\\com.sekai737.nj-stem-player",
  /** Installed app profile — removed by uninstaller. */
  packagedUserDataFolderName: "NewJeans Stem Player",
  /** Electron dev profile (`electron:dev`) — never removed by uninstaller. */
  devUserDataFolderName: "nj-stem-player-web",
  updaterFolderName: "nj-stem-player-web-updater",
} as const;
