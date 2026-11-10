import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
);

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  define: {
    APP_NAME: JSON.stringify(pkg.name),
    APP_VERSION: JSON.stringify(pkg.version),
  },
});
