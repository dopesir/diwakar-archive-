import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections (§5). Images referenced in frontmatter use the `image()`
 * schema helper so they run through Astro's asset pipeline. `draft: true`
 * entries are filtered out at build time — that is the CMS "unpublish" switch.
 */

const hero = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/hero' }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int().min(1).max(7), // 1..7
      location: z.string(), // "Jaipur"
      title: z.string(), // caption line
      imageDesktop: image(), // landscape original
      imageMobile: image().optional(), // portrait original; fallback rule §7.3
      position: z.string().default('center'), // CSS object-position for desktop
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
      caption: z.string().optional(), // lightbox / detail caption
      featured: z.boolean().default(false), // shows in home "Selected Frames"
      draft: z.boolean().default(false),
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
    quote: z.string().optional(), // pull quote
    mood: z.enum(['drought', 'night', 'water']).optional(),
    draft: z.boolean().default(false),
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

export const collections = { hero, work, stories, thoughts, magazines };
