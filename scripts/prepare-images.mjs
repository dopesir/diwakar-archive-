#!/usr/bin/env node
/**
 * prepare-images.mjs — one-time (idempotent) image preparation.
 *
 * The hero originals are raw camera files up to ~41 MB. We downscale them ONCE
 * with sharp so Astro's build pipeline stays fast and the committed assets are
 * sane. Run via `npm run prepare-images`.
 *
 * Behaviour:
 *  - source-assets/hero-desktop/*.jpg  -> src/assets/hero/desktop/  (max 2560w, q80)
 *  - source-assets/hero-mobile/*       -> src/assets/hero/mobile/   (max 1280x1600, q80)
 *                                         (folder may be empty — that's fine, §7.3)
 *  - the specific site-samples / prototype-assets used by the content (§6) are
 *    copied into src/assets/{work,about}/ , downscaling anything wider than 2000px.
 *  - the About portrait is downloaded once; on failure we fall back to
 *    prototype-assets/hero-2025.png and print a PENDING-ASSET notice.
 *
 * Idempotent: a target is (re)built only when it is missing or older than its
 * source. Pass `--force` to rebuild everything.
 */

import sharp from 'sharp';
import { mkdir, readdir, stat, copyFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'source-assets');
const OUT = join(ROOT, 'src', 'assets');
const FORCE = process.argv.includes('--force');

const PORTRAIT_URL =
  'https://imaginephotojournalists.com/wp-content/uploads/purushottam-diwakar.png';

// allow sharp to chew through the big originals without bailing on "too large"
sharp.cache(false);
sharp.concurrency(1);

let built = 0;
let skipped = 0;
const notices = [];

/** True when dest is missing or older than src (or --force). */
async function stale(src, dest) {
  if (FORCE) return true;
  if (!existsSync(dest)) return true;
  const [s, d] = await Promise.all([stat(src), stat(dest)]);
  return s.mtimeMs > d.mtimeMs;
}

/** Downscale one image into dest, preserving format (png stays png for alpha). */
async function downscale(src, dest, { maxW, maxH, quality }) {
  await mkdir(dirname(dest), { recursive: true });
  if (!(await stale(src, dest))) {
    skipped++;
    return;
  }
  const ext = extname(dest).toLowerCase();
  let img = sharp(src, { limitInputPixels: false }).rotate(); // honour EXIF, then strip
  img = img.resize({
    width: maxW,
    height: maxH,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (ext === '.png') {
    img = img.png({ quality, compressionLevel: 9, palette: true });
  } else {
    img = img.jpeg({ quality, mozjpeg: true });
  }
  await img.toFile(dest); // sharp strips metadata by default
  built++;
  const kb = Math.round((await stat(dest)).size / 1024);
  console.log(`  ✓ ${basename(dest).padEnd(42)} ${String(kb).padStart(5)} KB`);
}

/** Process every file in a source dir into an output dir. */
async function processDir(srcDir, outDir, opts) {
  if (!existsSync(srcDir)) return;
  const files = (await readdir(srcDir)).filter((f) =>
    /\.(jpe?g|png)$/i.test(f),
  );
  for (const f of files) {
    await downscale(join(srcDir, f), join(outDir, f), opts);
  }
}

async function main() {
  // NOTE: capped at 1800px / q74 (not the 2560/q80 in spec §7.2) because Astro
  // emits each source's original into dist, and the §1 hard cap is "no dist file
  // > 500 KB". The high-entropy desert originals would blow past that at 2560.
  console.log('› hero desktop  (max 1800w, q74)');
  await processDir(join(SRC, 'hero-desktop'), join(OUT, 'hero', 'desktop'), {
    maxW: 1800,
    quality: 74,
  });

  console.log('› hero mobile   (max 1280×1600, q80)');
  const mobSrc = join(SRC, 'hero-mobile');
  const mobFiles = existsSync(mobSrc)
    ? (await readdir(mobSrc)).filter((f) => /\.(jpe?g|png)$/i.test(f))
    : [];
  if (mobFiles.length === 0) {
    notices.push(
      'No mobile hero photos found in source-assets/hero-mobile/ — the build ' +
        'falls back to cropped desktop images. Add them later and re-run.',
    );
    console.log('  (none present — desktop fallback will be used)');
  } else {
    await processDir(mobSrc, join(OUT, 'hero', 'mobile'), {
      maxW: 1280,
      maxH: 1600,
      quality: 80,
    });
  }

  // Only the assets the content (§6) actually references get copied in.
  console.log('› work images   (max 1600w, q80)');
  const work = [
    ['site-samples/slide-1.jpg', 'work/slide-1.jpg'],
    ['site-samples/slide-2.jpg', 'work/slide-2.jpg'],
    ['site-samples/web-banner-2025.png', 'work/web-banner-2025.png'],
    ['prototype-assets/magazine-cover.png', 'work/magazine-cover.jpg'], // photo → jpg (<500 KB)
    ['site-samples/AFMJ0323-1030x687.png', 'work/afmj-recognition-2023.png'],
  ];
  for (const [s, d] of work) {
    await downscale(join(SRC, s), join(OUT, d), { maxW: 1600, quality: 80 });
  }

  console.log('› about images  (max 1600w, q80)');
  const about = [
    ['site-samples/Imagine-logo.png', 'about/imagine-logo.png'],
    [
      'site-samples/imagine-photojournalist-society1-495x400.png',
      'about/imagine-society.png',
    ],
    ['prototype-assets/opening-ceremony.jpg', 'about/opening-ceremony.jpg'],
    ['prototype-assets/seminar-stage.png', 'about/seminar-stage.png'],
    ['site-samples/jeene-ka-andaaz-15-jun-2025.png', 'about/press-jeene-ka-andaaz.jpg'], // photo → jpg
    ['prototype-assets/press-clip.png', 'about/press-clip.png'],
    ['site-samples/about-1.png', 'about/field-work.png'],
  ];
  for (const [s, d] of about) {
    await downscale(join(SRC, s), join(OUT, d), { maxW: 1600, quality: 80 });
  }

  // Portrait — download once, else fall back to the prototype hero image.
  console.log('› about portrait (download attempt)');
  const portraitDest = join(OUT, 'about', 'portrait.png');
  if (!FORCE && existsSync(portraitDest)) {
    skipped++;
    console.log('  (already present — skipping)');
  } else {
    await mkdir(dirname(portraitDest), { recursive: true });
    let ok = false;
    try {
      const res = await fetch(PORTRAIT_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (prepare-images)' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf, { limitInputPixels: false })
        .resize({ width: 1400, height: 1800, fit: 'inside', withoutEnlargement: true })
        .png({ quality: 84, compressionLevel: 9 })
        .toFile(portraitDest);
      built++;
      ok = true;
      console.log('  ✓ portrait.png downloaded');
    } catch (err) {
      console.log('  ✗ download failed (' + err.message + ') — using fallback');
    }
    if (!ok) {
      await sharp(join(SRC, 'prototype-assets', 'hero-2025.png'), {
        limitInputPixels: false,
      })
        .resize({ width: 1400, height: 1800, fit: 'inside', withoutEnlargement: true })
        .png({ quality: 84, compressionLevel: 9 })
        .toFile(portraitDest);
      built++;
      notices.push(
        'About portrait download FAILED — portrait.png is a stand-in ' +
          '(prototype-assets/hero-2025.png). Replace via the CMS or re-run ' +
          'prepare-images when online. (PENDING ASSET, README §6.)',
      );
    }
  }

  console.log(`\nDone. ${built} built, ${skipped} up-to-date.`);
  if (notices.length) {
    console.log('\nNOTICES:');
    for (const n of notices) console.log('  • ' + n);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
