// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro, etc. — do NOT re-add them here.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages repo name — the site is served under this sub-path.
const REPO_BASE = "/wellness-journey-narrative/";

export default defineConfig({
  vite: {
    base: REPO_BASE,
  },
  tanstackStart: {
    // Keep SSR error wrapper in dev / Lovable preview.
    server: { entry: "server" },
    // Emit a client-only SPA build so GitHub Pages can host it statically.
    spa: {
      enabled: true,
      prerender: {
        outputPath: "index.html",
      },
    },
    pages: [{ path: "/" }],
  },
  // Force Nitro's static preset so the output at `.output/public` is a plain
  // set of files GitHub Pages can serve (no Cloudflare Worker required).
  nitro: {
    preset: "static",
  },
});
