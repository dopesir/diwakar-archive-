import { getEntry } from 'astro:content';

/**
 * Layout & alignment resolver (Tier 3D). Reads the `layout.yaml` singleton and
 * returns fully-defaulted layout objects. The attribute builders emit data-*
 * attributes ONLY for non-default values, so an untouched site renders no extra
 * attributes and stays byte-identical. Every value maps to a utility class in
 * global.css — there is no raw CSS or pixel input anywhere.
 */

export interface SectionLayout {
  align: string;
  width: string;
  spacing: string;
  background: string;
}
export interface GridLayout {
  columns: string;
  gap: string;
  aspect: string;
  imageFit: string;
  sort: string;
}
export interface ListLayout {
  columns: string;
  gap: string;
  sort: string;
}

const str = (v: unknown, fb: string): string => (typeof v === 'string' && v !== '' ? v : fb);

const mergeSection = (d: any = {}): SectionLayout => ({
  align: str(d?.align, 'left'),
  width: str(d?.width, 'normal'),
  spacing: str(d?.spacing, 'normal'),
  background: str(d?.background, 'none'),
});
const mergeWorkGrid = (d: any = {}): GridLayout => ({
  columns: str(d?.columns, 'auto'),
  gap: str(d?.gap, 'normal'),
  aspect: str(d?.aspect, 'landscape'),
  imageFit: str(d?.imageFit, 'cover'),
  sort: str(d?.sort, 'newest'),
});
const mergeList = (d: any = {}): ListLayout => ({
  columns: str(d?.columns, '1'),
  gap: str(d?.gap, 'normal'),
  sort: str(d?.sort, 'newest'),
});

export interface LayoutSettings {
  sections: Record<
    'intro' | 'featured' | 'workIntro' | 'storiesIntro' | 'thoughtsIntro',
    SectionLayout
  >;
  grids: { work: GridLayout; stories: ListLayout; thoughts: ListLayout };
}

export async function getLayoutSettings(): Promise<LayoutSettings> {
  const entry = await getEntry('settings', 'layout');
  const d = ((entry?.data as any)?.layout ?? {}) as any;
  const s = d.sections ?? {};
  const g = d.grids ?? {};
  return {
    sections: {
      intro: mergeSection(s.intro),
      featured: mergeSection(s.featured),
      workIntro: mergeSection(s.workIntro),
      storiesIntro: mergeSection(s.storiesIntro),
      thoughtsIntro: mergeSection(s.thoughtsIntro),
    },
    grids: {
      work: mergeWorkGrid(g.work),
      stories: mergeList(g.stories),
      thoughts: mergeList(g.thoughts),
    },
  };
}

// ── attribute builders (only non-defaults emitted) ──────────────────────────
export function sectionAttrs(s: SectionLayout): Record<string, string> {
  const a: Record<string, string> = {};
  if (s.align !== 'left') a['data-align'] = s.align;
  if (s.width !== 'normal') a['data-width'] = s.width;
  if (s.spacing !== 'normal') a['data-space'] = s.spacing;
  if (s.background !== 'none') a['data-bg'] = s.background;
  return a;
}
export function workGridAttrs(g: GridLayout): Record<string, string> {
  const a: Record<string, string> = {};
  if (g.columns !== 'auto') a['data-cols'] = g.columns;
  if (g.gap !== 'normal') a['data-gap'] = g.gap;
  if (g.aspect !== 'landscape') a['data-aspect'] = g.aspect;
  if (g.imageFit !== 'cover') a['data-fit'] = g.imageFit;
  return a;
}
export function listAttrs(g: ListLayout): Record<string, string> {
  const a: Record<string, string> = {};
  if (g.columns !== '1') a['data-listing-cols'] = g.columns;
  if (g.gap !== 'normal') a['data-listing-gap'] = g.gap;
  return a;
}
/** data-size for a card — only when the listing sort is manual. */
export function itemSize(size: string | undefined, sort: string): string | undefined {
  return sort === 'manual' && size && size !== 'normal' ? size : undefined;
}

// ── sorting (`newest` reproduces each listing's current order) ───────────────
interface Sortable {
  data: { year: number; title: string; order?: number };
}
export function sortEntries<T extends Sortable>(
  entries: T[],
  sort: string,
  titleTiebreak = false,
): T[] {
  const tb = (a: T, b: T) => (titleTiebreak ? a.data.title.localeCompare(b.data.title) : 0);
  const newest = (a: T, b: T) => b.data.year - a.data.year || tb(a, b);
  const arr = [...entries];
  switch (sort) {
    case 'oldest':
      return arr.sort((a, b) => a.data.year - b.data.year || tb(a, b));
    case 'by-year':
      return arr.sort((a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title));
    case 'manual':
      return arr.sort((a, b) => {
        const ao = a.data.order;
        const bo = b.data.order;
        const an = typeof ao === 'number';
        const bn = typeof bo === 'number';
        if (an && bn) return ao - bo;
        if (an) return -1;
        if (bn) return 1;
        return newest(a, b);
      });
    case 'newest':
    default:
      return arr.sort(newest);
  }
}
