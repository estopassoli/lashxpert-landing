#!/usr/bin/env node
'use strict';

// Re-encode the site's existing images; the original files are never modified.
// Run with Node.js and an existing Sharp installation, optionally supplying
// SHARP_MODULE=/absolute/path/to/sharp and --source-tags=/path/to/captured.json.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'media/web');
const manifestPath = path.join(outputDirectory, 'manifest.json');
const reportPath = process.env.IMAGE_MANIFEST || '/tmp/lashxpert-images.json';

function loadSharp() {
  const candidates = [
    process.env.SHARP_MODULE,
    'sharp',
  ].filter(Boolean);
  const errors = [];
  for (const candidate of candidates) {
    try { return require(candidate); } catch (error) { errors.push(`${candidate}: ${error.message}`); }
  }
  throw new Error(`Sharp is required to regenerate the image variants. Install it with npm install --save-dev sharp, or set SHARP_MODULE to the absolute path of an existing compatible Sharp installation.\n${errors.join('\n')}`);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
}

function sourcePath(value) {
  return './' + decodeURIComponent(value.split(/[?#]/, 1)[0]).replace(/^\.\//, '');
}

function roleFor(source, tag) {
  if (source.includes('lashxpert-logo-oficial')) return 'logo';
  if (source.includes('lashxpert-icon')) return 'favicon';
  if (tag.includes('hero-formation-photo')) return 'hero';
  if (tag.includes('paths-intro-photo')) return 'app-intro';
  if (source.includes('geovana-suporte')) return 'support';
  if (source.includes('lashx-premiacao')) return 'graduation';
  return 'card';
}

async function collectSources() {
  const sourceArgument = process.argv.find(value => value.startsWith('--source-tags='));
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const tags = sourceArgument
    ? (JSON.parse(await fs.readFile(sourceArgument.slice('--source-tags='.length), 'utf8'))).map(item => item.tag)
    : html.match(/<img\b[^>]*>/gi) || [];
  const originalTags = tags.filter(tag => !attribute(tag, 'src')?.includes('/web/'));
  if (!originalTags.length) {
    const previous = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    return previous.images.map(({ source, role, usageCount }) => ({ source, role, usageCount }));
  }
  const sources = new Map();
  for (const tag of originalTags) {
    const src = attribute(tag, 'src');
    if (!src || /^(https?:|data:)/i.test(src)) continue;
    const source = sourcePath(src);
    const item = sources.get(source) || { source, role: roleFor(source, tag), usageCount: 0 };
    item.usageCount += 1;
    sources.set(source, item);
  }
  const iconTag = (html.match(/<link\b[^>]*>/gi) || []).find(tag => attribute(tag, 'rel') === 'icon');
  const icon = iconTag && attribute(iconTag, 'href');
  if (icon && !icon.includes('/web/')) {
    const source = sourcePath(icon);
    sources.set(source, { source, role: 'favicon', usageCount: 1 });
  }
  return [...sources.values()];
}

const widthsByRole = {
  card: [320, 640, 960],
  hero: [640, 960, 1280],
  'app-intro': [480, 800, 1200],
  graduation: [640, 1280, 1920],
  support: [320, 640],
  logo: [512],
  favicon: [64],
};
const defaultWidthByRole = { card: 640, hero: 960, 'app-intro': 800, graduation: 1280, support: 640, logo: 512, favicon: 64 };

function outputStem(source, role) {
  const pieces = source.replace(/^\.\/media\//, '').replace(/\.[^.]+$/, '').split('/');
  if (pieces.length === 1) pieces.unshift(role);
  return pieces.join('-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
}

async function main() {
  const sources = await collectSources();
  const sharp = loadSharp();
  sharp.cache(false);
  sharp.concurrency(1);
  await fs.mkdir(outputDirectory, { recursive: true });
  const images = [];
  const usedNames = new Set();
  for (const item of sources) {
    const originalPath = path.resolve(root, item.source);
    if (!originalPath.startsWith(path.join(root, 'media') + path.sep)) throw new Error(`Invalid image path: ${item.source}`);
    const buffer = await fs.readFile(originalPath);
    const input = await sharp(buffer).metadata();
    const inputHasTransparency = input.hasAlpha && !(await sharp(buffer).stats()).isOpaque;
    const swapped = [5, 6, 7, 8].includes(input.orientation);
    const originalWidth = swapped ? input.height : input.width;
    const originalHeight = swapped ? input.width : input.height;
    const widths = [...new Set(widthsByRole[item.role].map(width => Math.min(width, originalWidth)))];
    const stem = outputStem(item.source, item.role);
    const variants = [];
    for (const width of widths) {
      const extension = item.role === 'favicon' ? 'png' : 'webp';
      const relativePath = `./media/web/${stem}-${width}.${extension}`;
      if (usedNames.has(relativePath)) throw new Error(`Duplicate output name: ${relativePath}`);
      usedNames.add(relativePath);
      const targetPath = path.resolve(root, relativePath);
      // EXIF orientation is applied, aspect ratio retained, and upscaling disabled.
      // Conversion to sRGB retains the intended colors across browser decoders.
      const pipeline = sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).withIccProfile('srgb');
      if (item.role === 'favicon') pipeline.png({ compressionLevel: 9 });
      else pipeline.webp({ quality: item.role === 'card' ? 84 : 85, lossless: item.role === 'logo', effort: 6, alphaQuality: 100 });
      const encoded = await pipeline.toBuffer();
      await fs.writeFile(targetPath, encoded);
      const metadata = await sharp(encoded).metadata();
      // A complete pixel decode catches truncation or encoder/decoder failures.
      const { info } = await sharp(encoded).raw().toBuffer({ resolveWithObject: true });
      if (metadata.width !== width || metadata.height !== Math.round(originalHeight * width / originalWidth)) {
        throw new Error(`Unexpected output dimensions: ${relativePath}`);
      }
      if (info.width !== metadata.width || info.height !== metadata.height) throw new Error(`Decode mismatch: ${relativePath}`);
      if (inputHasTransparency && !metadata.hasAlpha) throw new Error(`Transparency was lost: ${relativePath}`);
      variants.push({ width: metadata.width, height: metadata.height, path: relativePath, bytes: encoded.length, hasAlpha: Boolean(metadata.hasAlpha) });
    }
    const preferredWidth = Math.min(defaultWidthByRole[item.role], originalWidth);
    const defaultVariant = variants.find(variant => variant.width === preferredWidth) || variants[variants.length - 1];
    images.push({
      ...item,
      original: { width: originalWidth, height: originalHeight, bytes: buffer.length, format: input.format, hasAlpha: Boolean(input.hasAlpha), sha256: crypto.createHash('sha256').update(buffer).digest('hex') },
      variants,
      defaultPath: defaultVariant.path,
    });
    console.log(`${images.length}/${sources.length} ${item.source}: ${buffer.length} -> ${defaultVariant.bytes} bytes`);
  }
  const sum = fn => images.reduce((total, item) => total + fn(item), 0);
  const metrics = {
    uniqueSourceCount: images.length,
    imgUniqueSourceCount: images.filter(image => image.role !== 'favicon').length,
    imgUsageCount: sum(image => image.role === 'favicon' ? 0 : image.usageCount),
    outputVariantCount: sum(image => image.variants.length),
    originalUniqueBytes: sum(image => image.original.bytes),
    smallestVariantsBytes: sum(image => image.variants[0].bytes),
    largestVariantsBytes: sum(image => image.variants[image.variants.length - 1].bytes),
    defaultVariantsBytes: sum(image => image.variants.find(variant => variant.path === image.defaultPath).bytes),
    allVariantsBytes: sum(image => image.variants.reduce((total, variant) => total + variant.bytes, 0)),
  };
  metrics.defaultReductionPercent = Number((100 * (1 - metrics.defaultVariantsBytes / metrics.originalUniqueBytes)).toFixed(2));
  const manifest = { version: 1, generatedAt: new Date().toISOString(), encoder: `sharp ${sharp.versions.sharp}`, quality: { card: 84, photograph: 85, logo: 'lossless' }, metrics, images };
  const serialized = JSON.stringify(manifest, null, 2) + '\n';
  await fs.writeFile(manifestPath, serialized);
  await fs.writeFile(reportPath, serialized);
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
