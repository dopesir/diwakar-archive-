import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections (§5). Images referenced in frontmatter use the `image()`
 * schema helper so they run through Astro's asset pipeline. `draft: true`
 * entries are filtered out at build time — that is the CMS "unpublish" switch.
 */

/**
 * Flexible content blocks (Tier 3A). A constrained page-builder for FREE-FORM
 * body regions only (About bio + story/thought bodies) — never the art-directed
 * home sections. Each block is a constrained type rendered by an approved
 * component (src/components/blocks/*). There is deliberately NO raw-HTML block;
 * `richText` is a safe markdown subset rendered by src/lib/richtext.ts.
 */
const blocksField = ({ image }: SchemaContext) =>
  z
    .array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('richText'), markdown: z.string().default('') }),
        z.object({
          type: z.literal('image'),
          image: image(),
          alt: z.string().optional(),
          caption: z.string().optional(),
        }),
        z.object({
          type: z.literal('gallery'),
          columns: z.enum(['2', '3', '4']).default('3'),
          images: z
            .array(
              z.object({
                image: image(),
                alt: z.string().optional(),
                caption: z.string().optional(),
              }),
            )
            .default([]),
        }),
        z.object({ type: z.literal('quote'), text: z.string(), cite: z.string().optional() }),
        z.object({
          type: z.literal('cta'),
          heading: z.string().optional(),
          text: z.string().optional(),
          label: z.string(),
          href: z.string(),
        }),
        z.object({
          type: z.literal('embed'),
          provider: z.enum(['youtube', 'vimeo']),
          url: z.string(),
          title: z.string().optional(),
        }),
      ]),
    )
    .optional();

/**
 * Global Site Settings + Section meta (CMS Tier 1). Two singleton YAML files
 * live in src/content/settings/ — `site.yaml` (SEO defaults, analytics, contact,
 * socials, announcement bar) and `sections.yaml` (per-section copy + show/hide +
 * order). Every field is optional with a sensible fallback applied in code
 * (src/lib/site.ts) so a missing value can never break the build or the design.
 */
const settings = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      // ── site.yaml ────────────────────────────────────────────────
      seo: z
        .object({
          defaultDescription: z.string().optional(),
          ogSiteName: z.string().optional(),
          shareImage: image().optional(),
        })
        .optional(),
      analytics: z
        .object({
          scriptUrl: z.string().optional(), // external, bundled-friendly (never inline)
          siteId: z.string().optional(),
        })
        .optional(),
      contact: z
        .object({
          email: z.string().optional(),
          phone: z.string().optional(),
        })
        .optional(),
      social: z
        .object({
          instagramUrl: z.string().optional(),
          instagramLabel: z.string().optional(),
          linkedinUrl: z.string().optional(),
          linkedinLabel: z.string().optional(),
          gettyUrl: z.string().optional(),
          gettyLabel: z.string().optional(),
        })
        .optional(),
      announcement: z
        .object({
          enabled: z.boolean().default(false),
          text: z.string().optional(),
          link: z.string().optional(),
          linkLabel: z.string().optional(),
        })
        .optional(),
      connect: z
        .object({
          eyebrow: z.string().optional(),
          heading: z.string().optional(),
          body: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),
      // Constrained theme tokens (Tier 3B). Both are presets only — no raw
      // colour/CSS input. Defaults reproduce the current look exactly.
      appearance: z
        .object({
          accent: z.enum(['ochre', 'terracotta', 'rust', 'clay']).optional(),
          scrim: z.enum(['soft', 'medium', 'strong']).optional(),
        })
        .optional(),
      // ── sections.yaml ────────────────────────────────────────────
      hero: z.object({ visible: z.boolean().default(true) }).optional(),
      intro: z
        .object({
          visible: z.boolean().default(true),
          order: z.number().int().default(1),
          eyebrow: z.string().optional(),
          paragraphs: z.array(z.string()).optional(),
          signature: z.string().optional(),
        })
        .optional(),
      stats: z
        .object({
          visible: z.boolean().default(true),
          items: z
            .array(
              z.object({
                value: z.string(), // numeric strings animate; symbols (e.g. ∞) render as-is
                suffix: z.string().optional(),
                label: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
      featured: z
        .object({
          visible: z.boolean().default(true),
          order: z.number().int().default(2),
          heading: z.string().optional(),
          intro: z.string().optional(),
        })
        .optional(),
      // ── about.yaml (Tier 3A) ─────────────────────────────────────
      // Optional block-composed biography. Empty = the coded prose renders.
      aboutBlocks: blocksField({ image }),
    }),
});

/**
 * Optional per-entry SEO override group (Tier 1C). Every field is optional and
 * falls back through entry → Site Settings default → built-in fallback, resolved
 * by the shared <SEO> component, so leaving it blank is always safe.
 */
const seoFields = ({ image }: SchemaContext) =>
  z
    .object({
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      shareImage: image().optional(),
      noindex: z.boolean().default(false),
    })
    .optional();

/**
 * Redirects (Tier 2A). Each entry becomes one line in the generated
 * Cloudflare `_redirects` file (see src/pages/cf-redirects.txt.ts). Seeded empty —
 * this is a new domain — but kept so the client can add vanity/legacy URLs.
 */
const redirects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/redirects' }),
  schema: z.object({
    from: z.string().regex(/^\/\S*$/, 'Must be a site path starting with "/" (no spaces).'),
    to: z
      .string()
      .regex(/^(\/\S*|https?:\/\/\S+)$/, 'Must be a site path ("/…") or a full https:// URL.'),
    status: z
      .union([z.literal(301), z.literal(302)])
      .default(301), // 301 permanent, 302 temporary
  }),
});

/**
 * Media metadata (Tier 2B). `focalPoint` is a constrained select (design is at
 * stake when cropping) mapped to a CSS object-position by src/lib/media.ts.
 */
const focalPoint = z
  .enum([
    'center',
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ])
  .optional();

/**
 * Scheduled-publish date (Tier 2C). Accepts both an ISO string and a YAML-parsed
 * Date (an unquoted ISO timestamp in frontmatter becomes a Date), and treats a
 * blank value as unset. A future value hides the entry until the next build.
 */
const publishDate = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.coerce.date().optional(),
);

const hero = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/hero' }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int().min(1).max(7), // 1..7
      location: z.string(), // "Jaipur"
      title: z.string(), // caption line
      alt: z.string().optional(), // accessible description; falls back to title (2B)
      imageDesktop: image(), // landscape original
      imageMobile: image().optional(), // portrait original; fallback rule §7.3
      position: z.string().default('center'), // CSS object-position for desktop
      positionMobile: z.string().optional(), // CSS object-position for the mobile crop (2B)
      tone: z.enum(['dark', 'bright']), // picks scrim strength
    }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.number().int(),
      location: z.string().optional(),
      image: image().optional(), // optional — placeholder cards exist
      alt: z.string().optional(), // accessible description; falls back to caption/title (2B)
      caption: z.string().optional(), // lightbox / detail caption
      focalPoint, // which part stays visible when the thumbnail crops (2B)
      featured: z.boolean().default(false), // shows in home "Selected Frames"
      draft: z.boolean().default(false),
      publishDate, // future = hidden until next build (2C)
      seo: seoFields({ image }),
    }),
});

// stories & thoughts share one schema
const narrativeSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    date: z.string(), // "Jaisalmer · 2019" display string
    year: z.number().int(), // for sorting
    location: z.string(),
    image: image().optional(),
    alt: z.string().optional(), // accessible description; falls back to caption/title (2B)
    caption: z.string().optional(), // lightbox caption when the piece has a photo (2B)
    quote: z.string().optional(), // pull quote
    mood: z.enum(['drought', 'night', 'water']).optional(),
    draft: z.boolean().default(false),
    publishDate, // future = hidden until next build (2C)
    blocks: blocksField({ image }), // optional block body (3A); empty = markdown body renders
    seo: seoFields({ image }),
  });

// Magazines shown in the About page press strip; `link` opens the flipbook
// reader (site-relative /flipbook/<slug>/ or a full external URL).
const magazines = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/magazines' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // "Jeene Ka Andaaz — June 2026"
      badge: z.string(), // short label on the cover, e.g. "June 2026"
      cover: image(),
      link: z.string(), // flipbook reader URL
      order: z.number().int(),
      draft: z.boolean().default(false),
      publishDate, // future = hidden until next build (2C)
    }),
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: narrativeSchema,
});

const thoughts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/thoughts' }),
  schema: narrativeSchema,
});

export const collections = { settings, redirects, hero, work, stories, thoughts, magazines };
