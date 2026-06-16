import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Generates the Cloudflare Pages redirects file at build from the CMS-managed
// `redirects` collection, via Astro's content layer (Zod-validated). This emits
// dist/cf-redirects.txt; the `generate-redirects` integration in astro.config.mjs
// then renames it to the root `_redirects` file Cloudflare/Netlify expect (a name
// Astro's router otherwise ignores for being underscore-prefixed). Emitted even
// when empty so the file always exists. Static endpoint — no inline scripts.
export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = await getCollection('redirects');

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const e of entries.sort((a, b) => a.data.from.localeCompare(b.data.from))) {
    const { from, to, status } = e.data;
    if (from === to) continue; // a no-op redirect would loop — skip it
    if (seen.has(from)) continue; // first rule for a given path wins
    seen.add(from);
    lines.push(`${from} ${to} ${status}`);
  }

  const body = [
    '# Cloudflare Pages redirects — GENERATED AT BUILD from the Redirects',
    '# collection in the CMS. Do not edit by hand; this file is overwritten.',
    ...lines,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
