import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { electronExcludeStemsPlugin, electronLibraryStemsPlugin } from "./vite.electron-plugin";

const electronBuild = process.env.ELECTRON_BUILD === "1";
const electronDev = process.env.ELECTRON_DEV === "1";

export default defineConfig({
  base: electronBuild ? "./" : "/",
  plugins: [
    react(),
    ...(electronBuild ? [electronExcludeStemsPlugin()] : []),
    ...(electronDev ? [electronLibraryStemsPlugin()] : []),
  ],
  server: {
    watch: {
      // Large stem files on Windows often trigger EBUSY when Vite watches public/stems.
      ignored: ["**/public/stems/**", "**/dist/**", "**/*.flac", "**/*.wav"],
    },
  },
});
