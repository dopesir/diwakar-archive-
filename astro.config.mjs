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
});
