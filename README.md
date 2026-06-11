# Purushottam Diwakar — Legacy Archive

A static [Astro 5](https://astro.build) portfolio for photojournalist **Purushottam
Diwakar** (27 years with the India Today Group). No framework, no database, no paid
services — it deploys as-is to Cloudflare Pages or Netlify's free tier, with a
Git-backed CMS at `/admin/` for a non-technical editor.

---

> ## ⚠️ Verify the narratives before launch
>
> The **Stories** and **Thoughts** texts and quotations, and several **Work** captions,
> were migrated from **draft prototype material**. They are attributed to a real person
> and **must be checked with Mr. Diwakar before the site goes public.** Treat every
> quote, date, name, and place as provisional until he confirms it. The CMS (below)
> makes corrections quick — edit the entry, save, done.

---

## Quickstart

Requires **Node 20+** (built with Node 22) and npm.

```bash
npm install            # install dependencies
npm run prepare-images # one-time: downscale the hero originals into src/assets/ (idempotent)
npm run dev            # local dev server at http://localhost:4321
npm run build          # production build into dist/
npm run preview        # preview the production build locally
```

`npm run prepare-images` only needs to be re-run when you add or replace files in
`source-assets/` (see "Mobile hero photos" below). The processed images it writes to
`src/assets/` are committed, so a plain `npm run build` is all the host needs.

## Project layout

```
source-assets/      original camera files + samples (kept for provenance; NOT in the build)
scripts/
  prepare-images.mjs   sharp downscale of the originals -> src/assets/  (run via npm)
  migrate-content.mjs   one-time content seed (already run; the files below are now canonical)
src/
  assets/           processed images (committed) + uploads/ (CMS media)
  content/          hero (yaml) · work · stories · thoughts (markdown) — the editable content
  components/       Nav, Footer, HeroSlider, Lightbox, DetailLayout, …
  layouts/Base.astro
  pages/            index, work/[…], stories/[…], thoughts/[…], about, connect, 404
  styles/global.css
public/
  admin/            Sveltia CMS (index.html + config.yml)
  favicon.svg  _headers
```

## Deploy

The build command is **`npm run build`** and the output directory is **`dist`**.

### Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command `npm run build`, output directory `dist`, framework preset **Astro**.
4. Add an environment variable `NODE_VERSION = 22`.
5. Deploy. `public/_headers` is applied automatically.

### Netlify

1. Push to GitHub → **Add new site → Import an existing project**.
2. Build command `npm run build`, publish directory `dist`.
3. Set `NODE_VERSION = 22` under Site settings → Environment.
4. Deploy. `public/_headers` is applied automatically.

> **Before deploying,** set your real domain in `astro.config.mjs` (`site:`). It is used
> for the sitemap and for canonical / OpenGraph URLs.

## Content management (CMS)

Editing happens at **`https://your-site/admin/`** via [Sveltia CMS](https://github.com/sveltia/sveltia-cms)
(a fast, drop-in successor to Netlify/Decap CMS). It commits changes straight to GitHub,
which re-triggers the host build.

### 1. Point the CMS at your repo

Edit `public/admin/config.yml` and replace the placeholder:

```yaml
backend:
  name: github
  repo: OWNER/REPO   # e.g. janedoe/diwakar-archive
  branch: main
```

### 2. Enable GitHub sign-in

Sveltia needs an OAuth handshake with GitHub. The simplest route on Cloudflare/Netlify
is the tiny **sveltia-cms-auth** worker:

1. Create a **GitHub OAuth App** (GitHub → Settings → Developer settings → OAuth Apps →
   New). Homepage URL = your site; **Authorization callback URL** = the auth worker URL
   you will deploy in the next step (e.g. `https://YOURNAME-sveltia-auth.workers.dev/callback`).
   Note the **Client ID** and generate a **Client Secret**.
2. Deploy the auth worker (one-click + instructions):
   <https://github.com/sveltia/sveltia-cms-auth>. Set its `GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET`, and `ALLOWED_DOMAINS` (your site's domain) variables.
3. Tell the CMS where the worker lives — add to `public/admin/config.yml`:

   ```yaml
   backend:
     name: github
     repo: OWNER/REPO
     branch: main
     base_url: https://YOURNAME-sveltia-auth.workers.dev
   ```

   *(On Netlify you can instead use Netlify's built-in GitHub OAuth and omit `base_url`.)*
4. Visit `/admin/`, click **Sign in with GitHub**, and start editing.

### What the editor can do

- **Hero slides** — caption, location, focus point, scrim tone, and upload desktop/mobile
  photos (7 slides).
- **Work / Stories / Thoughts** — add, edit, delete entries; upload photos; toggle
  **“Hide from site”** (this is the unpublish switch — hidden entries are dropped from the
  build).
- Uploaded photos are committed to `src/assets/uploads/` and run through the image
  pipeline automatically.

## Mobile hero photos (optional, recommended)

The hero currently serves **desktop** photos cropped to portrait on phones — the build
works with zero mobile photos. To supply proper portrait crops later:

- **Via the repo:** drop seven portrait images into `source-assets/hero-mobile/` named to
  match the desktop set (`01-diwali-lanterns-jaipur.jpg` … `07-jeep-grasslands.jpg`,
  ≥1280px wide, ~4:5), then run `npm run prepare-images` and commit.
- **Via the CMS:** open a hero slide and upload its **“Mobile image (portrait)”**.

## Pending assets

- **Four Work portraits are intentionally image-less** and show a gradient placeholder.
  Their original India Today CDN images cannot be hotlinked; add licensed images via the
  CMS. Each entry carries a `TODO` note naming the intended portrait:
  - *Political pulse — Rajasthan assembly* → Chief Minister Ashok Gehlot
  - *Monsoon retreat — Udaipur* → farmer Rameswar Regar
  - *Rural healthcare — mobile clinic* → Meera Mali
  - *Blue city after rain — Jodhpur* → President Pratibha Devisingh Patil
- **AFMJ Recognition (2023)** — confirm the award's full name/citation before launch.
- The About **portrait** downloaded successfully during the build; no action needed.

## Notes & decisions

- **Astro is pinned to v5** per spec. `npm audit` flags an advisory whose fix requires
  Astro 6 (a breaking change); it does **not** apply here — the site is `output: 'static'`
  (no server islands) and passes no untrusted data through `define:vars`. Do not run
  `npm audit fix --force`.
- **Image budget:** no file in `dist/` exceeds 500 KB. To hold that line for the very
  high-detail desert originals, the hero sources are capped at 1800px (not 2560px) and a
  couple of photographic PNGs were converted to JPEG. Tune in `scripts/prepare-images.mjs`
  and `src/components/HeroSlider.astro` if you change source images.
- **Accessibility / motion:** keyboard-operable throughout; all ambient animation
  (Ken Burns, dust, cursor trail, light sweep) is disabled under
  `prefers-reduced-motion: reduce`.
- All photographs © Purushottam Diwakar / India Today Group.
```

## Magazine flipbooks

Self-contained flipbook readers live in `public/flipbook/<issue-name>/index.html`
(each file embeds all of its page images — e.g. the Jeene Ka Andaaz June 2026 issue,
~6 MB, 29 pages). They are standalone documents loaded only when a reader opens
them, so they are an accepted exception to the 500 KB asset rule.

To add a new issue:
1. Drop the flipbook HTML at `public/flipbook/<new-issue>/index.html`.
2. Link a cover image to it (see the June 2026 example in `src/pages/about.astro` —
   an `<a class="press-img-wrap">` with a `flip-badge`).
3. Rebuild/push.
