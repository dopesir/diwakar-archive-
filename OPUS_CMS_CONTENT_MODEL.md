# OPUS CMS — Portfolio (Diwakar Archive) content model (companion to OPUS_CMS_SPEC.md)

Site-specific details. Read OPUS_CMS_SPEC.md first.

## Existing collections (extend, don't recreate)
hero (hero slides), work, stories, thoughts, magazines (flipbook strip on About).
All have icons/hints already. Add the new Tier fields to these.

## Tier 1B — sections to make editable (copy + visible + order)
Home (`src/pages/index.astro`) sections, extract their hardcoded copy:
- HeroSlider — managed by the `hero` collection (slides). Leave as-is; optionally
  expose a `visible` for the whole block.
- `intro-grid` section — the statement/eyebrow/heading/body copy near the top.
- StatCounter — the stat figures + labels (e.g. years, assignments, images on
  Getty). Make the numbers + labels editable (a small `stats` object/collection).
- `featured` section ("Selected Frames") — eyebrow/heading + which work items
  show (already driven by work `featured`); expose its heading/intro + `visible`.
Other pages with hardcoded section copy to expose: About (bio headings/paragraphs
are long-form — candidate for Tier 3A blocks), Connect / ConnectCta copy
("Find the work online", body, "Representation by invitation only" note), the
Work/Stories/Thoughts listing intros.

Implement section meta as a `sections` files-singleton (object per section:
heading/eyebrow/intro/visible/order). index.astro renders by `order`, skipping
`visible:false`. MARKUP STAYS IN CODE. The art-directed hero slider's two-sets-
of-seven structure is locked.

## Tier 1A — Site Settings
New `site` singleton: SEO defaults, share image, analytics id, contact
(email), social links (Instagram @lifeonimage, LinkedIn, Getty 1,300+ — these
currently live in SocialLinks.astro / ConnectCta; source them from settings so
the BODY usages update, but the footer's own copy stays code per rule 1),
announcement bar.

## Tier 2A — Redirects
No legacy site to migrate (new domain), so seed empty; keep the collection so the
client can add redirects later (e.g. vanity URLs). Still generate `_redirects`.

## Tier 2B — Media metadata (important here)
This is a photography portfolio — image quality/cropping matters most:
- hero slides: `alt` + `focalPoint` (the slider already uses object-position;
  drive it from CMS) for BOTH desktop and mobile art-directed images.
- work/stories/thoughts: `alt` + lightbox `caption`.

## Tier 2D — Forms
No public form (Connect = links). Expose the Connect/ConnectCta copy via Site
Settings instead of a form.

## Tier 3A — Flexible blocks
Best fit: the About page biography (currently long hardcoded prose) and the
story/thought bodies. Let the client compose these from richText/image/quote/
gallery/cta blocks rendered with the existing cinematic styles (pull-quote
component, image-with-caption, etc.). Do NOT block-ify the home hero or the
art-directed sections.

## Tier 3B — theme tokens
Accent select from the ochre family only (--ochre #b4511a, --ochre2 #d97a2b,
--sand #d4a96a are the on-brand options). Scrim/overlay strength select drives
the hero/nav scrim. Map to the existing CSS custom properties in :root
(global.css already defines them). Defaults = current values exactly.

## Tier 3C — i18n
English fully populated. Hindi fallback-to-English. Translatable: section copy,
settings copy, work/story/thought titles + bodies + captions, About bio.
Photo file names/assets are locale-agnostic. No empty Hindi 404s — fallback.

## Tier 3D — layout & alignment (which grids, which collections)
- **Grids that get per-listing layout controls** (columns/gap/aspect/imageFit/
  sort): the Work listing (`/work/`, ~52 items), Stories listing (`/stories/`),
  Thoughts listing (`/thoughts/`). The About press/magazine strip MAY get a
  lighter version (gap/columns) but its art-directed flip-badge cards keep their
  shape — don't force-distort the magazine covers.
- **Collections that get per-item `order` + `size`** (bento arrangement):
  `work`, `stories`, `thoughts`. Default `size: normal`, default `order` keeps
  the current year-desc sort; `size` only takes effect when that listing's
  `sort` is `manual`.
- **NOT subject to grid controls / locked layout:** the home HeroSlider
  (two-sets-of-seven art direction is locked), the home "Selected Frames"
  curated strip (keep its bespoke layout — at most expose its heading/intro/
  visible from Tier 1B), the Nav and Footer (rule 1).
- **Per-section layout** (align/width/spacing/background) applies to the home
  `intro-grid`, `featured` heading block, and the listing-page intros — i.e. the
  text sections, not the locked art-directed blocks. Background `ink` must flip
  text to the light treatment (see spec 3D legibility rule) — verify the
  parchment site's dark text never lands on a dark tone.
- Mobile: at the smallest breakpoint the grids must collapse to 1–2 columns and
  `wide`/`tall`/`large` items must fall back to a single cell. Test 4-col @320px.

## Reminders
- Header/Nav (`Nav.astro`) and Footer (`Footer.astro`) stay UNTOUCHED, code-only.
- Keep the custom cursor, lightbox, grain overlays, and ConnectCta-on-every-page
  behaviour intact.
- This site isn't deployed yet — before/at deploy, the same CSP inline-script
  check applies (no `is:inline` scripts; the loader/any startup script bundled).
