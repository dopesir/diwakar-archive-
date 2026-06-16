/**
 * Publish gate (Tier 2C). An entry is live only when it is not a draft AND its
 * optional `publishDate` is not in the future at build time — the same
 * build-time exclusion mechanism as `draft`.
 *
 * Because the site is statically built, a future-dated entry only appears after
 * the next build. Schedule a periodic rebuild (e.g. a daily Cloudflare deploy
 * hook / cron) for scheduled posts to go live automatically. See README.
 */
export interface Publishable {
  draft?: boolean;
  publishDate?: Date | string | null;
}

export function isPublished(data: Publishable, now: Date = new Date()): boolean {
  if (data.draft) return false;
  if (data.publishDate) {
    const when = data.publishDate instanceof Date ? data.publishDate : new Date(data.publishDate);
    if (!Number.isNaN(when.getTime()) && when.getTime() > now.getTime()) return false;
  }
  return true;
}
