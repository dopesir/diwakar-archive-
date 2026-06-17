import { getEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

/**
 * Loaders + resolvers for the CMS singletons (src/content/settings/*.yaml).
 * Each getter returns a fully-defaulted object so callers never have to guard
 * against a missing file or field — the design can't break from absent data.
 */

export interface SocialLink {
  url: string;
  label: string;
}

export interface SiteSettings {
  seo: {
    defaultDescription: string;
    ogSiteName: string;
    shareImage?: ImageMetadata;
  };
  analytics: { scriptUrl: string; siteId: string };
  contact: { email: string; phone: string };
  social: { instagram: SocialLink; linkedin: SocialLink; getty: SocialLink };
  announcement: { enabled: boolean; text: string; link: string; linkLabel: string };
  connect: { eyebrow: string; heading: string; body: string; note: string };
  appearance: { accent: string; scrim: string };
  languages: { showSwitcher: boolean };
}

/**
 * Constrained theme tokens (Tier 3B). Accent is a preset from the on-brand ochre
 * family (all dark enough to keep text contrast on parchment); scrim strength
 * tunes the hero overlay + image brightness. `medium`/`ochre` reproduce the
 * current design exactly, so the default emits NO override style at all.
 */
const ACCENT_HEX: Record<string, string> = {
  ochre: '#b4511a', // current default
  terracotta: '#a8431a',
  rust: '#8a3c12',
  clay: '#9c4214',
};
const SCRIM_VARS: Record<string, string> = {
  soft: '--scrim-strength:0.7;--hero-img-bright:1;',
  medium: '', // current defaults (no override)
  strong: '--scrim-strength:1;--hero-img-bright:0.82;',
};

/** Inline CSS-custom-property string for <html>; '' when everything is default. */
export function themeStyle(appearance: { accent: string; scrim: string }): string {
  let s = '';
  if (appearance.accent && appearance.accent !== 'ochre' && ACCENT_HEX[appearance.accent]) {
    s += `--ochre:${ACCENT_HEX[appearance.accent]};`;
  }
  s += SCRIM_VARS[appearance.scrim] ?? '';
  return s;
}

const DEFAULT_CONNECT = {
  eyebrow: 'Connect & Collaborate',
  heading: 'Find the work online.',
  body:
    'For exhibitions, editorial licensing, collaborations, or limited edition prints. ' +
    'Over 1,300 images available on Getty Images for immediate licensing.',
  note: 'Representation by invitation only · India Today Group',
};

const DEFAULT_DESCRIPTION =
  'Purushottam Diwakar — 27 years of photojournalism with the India Today Group. ' +
  'A silent observer and visual archivist of the un-staged truth of India.';
const DEFAULT_SITE_NAME = 'Purushottam Diwakar — Legacy Archive';

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() !== '' ? v : fallback;

export async function getSiteSettings(): Promise<SiteSettings> {
  const entry = await getEntry('settings', 'site');
  const d = (entry?.data ?? {}) as Record<string, any>;

  return {
    seo: {
      defaultDescription: str(d.seo?.defaultDescription, DEFAULT_DESCRIPTION),
      ogSiteName: str(d.seo?.ogSiteName, DEFAULT_SITE_NAME),
      shareImage: d.seo?.shareImage as ImageMetadata | undefined,
    },
    analytics: {
      scriptUrl: str(d.analytics?.scriptUrl),
      siteId: str(d.analytics?.siteId),
    },
    contact: {
      email: str(d.contact?.email),
      phone: str(d.contact?.phone),
    },
    social: {
      instagram: {
        url: str(d.social?.instagramUrl, 'https://www.instagram.com/lifeonimage/'),
        label: str(d.social?.instagramLabel, '@lifeonimage'),
      },
      linkedin: {
        url: str(d.social?.linkedinUrl, 'https://in.linkedin.com/in/purushottam-diwakar-1a9536271'),
        label: str(d.social?.linkedinLabel, 'LinkedIn'),
      },
      getty: {
        url: str(d.social?.gettyUrl, 'https://www.gettyimages.com/photos/by-purushottam-diwakar'),
        label: str(d.social?.gettyLabel, 'Getty Images · 1,308+'),
      },
    },
    announcement: {
      enabled: Boolean(d.announcement?.enabled),
      text: str(d.announcement?.text),
      link: str(d.announcement?.link),
      linkLabel: str(d.announcement?.linkLabel),
    },
    connect: {
      eyebrow: str(d.connect?.eyebrow, DEFAULT_CONNECT.eyebrow),
      heading: str(d.connect?.heading, DEFAULT_CONNECT.heading),
      body: str(d.connect?.body, DEFAULT_CONNECT.body),
      note: str(d.connect?.note, DEFAULT_CONNECT.note),
    },
    appearance: {
      accent: str(d.appearance?.accent, 'ochre'),
      scrim: str(d.appearance?.scrim, 'medium'),
    },
    // Hidden by default: the EN/हिं switcher only appears once the client turns
    // it on (i.e. once Hindi content is actually being written), so it never
    // looks broken showing English fallback.
    languages: {
      showSwitcher: Boolean(d.languages?.showSwitcher),
    },
  };
}

/**
 * About biography blocks (about.yaml, Tier 3A). Returns the optional block list;
 * empty means the coded prose in about.astro renders unchanged.
 */
export async function getAboutBlocks(): Promise<any[]> {
  const entry = await getEntry('settings', 'about');
  const blocks = (entry?.data as any)?.aboutBlocks;
  return Array.isArray(blocks) ? blocks : [];
}

/**
 * Home-page section meta (sections.yaml): editable copy + show/hide + order.
 * Markup stays in code (index.astro); only copy/visibility/order is data here.
 */
export interface StatItem {
  value: string;
  suffix: string;
  label: string;
}

export interface SectionSettings {
  hero: { visible: boolean };
  intro: {
    visible: boolean;
    order: number;
    eyebrow: string;
    paragraphs: string[];
    signature: string;
  };
  stats: { visible: boolean; items: StatItem[] };
  featured: { visible: boolean; order: number; heading: string; intro: string };
}

const DEFAULT_INTRO_PARAGRAPHS = [
  'Purushottam Diwakar has been a quiet witness to the Indian subcontinent for over 27 years. ' +
    'Senior Photojournalist with the India Today Group since 1998, his work appears on the ' +
    'magazine’s cover and in international publications worldwide.',
  'His work spans drought chronicles, tribal ceremonies, political upheaval, and the quiet ' +
    'dignities of daily desert life. He has photographed four continents and contributed over ' +
    '1,300 images to Getty Images.',
];
const DEFAULT_STATS: StatItem[] = [
  { value: '27', suffix: '+', label: 'Years in the Field' },
  { value: '1308', suffix: '+', label: 'Getty Stock Photos' },
  { value: '4', suffix: '', label: 'Continents Covered' },
  { value: '∞', suffix: '', label: 'Untold Moments' },
];

const bool = (v: unknown, fallback = true): boolean => (typeof v === 'boolean' ? v : fallback);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' ? v : fallback);

export async function getSectionSettings(): Promise<SectionSettings> {
  const entry = await getEntry('settings', 'sections');
  const d = (entry?.data ?? {}) as Record<string, any>;

  const introParas = Array.isArray(d.intro?.paragraphs)
    ? d.intro.paragraphs.filter((p: unknown) => typeof p === 'string' && p.trim() !== '')
    : [];
  const statItems = Array.isArray(d.stats?.items)
    ? d.stats.items
        .filter((s: any) => s && typeof s.value === 'string' && typeof s.label === 'string')
        .map((s: any) => ({ value: s.value, suffix: str(s.suffix), label: s.label }))
    : [];

  return {
    hero: { visible: bool(d.hero?.visible) },
    intro: {
      visible: bool(d.intro?.visible),
      order: num(d.intro?.order, 1),
      eyebrow: str(d.intro?.eyebrow, 'The Eye Behind the Frame'),
      paragraphs: introParas.length ? introParas : DEFAULT_INTRO_PARAGRAPHS,
      signature: str(d.intro?.signature, 'Witness · Humanist · Archivist'),
    },
    stats: {
      visible: bool(d.stats?.visible),
      items: statItems.length ? statItems : DEFAULT_STATS,
    },
    featured: {
      visible: bool(d.featured?.visible),
      order: num(d.featured?.order, 2),
      heading: str(d.featured?.heading, 'Selected Frames'),
      intro: str(d.featured?.intro),
    },
  };
}
