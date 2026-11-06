import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/film-block/",
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
