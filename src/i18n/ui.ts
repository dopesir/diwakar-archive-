/**
 * UI string dictionary (Tier 3C). English is complete; Hindi is partially
 * seeded and CMS/translation-fillable later. `t()` always falls back to English
 * so a missing Hindi string never renders blank.
 *
 * Content (work/story/thought titles, bodies, captions, section copy) is NOT in
 * here — that lives in the collections/singletons and falls back to English via
 * Astro's i18n `fallbackType: 'rewrite'` until Hindi entries are authored.
 */
export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const languageNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
};

/** Short label for the language switcher control. */
export const languageShort: Record<Locale, string> = {
  en: 'EN',
  hi: 'हिं',
};

const ui = {
  en: {
    'lang.switch': 'Change language',
  },
  hi: {
    // Hindi UI strings go here over time; anything missing falls back to English.
    'lang.switch': 'भाषा बदलें',
  },
} satisfies Record<Locale, Record<string, string>>;

type UIKey = keyof (typeof ui)['en'];

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'hi';
}

/** Resolve the active locale from Astro.currentLocale (defaults to English). */
export function resolveLocale(current: string | undefined): Locale {
  return isLocale(current) ? current : defaultLocale;
}

/** Translate a UI key for a locale, falling back to English. */
export function t(locale: Locale, key: UIKey): string {
  return ui[locale]?.[key] ?? ui.en[key];
}
