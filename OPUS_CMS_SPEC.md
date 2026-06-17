# OPUS CMS SPEC — Industry-grade editorial control (layout + header/footer LOCKED)

Mission: make nearly everything on the site client-editable through Sveltia CMS
— global site settings, section copy, per-page SEO, redirects, media metadata,
drafts & scheduling, editable form options, flexible content blocks, constrained
theme tokens, and Hindi/English (i18n) — so the client can run the entire site
without a developer, and can **never break the design**.

This is a large build. Read this whole spec AND the companion
`OPUS_CMS_CONTENT_MODEL.md` (in this same folder — it lists this site's exact
hardcoded copy to extract, collections to extend, and section IDs) before
writing code. Do not ask the user questions.

## Non-negotiable rules

1. **The page SKELETON and the HEADER (nav) & FOOTER stay 100% in code.** Do NOT
   make the header, nav, footer, or their content CMS-editable (client decision).
   The set of sections that exist and their markup live in code. Everything else
   becomes editable — including, per Tier 3D, CONSTRAINED layout *modifiers*
   (alignment, width, spacing, grid columns, item order/size) that are
   data-driven via predefined tokens/classes. So: section/grid *structure* =
   code; section/grid *modifiers* = CMS selects. The header/footer are exempt
   from 3D entirely.
2. **Keep `npm run build` green at every commit.** Work tier by tier, commit
   after each, never leave a broken state. If a tier (especially i18n) gets
   risky, ship the earlier tiers first. (This site is deploy-ready/about to go
   live — treat it as production.)
3. **No visual redesign; current look is the default.** Reuse the existing
   v4-derived design tokens, components, and styles. Tier 3D adds OPT-IN layout
   options, but every control's DEFAULT must reproduce the current design
   exactly — an untouched site is byte-for-byte the client-approved cinematic
   look. New options only take effect when an editor deliberately changes them.
4. **Security stays intact:** strict CSP, NO inline scripts (an inline script
   blocked by CSP caused a stuck-loader bug on the companion site — keep ALL
   scripts bundled/external). The `/admin/` CSP must allow Sveltia's
   styles/fonts/images: `style-src 'self' 'unsafe-inline'`, `img-src 'self'
   data: blob: https://*.githubusercontent.com https://*.gravatar.com`,
   `font-src 'self' data:`. Verify by loading `/admin/` with zero console errors.
5. **Unbreakable by construction:** validation on every field, constrained inputs
   (selects, booleans, color presets) where design is at stake, singletons for
   global data, hints on every field, NO raw HTML/CSS fields for the client.
6. **Sveltia gotcha:** no global `public_folder`; every collection/file sets its
   own relative `media_folder`/`public_folder: ../../assets/uploads`.
7. All prior specs' definition-of-done must still pass (no regressions).

---

## TIER 1 — Foundations (highest impact)

### 1A. Site Settings (singleton)
A single CMS screen of global values (`files` singleton, icon `settings`),
driving things OTHER than header/footer:
- SEO defaults: default meta description, default social-share/OG image, OG
  `site_name`.
- Analytics: optional privacy-friendly analytics ID; render only if set, as a
  bundled/external script (never inline — CSP).
- Contact block: email, phone (shown in Connect/contact sections, NOT footer).
- Social links: Instagram, LinkedIn, Getty, etc. — used by the Connect page /
  ConnectCta body sections only (the footer's own links stay in code per rule 1).
- Announcement bar: `enabled` + `text` + optional `link`/`linkLabel`, as its own
  thin band component (NOT part of the locked header), dismissal in
  sessionStorage via a bundled script, reduced-motion aware.

Wire into existing components/pages, replacing hardcoded equivalents. Validate.

### 1B. Editable section copy + show/hide + reorder
Each fixed homepage/page SECTION keeps its locked layout but gains CMS-editable
text and `visible`/`order` controls (see content-model file for the list).
Pages render sections by `order`, skipping `visible:false`. STRUCTURE/markup
stays in code — only copy/visibility/order is data.

### 1C. Per-entry & per-page SEO
Optional SEO group on every entry and page: `seoTitle`, `seoDescription`,
`shareImage`, `noindex`. A shared `<SEO>` component resolves entry → Site
Settings default → fallback. Apply across all collections and standalone pages.

---

## TIER 2 — Professional polish

### 2A. Redirects manager
A `redirects` collection (`from`, `to`, `status` 301/302) → generate Cloudflare
`public/_redirects` at build. Validate paths/URLs.

### 2B. Media metadata
Every image widget gains `alt` (required for meaningful images), optional
`caption`, optional `focalPoint` (select → `object-position`). Components honour
them (especially hero slides, work, lightbox captions).

### 2C. Draft + scheduled publish
Keep `draft`; add optional `publishDate` (datetime); exclude future-dated entries
at build (same mechanism as draft). README notes scheduled publish needs a
scheduled rebuild to appear automatically.

### 2D. Editable form options
This site has no public form by default (Connect is links/social). If a contact
form is added later it follows this rule; for now, expose any hardcoded
Connect/CTA copy via Site Settings instead. (See content-model file.)

---

## TIER 3 — Advanced ("wow" layer)

### 3A. Flexible content blocks
A constrained page-builder for FREE-FORM body regions only (About body, story/
thought bodies, or a generic `pages` collection) — NOT the art-directed homepage
sections. A `blocks` list field (Sveltia `list` with variable types):
`richText`, `image` (alt/caption), `gallery`, `quote`, `cta`, `embed`
(whitelisted providers only). A `<BlockRenderer>` maps each to a styled existing
component. NO raw HTML block.

### 3B. Constrained theme tokens
Site Settings "Appearance": `accentColor` as a SELECT from a preset on-brand
palette (the ochre family — not a free picker), and an overlay/scrim strength
select. Map to CSS custom properties on `:root`. Cannot break the design. No
fonts/spacing/raw CSS exposure.

### 3C. Hindi / English (i18n) — build SAFELY
- Locale routing (`/` English default, `/hi/` Hindi) via Astro i18n; accessible
  bundled language switcher.
- Translatable text fields (Sveltia i18n or paired locale files — content-model
  file specifies). UI strings from a small `ui.en`/`ui.hi` dictionary.
- English fully populated; Hindi starts EMPTY, CMS-fillable, and FALLS BACK to
  English (never a blank/broken Hindi page). English site must be byte-identical
  in behaviour to pre-i18n.
- If i18n threatens stability, ship infra + switcher + fallback with English
  only; note Hindi as CMS-fillable in README. Don't break the site for it.

### 3D. Layout & alignment controls (client-requested — comprehensive but CONSTRAINED)
The client wants to align/arrange sections, the work grid (~52 items), and any
listing "as they want." Deliver this as CONSTRAINED choices only — every option
is a `select`/`number`/`boolean` mapped to a predefined design token or utility
class. **NEVER expose raw CSS, pixel values, or a free style field.** Any
combination of options must still look designed (this is what keeps rule 5's
"unbreakable" guarantee true).

1. **Per-section layout** (extend the sections singleton from Tier 1B): add
   `align` (left|center|right), `width` (narrow|normal|wide|full), `spacing`
   (compact|normal|spacious), `background` (none|parchment|ink|sand — from the
   palette only). Map each to existing/utility classes; the section MARKUP stays
   in code, only these data-driven modifiers change.
   **Legibility is mandatory:** each `background` tone carries its OWN matched
   text/treatment so contrast always passes — e.g. `ink` (dark) auto-applies the
   light-text treatment, `parchment`/`sand` use the dark-text treatment. The
   client picks a tone, NOT colors; text color is never independently editable.
   No combination may produce low-contrast/unreadable text.

2. **Per-grid layout** for the collection listings (work, stories, thoughts,
   plus the About press strip / any grid): a layout settings object per listing
   (in a `layout` singleton or the sections file) with `columns`
   (2|3|4|auto), `gap` (tight|normal|roomy), `aspect` (square|portrait|
   landscape|original), `imageFit` (cover|contain), `sort`
   (newest|oldest|by-year|manual). Components read these and apply the matching
   classes. Defaults reproduce the CURRENT design exactly.

3. **Per-item arrangement** (the "arrange the 52 works as I want"): add to the
   work/stories/thoughts entry schema an optional `order` (number) and `size`
   (normal|large|wide|tall). When a listing's `sort` is `manual`, items render
   by `order`; `size` lets specific items span larger cells in a bento/masonry
   grid built from the existing card components. The grid must stay responsive
   (sizes degrade gracefully on mobile — e.g. `wide`/`tall` collapse to normal
   below the grid breakpoint) and never overflow.

4. Every new control: sensible default = the current look, so an untouched site
   is visually identical. Validate ranges. Mobile must never break regardless of
   chosen options (test extremes: 4 columns at 320px must reflow, full-bleed +
   spacious must not overflow).

---

## Build order & safety

Tier 1A→1B→1C, then 2A→2D, then 3A→3B→3C→3D, committing after each. After EVERY
tier: build green; load `/admin/` (local repo mode) zero console errors;
responsive sweep 320–1280 no overflow; grep confirms NO inline scripts and the
header/footer markup UNCHANGED. Match the existing professional CMS config
standard (icons, descriptions, hints, summaries, filters).

## Definition of done

- [ ] Build green; site visually identical (English) to pre-spec; cinematic
      design unchanged.
- [ ] Header & footer markup/content UNCHANGED and code-only.
- [ ] Site Settings drives SEO defaults, analytics, contact, socials,
      announcement bar — editable + validated.
- [ ] Every section: editable copy + show/hide + reorder, layout intact.
- [ ] Per-page/entry SEO everywhere with working fallback chain.
- [ ] Redirects → generated `_redirects`; media alt/caption/focal honoured;
      draft + scheduled publish work.
- [ ] Flexible blocks via approved components only; theme tokens constrained to
      presets; i18n English-complete with Hindi fallback, English site unchanged.
- [ ] Layout & alignment (3D): section align/width/spacing/background, grid
      columns/gap/aspect/fit/sort, and per-item order/size all work via
      constrained selects only (NO raw CSS); defaults reproduce the current
      design; mobile never overflows at any option combination.
- [ ] `/admin/` zero console errors; CMS quality bar met; no inline scripts;
      CSP intact.
- [ ] Logical commits per tier.
