# OPUS BUILD SPEC — Purushottam Diwakar Legacy Archive

You are building a complete, production-ready portfolio website for photojournalist
Purushottam Diwakar (27 years with India Today Group). Everything you need is in this
folder. Read this entire spec before writing any code. Do not ask the user questions —
every decision has already been made and is recorded here. Where this spec is silent,
match the reference design.

---

## 1. Mission & hard constraints

Build an **Astro 5 static site** in this folder (`diwakar-archive/`) that:

1. Ports the cinematic design from `reference/purushottam_diwakar_cinematic_v4.html`
   (the "v4 reference") visually 1:1 — palette, fonts, grain, letterbox hero, motion.
2. Converts the fake SPA into **real routed pages**, including an individual detail
   page for every work item, story, and thought.
3. Adds **Sveltia CMS** at `/admin/` so a non-technical client can add/edit/delete
   content and upload photos.
4. Ships with an **art-directed hero slider**: 7 desktop images + 7 mobile images,
   optimized through Astro's image pipeline.

**Hard constraints — violating any of these is a failed build:**

- `output: 'static'` only. No SSR, no serverless functions, no database, no paid
  service of any kind. Must deploy as-is to Cloudflare Pages / Netlify free tier.
- **No UI framework.** No React/Vue/Svelte components. Interactivity is vanilla JS in
  Astro `<script>` tags. The shipped JS bundle must stay small.
- No CSS framework. Hand-written CSS (global stylesheet + scoped component styles),
  ported from the v4 reference.
- All images served locally and rendered through `astro:assets`. No hotlinking to
  `akm-img-a-in.tosshub.com` or `imaginephotojournalists.com` (download note in §7.4).
- No image in the final `dist/` output may exceed **500 KB**.
- Node 20+, npm. Lockfile committed.

### 1.1 Setup — do this first

Node 22 and npm 10 are already installed on this machine. Scaffold the project in
THIS folder (it already contains `reference/` and `source-assets/` — do not delete
or move them; add `source-assets/` and `reference/` to `.gitignore`? **No** — keep
them in the repo so future contributors have the originals, but exclude them from
the Astro build by keeping them outside `src/` and `public/`, which they already are).

```powershell
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict
npm install
npm install @astrojs/sitemap @fontsource-variable/manrope @fontsource/cormorant-garamond
npm install -D sharp
```

(If `npm create astro` refuses a non-empty directory, scaffold in a temp subfolder
and move the generated files up, or write `package.json` / `astro.config.mjs` /
`tsconfig.json` by hand — the end state in §3 is what matters, not the scaffolder.)

Verify the toolchain immediately: `npm run dev` must start and serve the default
page before you write any project code. Then proceed with the build order in §12.

---

## 2. Source materials in this folder

| Path | What it is |
|---|---|
| `reference/purushottam_diwakar_cinematic_v4.html` | The v4 design + ALL content (read its `<style>` block, `storiesData`, `thoughtsData`, `workTitles`, `years`, `workImgMap`, `workCapMap`, `SLIDES` arrays) |
| `source-assets/hero-desktop/01..07-*.jpg` | The 7 desktop hero originals (huge camera files, up to 41 MB — see §7) |
| `source-assets/hero-mobile/` | The 7 mobile hero originals. **May be empty** — see §7.3 fallback rule |
| `source-assets/site-samples/` | Slider/work/press images (slide-1..6.jpg, web-banner-2025.png, AFMJ award, Imagine society photos, press clips) — `slide-7.png` is 0 bytes, ignore it |
| `source-assets/prototype-assets/` | hero-2025.png, magazine-cover.png, opening-ceremony.jpg, seminar-stage.png, press-clip.png, imagine-logo.png |

---

## 3. Project structure to generate

```
diwakar-archive/
├── astro.config.mjs            # static output, image config
├── package.json
├── tsconfig.json
├── scripts/
│   └── prepare-images.mjs      # one-time sharp downscale of hero originals (§7.2)
├── public/
│   ├── admin/
│   │   ├── index.html          # Sveltia CMS loader
│   │   └── config.yml          # CMS collections (§9)
│   └── favicon.svg             # simple camera-aperture mark in --ochre
├── src/
│   ├── styles/global.css       # tokens, base, shared classes from v4
│   ├── assets/                 # processed images (hero/, work/, about/, ...)
│   ├── content.config.ts       # collection schemas (§5)
│   ├── content/
│   │   ├── hero/  *.yaml       # 7 slide entries
│   │   ├── work/  *.md         # ~50 entries
│   │   ├── stories/ *.md       # 20 entries
│   │   └── thoughts/ *.md      # ~8 entries after dedupe (§6.3)
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── HeroSlider.astro
│   │   ├── Lightbox.astro
│   │   ├── CustomCursor.astro
│   │   ├── GrainOverlay.astro
│   │   ├── StatCounter.astro
│   │   ├── WorkCard.astro
│   │   ├── StoryBlock.astro
│   │   ├── ThoughtBlock.astro
│   │   └── DetailLayout.astro  # shared detail-page shell (§8.4)
│   ├── layouts/Base.astro      # <head>, fonts, nav, footer, cursor, lightbox mount
│   └── pages/
│       ├── index.astro
│       ├── work/index.astro
│       ├── work/[slug].astro
│       ├── stories/index.astro
│       ├── stories/[slug].astro
│       ├── thoughts/index.astro
│       ├── thoughts/[slug].astro
│       ├── about.astro
│       ├── connect.astro
│       └── 404.astro
└── README.md                   # deploy + CMS setup guide for the site owner (§11)
```

---

## 4. Design system (extract from v4 reference)

Port these exactly from the v4 `<style>` block into `src/styles/global.css`:

- **Tokens:** `--ochre:#B4511A; --ochre2:#D97A2B; --sand:#D4A96A; --sand-lt:#EDE0C4;
  --ink:#0A0806; --ink2:#1C160E; --parch:#F5EDD8; --smoke:#7A6A52;`
- **Fonts:** Manrope (300–800) for UI/headings, Cormorant Garamond (italic) for quotes.
  **Self-host via `@fontsource` packages** (`@fontsource-variable/manrope`,
  `@fontsource/cormorant-garamond`) instead of the Google Fonts CDN — faster, no
  third-party request, works offline.
- **Texture:** the inline-SVG film-grain overlays (`feTurbulence`) used on hero,
  cards, and about section. Keep as CSS background-image data URIs.
- **Motion language:** `cubic-bezier(.22,1,.36,1)` ease, fade-up reveals via
  IntersectionObserver (`.fu` / `.vis` pattern), Ken Burns slow zoom on hero, 8s
  hover zoom on card images, letterbox bars animating 8vh→20vh→8vh on hero load.
- **Custom cursor:** ochre dot + trailing ring, hidden on `pointer:coarse`.

**Required improvements over v4 (do NOT port these v4 defects):**

- Wrap ALL non-essential animation (Ken Burns, dust canvas, cursor trailing, light
  sweep, scroll pulse) in `@media (prefers-reduced-motion: no-preference)`.
- Add visible `:focus-visible` styles (2px `--ochre` outline, offset 3px) on every
  interactive element. Keyboard navigation must be fully usable.
- `cursor:none` must NOT apply when the custom cursor is disabled.
- Real semantic HTML: `<h1>` on every page, `<nav>`, `<main>`, `<article>`,
  `aria-current="page"` on active nav link.
- Each page gets unique `<title>` and `<meta name="description">`, OpenGraph tags,
  and the detail pages get `og:image` from their photo.

---

## 5. Content model (`src/content.config.ts`)

Use Astro Content Collections with zod schemas. Images referenced in frontmatter use
the `image()` schema helper so they run through the asset pipeline.

```ts
// hero — data collection (yaml)
{
  order: number,                    // 1..7
  location: string,                 // "Jaipur"
  title: string,                    // caption line
  imageDesktop: image(),            // landscape original
  imageMobile: image().optional(),  // portrait original; fallback rule §7.3
  position: string.default('center'),   // CSS object-position for desktop
  tone: enum(['dark','bright'])     // picks scrim strength (v4 .hs-bright/.hs-dark)
}

// work
{
  title: string,
  year: number,
  location: string.optional(),
  image: image().optional(),        // optional — placeholder cards exist
  caption: string.optional(),       // lightbox/detail caption
  featured: boolean.default(false), // shows in home "Selected Frames"
  draft: boolean.default(false)
}

// stories & thoughts (same schema)
{
  title: string,
  date: string,                     // "Jaisalmer · 2019" display string
  year: number,                     // for sorting
  location: string,
  image: image().optional(),
  quote: string.optional(),         // pull quote (stories have it, thoughts mostly not)
  mood: enum(['drought','night','water']).optional(),
  draft: boolean.default(false)
}
// markdown body = the full description shown on the detail page
```

`draft: true` entries are excluded from builds — this is the CMS "unpublish" mechanism.

---

## 6. Content migration (from the v4 reference file)

### 6.1 Hero slides (7 entries in `src/content/hero/`)

Migrate from the v4 `SLIDES` array. Map images to the renamed files:

| order | location | title (from v4 SLIDES) | imageDesktop | tone |
|---|---|---|---|---|
| 1 | Jaipur | Diwali Night — Firecrackers and Floating Lanterns… | hero-desktop 01 | dark |
| 2 | Indo-Pak Border | Bawaliyanwala Border Outpost — …at 54°C | 02 | bright |
| 3 | Thar Desert | Goats Crossing the Arid Terrain… | 03 | bright |
| 4 | Indian Air Force | CH-47 Chinook Helicopter Airlifting Artillery… | 04 | dark |
| 5 | Rajasthan | A Moment of Warmth — …with a Village Elder | 05 | bright |
| 6 | Rajasthan · Archive | SBBJ Camel Bank — Mobile Banking in the Desert… | 06 | bright |
| 7 | Rajasthan · Field | On Assignment — Jeep in the Grasslands… | 07 | bright |

Port each slide's `pos` value from v4 into `position`.

### 6.2 Work (~50 entries)

Migrate every entry from v4 `workTitles` + `years` + `workImgMap` + `workCapMap`.
Slugify titles (`drought-chronicles-jaisalmer`). Items with images in `workImgMap`:

- index 0 → site-samples/slide-1.jpg, 1 → slide-2.jpg, 3 → web-banner-2025.png,
  8 → prototype-assets/magazine-cover.png
- indexes 5, 6, 7, 9 pointed at India Today CDN portraits (Gehlot, Regar, Meera
  Mali, Pratibha Patil). **Do not hotlink.** Leave these four without an image and
  add `caption:` from `workCapMap` with a `<!-- TODO: add licensed image via CMS -->`
  comment in the body. Where `workCapMap` year conflicts with the `years` array,
  the `years` array wins.
- Skip the v4 filler ("Untitled archival frame") — do not create entries for it.
- Mark `featured: true` on the three items shown in v4's home "Selected Frames"
  (web-banner item, magazine cover, AFMJ award — create a work entry for the AFMJ
  award using site-samples/AFMJ0323-1030x687.png if not already in the list).

Each work markdown body: 2–4 sentences expanding on the title — factual-neutral tone,
describing subject and setting only. Do not invent quotes, events, or claims.

### 6.3 Stories (20) and Thoughts (dedupe rule)

Migrate all 20 `storiesData` entries to `src/content/stories/`, including their
`quote` and `mood` (port the v4 `moodMap`).

The v4 `thoughtsData` heavily duplicates stories. **Dedupe rule: an item lives in
exactly one collection.** Thoughts keeps ONLY these (the ethics/behind-the-frame
pieces), migrated from `thoughtsData`:

1. The Tribe That Wanted to Kill Me (Remote Africa · 2017)
2. The Ethics of Not Publishing (India Today Archives)
3. The Woman Who Walked 20 Kilometers for Water (Jaisalmer · 2019)
4. The Last Vulture (Thar Desert · 2015)
5. When the Chief Minister Asked to Delete a Photo (Rajasthan · 2018)
6. The Blue City in Flames (Jodhpur · 2010)
7. The Artisan Who Lost His Fingers (Kutch · 2019)
8. The Unseen Portrait of a Beggar (Delhi · 2011) — **remove from stories** (it is
   an ethics piece; stories drops to 19 entries)

All other `thoughtsData` entries are duplicates of stories — do not migrate them.
Where duplicate pairs disagree on a year, the `storiesData` year wins.

Detail-page bodies: use the v4 body text as the opening paragraph, then expand to
2–3 paragraphs **using only information already present in that entry** (no new
facts, names, or quotes).

### 6.4 Content verification flag

Top of README, verbatim warning: the stories/thoughts narratives and quotes came
from draft material and **must be verified with Mr. Diwakar before launch** — they
are attributed to a real person. The CMS makes corrections easy.

### 6.5 About / Connect copy

Port verbatim from v4 (bio paragraphs, Imagine Photojournalist Society section,
Camera Commandos, press strip, stats: 27+ years, 1,308+ Getty, 4 continents, ∞
untold moments; social links: instagram.com/lifeonimage, the LinkedIn URL, Getty
search URL). These pages are `.astro` files, not collections.

---

## 7. Images — pipeline & art direction

### 7.1 General rules

- Originals live in `src/assets/`; every render goes through `astro:assets`
  (`<Image>` / `<Picture>` / `getImage()`), emitting AVIF + WebP with JPEG fallback.
- Grid/card images: `widths={[400, 800, 1200]}`, proper `sizes` attribute, `loading="lazy"`.
- Detail-page hero image: `widths={[800, 1400, 2000]}`, `loading="eager"`,
  `fetchpriority="high"`.

### 7.2 `scripts/prepare-images.mjs` (run once before first build)

The hero originals are raw camera files up to 41 MB. Sharp them down ONCE so builds
stay fast:

- Read `source-assets/hero-desktop/*.jpg` → write `src/assets/hero/desktop/` at max
  width 2560px, JPEG quality 80, stripped metadata.
- Read `source-assets/hero-mobile/*` (if present) → `src/assets/hero/mobile/` at max
  1280×1600, quality 80.
- Copy `source-assets/site-samples/` and `prototype-assets/` files that §6 uses into
  `src/assets/`, downscaling anything wider than 2000px.
- Idempotent; add as `npm run prepare-images`; document in README.

### 7.3 Hero art direction (the two-sets-of-seven requirement)

Each slide renders a `<picture>`:

```html
<picture>
  <source media="(max-width: 760px)" ...AVIF/WebP srcsets from imageMobile... />
  <source ...AVIF/WebP srcsets from imageDesktop... />
  <img src=...desktop jpeg fallback... alt={title} />
</picture>
```

- Desktop variant widths: `[1280, 1920, 2560]`. Mobile: `[640, 960, 1280]`.
- Use `getImage()` in frontmatter to build both source sets from the two originals.
- **Fallback rule:** if a slide has no `imageMobile` (folder may be empty at build
  time), use the desktop original for the mobile `<source>` too, cropped to 4:5 via
  the pipeline (or `object-fit: cover` + `object-position` from `position`). The
  build must succeed with zero mobile images present. The CMS exposes the mobile
  image as an optional upload per slide.
- Slide 1's desktop AND mobile first-variant get `<link rel="preload" as="image">`
  with matching `media` attributes in the page head. (v4 bug: it preloaded an image
  the slider never used.)
- The slider uses real `<img>` elements (not CSS background-image) so the pipeline
  and preload work.

### 7.4 Portrait image

The v4 About portrait hotlinks `imaginephotojournalists.com/.../purushottam-diwakar.png`.
Attempt to download it once during your build session into `src/assets/about/portrait.png`.
If the download fails, use `prototype-assets/hero-2025.png` as a stand-in and note
it in README under "pending assets".

---

## 8. Page specs & acceptance criteria

### 8.0 Nav (all pages)

Port v4's two-state nav: transparent with cream text while over the home hero
(`.over-hero`), switching to solid parchment + blur + bottom hairline after
scrolling past it (`.solid`). Non-home routes always use the solid state. Active
route underlined in sand. Mobile: hamburger per §9.5.

### 8.1 Home (`/`)

- HeroSlider (§8.6) with the 7 slides.
- Intro grid: bio paragraphs + StatCounter block (counts animate on scroll into
  view, once).
- "Selected Frames": the `featured: true` work entries, linking to their
  `/work/[slug]/` pages.
- Dust-mote canvas overlay (port from v4), respecting reduced-motion.

### 8.2 Listing pages (`/work/`, `/stories/`, `/thoughts/`)

- Work: v4 grid (`auto-fill, minmax(280px, 1fr)`), image cards with grain/veil
  hover, placeholder gradient cards (v4 `palettes` array) for image-less items.
  Sorted year desc. **Every card is an `<a>` to its detail page.**
- Stories: v4 `story-block` layout (date, title, body excerpt, pull quote, mood
  tint). Each block links to its detail page. Body shows first ~200 chars of the
  markdown + "Read the story →".
- Thoughts: same pattern with v4 `thought-block` styling.
- Fade-up reveal on scroll (one shared IntersectionObserver per page, not one per
  element as v4 did).

### 8.3 Detail pages (`/work/[slug]/`, `/stories/[slug]/`, `/thoughts/[slug]/`)

Shared `DetailLayout.astro`:

- Breadcrumb (`Work / Drought Chronicles — Jaisalmer`).
- Large photo at top (art-directed sizes per §7.1); work items without an image get
  the gradient placeholder treatment instead.
- Metadata strip: location · year (· caption for work).
- Markdown body, max-width ~68ch, v4 typography.
- Pull quote styled as v4 `.s-quote` when present.
- Prev/next navigation at the bottom (within the same collection, year order),
  styled like v4 nav arrows.
- `og:title`, `og:description` (excerpt), `og:image` (the photo).

### 8.4 About (`/about/`) and Connect (`/connect/`)

Port v4 sections 1:1 (about-wrap, Imagine society dark panel, press strip,
contact sky canvas, social buttons). Press-strip images open in the Lightbox.

### 8.5 404

Branded: parchment background, "Frame not found", link home.

### 8.6 HeroSlider component — behavior spec

Port v4 behavior WITH these fixes (v4 bugs are listed in §10; do not reproduce them):

- Autoplay 5.5s, progress bar, letterbox bars animation, Ken Burns, counter
  (`01 / 07`), dots, prev/next arrows, touch swipe.
- **Every** navigation path (dots included) reschedules autoplay via one shared
  `scheduleAuto()`.
- Keyboard arrows bound to the slider only when the hero is in/near the viewport
  (check via IntersectionObserver), never globally across pages.
- Hover pauses autoplay AND freezes the progress bar at its current width; resume
  continues rather than restarting (track elapsed time).
- Tab-hidden safety: pause timers on `visibilitychange`.
- Reduced motion: crossfade only, no Ken Burns/parallax; autoplay still works.
- Dots/arrows are real `<button>`s with `aria-label`s; slider region has
  `aria-roledescription="carousel"`.

### 8.7 Lightbox

Port v4 lightbox (open from work cards with images, imagine/press images). Scope:
items collected **per page**, in DOM order — it must never cycle into images from
other routes. Esc/arrows/swipe/backdrop-click. Focus is trapped while open and
returns to the trigger on close.

---

## 9. Sveltia CMS (`public/admin/`)

`index.html` loads Sveltia from CDN:

```html
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
```

`config.yml`:

- `backend: { name: github, repo: OWNER/REPO, branch: main }` — leave
  `OWNER/REPO` as a literal placeholder; README explains how to fill it in.
- `media_folder: src/assets/uploads`, `public_folder: src/assets/uploads`.
- Collections mirroring §5 exactly:
  - **hero** (folder `src/content/hero`, yaml) — all fields incl. optional mobile
    image upload, tone select, order.
  - **work** (folder `src/content/work`) — fields per schema + markdown body.
  - **stories** / **thoughts** — same pattern; `mood` as optional select; `draft`
    toggle labeled "Hide from site".
- Editorial workflow off (direct commit) — simplest for one non-technical editor.

---

## 9.5 Mobile optimization — first-class requirement

The majority of this site's audience will view it on phones. Mobile is not a
breakpoint afterthought; verify each of these explicitly:

- **No horizontal scroll at any width from 320px up.** Test 320 / 360 / 390 / 412.
- Hero serves the mobile image set (≤760px sources) — phones must never download a
  desktop 2560px variant. The mobile hero text layout follows v4's ≤600px rules
  (smaller title, hidden side arrows, swipe + dots as primary navigation).
- All tap targets ≥ 44×44px (dots, nav links, lightbox controls, prev/next).
- Custom cursor, dust canvas, and hover-dependent reveals are fully disabled on
  `pointer:coarse` — and every piece of information shown on hover (e.g. card
  "View Frame" labels) must be visible or reachable without hover on touch.
- Mobile nav: the v4 hamburger pattern, but closing on outside-tap and Esc, with
  `aria-expanded` on the toggle.
- Below-the-fold images `loading="lazy"` + `decoding="async"`; listing pages must
  not load detail-size images.
- Font loading: `font-display: swap` (fontsource default) — no invisible text.
- Total JS shipped to a listing page < 30 KB gzipped (no framework makes this easy).
- Lighthouse **mobile** preset (not desktop): Performance ≥ 85, Accessibility ≥ 95
  on `/`, one listing, one detail page. The hero slider is the main perf risk —
  only the active + next slide images may load eagerly; later slides lazy-load.

---

## 10. v4 bugs — regression list (do NOT reproduce)

1. Dot-click kills autoplay (one-shot timer that never reschedules).
2. Global arrow-key listener drives the hidden hero from other pages.
3. `preload` pointed at `hero-2025.png`, which no slide uses.
4. ~110 MB of raw camera files served directly as slide backgrounds.
5. Lightbox collected `[data-lb]` items across hidden pages.
6. No history/back-button support, no shareable URLs (fake SPA).
7. Dead `#sky-c` canvas; duplicated `display` declarations.
8. `cursor:none` globally with no focus styles (keyboard users got nothing).
9. All page content built eagerly at startup, defeating its own lazy-build guards;
   one IntersectionObserver instantiated per element.
10. Hover "pause" restarted progress from zero.
11. Content year contradictions between duplicate story/thought entries.

---

## 11. README.md (write for the site owner / a junior dev)

1. The §6.4 content-verification warning, at the top.
2. Quickstart: `npm install`, `npm run prepare-images`, `npm run dev`,
   `npm run build`.
3. Deploy: push to GitHub → Cloudflare Pages (build `npm run build`, output
   `dist`) — and the Netlify equivalent.
4. CMS setup: fill `OWNER/REPO` in `public/admin/config.yml`; for Cloudflare
   hosting use Sveltia's GitHub auth (link a GitHub OAuth app or use
   sveltia-cms-auth worker — give the exact steps); editor logs in at `/admin/`.
5. How to add the 7 mobile hero photos later (drop into
   `source-assets/hero-mobile/` with matching names → rerun prepare-images, or
   upload per-slide via CMS).
6. Pending assets list (CDN portraits from §6.2, portrait from §7.4 if download
   failed).

---

## 12. Definition of done — verify ALL before finishing

- [ ] `npm run build` completes with zero errors/warnings.
- [ ] Every collection entry renders a detail page; spot-check 3 per collection.
- [ ] Hero shows mobile sources at ≤760px, desktop above (check generated HTML).
- [ ] First slide preloaded; no reference to unused images in `<head>`.
- [ ] No file in `dist/` over 500 KB (`find`/PowerShell check — fonts and images).
- [ ] Slider: dot-click → autoplay continues; arrows; swipe; hover pause/resume.
- [ ] Lightbox: per-page scope, Esc closes, focus returns to trigger.
- [ ] Keyboard-only pass: tab order sane, focus visible, slider & lightbox operable.
- [ ] `prefers-reduced-motion`: no Ken Burns/dust/cursor-trail; site fully usable.
- [ ] Each route has unique title/description/OG tags; sitemap generated
      (`@astrojs/sitemap`).
- [ ] Lighthouse (or equivalent reasoning pass) targets: Performance ≥ 90,
      Accessibility ≥ 95, SEO ≥ 95 on `/` and one detail page.
- [ ] README complete per §11.
- [ ] `public/_headers` present (Cloudflare/Netlify format) setting:
      `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
      `Referrer-Policy: strict-origin-when-cross-origin`,
      `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and a
      Content-Security-Policy allowing only self + unpkg.com (Sveltia script on
      /admin/ only — scope the CSP per-path so the main site allows self only).

Suggested build order: scaffold + tokens → prepare-images script → content schemas →
content migration → Base layout/Nav/Footer → listing pages → detail pages → hero
slider → lightbox/cursor/canvases → CMS config → README → DoD pass.
