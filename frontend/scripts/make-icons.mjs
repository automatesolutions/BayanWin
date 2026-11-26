/**
 * Generates every app icon, favicon and the social image from src/assets/Logo.png.
 * Run by hand after the logo changes (`npm run icons`) and commit the output:
 * the URLs are stable on purpose, because Google caches favicons for months.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = path.join(root, 'src', 'assets', 'Logo.png');
const pub = path.join(root, 'public');
const icons = path.join(pub, 'icons');
const BG = '#0C1119';

fs.mkdirSync(icons, { recursive: true });

// The logo is a full-bleed square, so app icons use it whole. Small favicons crop
// to the flag circle so it stays readable at 16 to 96 px.
const full = () => sharp(logo).flatten({ background: BG });
const mark = () => full().extract({ left: 100, top: 105, width: 820, height: 820 });

async function png(pipeline, size, file) {
  await pipeline.resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(icons, file));
  console.log(`icons/${file}`);
}

await png(full(), 192, 'icon-192.png');
await png(full(), 512, 'icon-512.png');
await png(full(), 180, 'apple-touch-icon.png');

// Maskable: launchers crop to a circle or squircle, so keep the logo inside the
// central 80% safe zone, padded with the page background.
const inner = await full().resize(410, 410).toBuffer();
await sharp(inner)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: BG })
  .png({ compressionLevel: 9 })
  .toFile(path.join(icons, 'icon-maskable-512.png'));
console.log('icons/icon-maskable-512.png');

for (const size of [48, 96, 192]) await png(mark(), size, `favicon-${size}.png`);

// favicon.ico with PNG-encoded 16, 32 and 48 px images (valid since Windows Vista).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => mark().resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, ...images]));
console.log('favicon.ico');

// Social card (1200x630): the logo centred on the page background.
const card = await full().resize(560, 560).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: BG } })
  .composite([{ input: card, left: 320, top: 35 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(pub, 'og-image.png'));
console.log('og-image.png');
