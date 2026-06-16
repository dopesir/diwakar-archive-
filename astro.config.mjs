// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: replace `site` with your production URL before deploying.
// It is used by @astrojs/sitemap and by canonical / OpenGraph absolute URLs.
export default defineConfig({
  site: 'https://diwakar-archive.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    // sharp is Astro's default image service — declared explicitly for clarity.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // Force first-party scripts to external files so the strict CSP
      // (script-src 'self', no 'unsafe-inline') never blocks them.
      assetsInlineLimit: 0,
    },
  },
});
