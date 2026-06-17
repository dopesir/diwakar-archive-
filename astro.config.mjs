// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rename, rm } from 'node:fs/promises';

/**
 * Tier 2A — Redirects. The `cf-redirects.txt` endpoint (src/pages) builds the
 * redirect list from the validated `redirects` content collection. Astro ignores
 * underscore-prefixed routes, so we emit a normal `.txt` and rename it here to the
 * root `_redirects` file Cloudflare Pages reads. No extra deps, no YAML re-parse.
 */
const generateRedirects = {
  name: 'generate-redirects',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const src = new URL('cf-redirects.txt', dir);
      const dest = new URL('_redirects', dir);
      try {
        await rm(dest, { force: true });
        await rename(src, dest);
        logger.info('Wrote _redirects');
      } catch (err) {
        logger.warn(`Could not write _redirects: ${err}`);
      }
    },
  },
};

// IMPORTANT: replace `site` with your production URL before deploying.
// It is used by @astrojs/sitemap and by canonical / OpenGraph absolute URLs.
export default defineConfig({
  site: 'https://diwakar-archive.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  /**
   * Tier 3C — i18n. English is the default locale and stays UNPREFIXED at `/`
   * (byte-identical to pre-i18n). Hindi lives under `/hi/`. Until Hindi pages
   * are authored, `fallbackType: 'rewrite'` makes every `/hi/...` URL render the
   * English content in place — so Hindi never 404s and never shows a blank page.
   */
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: { hi: 'en' },
  },
  integrations: [sitemap(), generateRedirects],
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
