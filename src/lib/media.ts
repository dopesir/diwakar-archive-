/**
 * Media metadata helpers (Tier 2B). Maps the constrained `focalPoint` select
 * (content.config.ts) to a CSS `object-position`, used wherever an image is
 * cropped (work thumbnails, home "Selected Frames"). Returns `undefined` when
 * unset so the component falls back to its stylesheet default (center).
 */
export type FocalPoint =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const FOCAL_TO_POSITION: Record<FocalPoint, string> = {
  center: 'center center',
  top: 'center top',
  bottom: 'center bottom',
  left: 'left center',
  right: 'right center',
  'top-left': 'left top',
  'top-right': 'right top',
  'bottom-left': 'left bottom',
  'bottom-right': 'right bottom',
};

export function objectPosition(focal?: FocalPoint | string): string | undefined {
  if (!focal) return undefined;
  return FOCAL_TO_POSITION[focal as FocalPoint] ?? undefined;
}
