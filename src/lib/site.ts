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
}

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
  };
}
