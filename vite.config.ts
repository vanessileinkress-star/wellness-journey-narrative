// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro, etc. — do NOT re-add them here.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages repo name — the site is served under this sub-path.
const REPO_BASE = "/wellness-journey-narrative/";

// When building for GitHub Pages, we want a pure static SPA (no Cloudflare
// Worker output, no SSR runtime). The workflow sets GITHUB_PAGES=1 so we
// can flip presets without breaking the Lovable preview build.
const IS_GH_PAGES = process.env.GITHUB_PAGES === "1";

export default defineConfig({
  vite: {
    base: REPO_BASE,
  },
  tanstackStart: {
    // Keep SSR error wrapper in dev / Lovable preview.
    server: { entry: "server" },
    // Emit a client-only SPA shell so a static host can serve it.
    spa: {
      enabled: true,
      prerender: {
        outputPath: "index.html",
      },
    },
    pages: [{ path: "/" }],
  },
  // On GitHub Pages we skip Nitro entirely. TanStack Start's own SPA prerender
  // step produces `dist/client/index.html`, which is the whole static site.
  // Locally / in the Lovable preview we keep the default Nitro (Cloudflare) build.
  nitro: IS_GH_PAGES ? false : undefined,
});
