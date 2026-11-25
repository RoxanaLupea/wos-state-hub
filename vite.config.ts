import { defineConfig, type Plugin } from 'vite';

// The site's version: the commit GitHub builds, or the time of a build made elsewhere.
// It is written into the page and into version.json beside it, so an open page can tell
// when a newer version has gone live (src/ui/new-version.ts).
const siteVersion = process.env.GITHUB_SHA || 'build-' + Date.now();

const versionFile: Plugin = {
  name: 'site-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: siteVersion }) });
  }
};

// The site is served from https://<user>.github.io/wos-state-hub/, so every link and picture needs that prefix.
// A custom domain later would change this one line to '/'.
export default defineConfig({
  base: '/wos-state-hub/',
  build: { outDir: 'dist', sourcemap: true },
  server: { open: true },
  define: { 'import.meta.env.VITE_SITE_VERSION': JSON.stringify(siteVersion) },
  plugins: [versionFile]
});
