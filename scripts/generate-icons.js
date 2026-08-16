/**
 * Generate PWA / Play Store icons from the RADIKAL logo.
 * Erzeugt PWA-/Play-Store-Icons aus dem RADIKAL-Logo.
 * Generează iconițele PWA / Play Store din logo-ul RADIKAL.
 *
 * Usage: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'public', 'radikal.logo.schwarz.hintergrund.png');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Background matches manifest background_color so the logo blends seamlessly
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

// "any" icons: logo fills ~90% of the canvas
// "maskable" icons: logo fills ~60% so it survives Android's circular/squircle crop
const TARGETS = [
  { size: 192, name: 'icon-192.png', ratio: 0.9 },
  { size: 512, name: 'icon-512.png', ratio: 0.9 },
  { size: 192, name: 'icon-maskable-192.png', ratio: 0.6 },
  { size: 512, name: 'icon-maskable-512.png', ratio: 0.6 },
  { size: 180, name: 'apple-touch-icon.png', ratio: 0.9 },
  { size: 512, name: 'play-store-512.png', ratio: 0.6 },
];

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error('Source logo not found: ' + SOURCE);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { size, name, ratio } of TARGETS) {
    const inner = Math.round(size * ratio);

    // Scale logo to fit inside the safe area, keeping aspect ratio
    const logo = await sharp(SOURCE)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: BG },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, name));

    console.log(`✓ ${name} (${size}x${size})`);
  }

  console.log('\nAll icons generated in public/icons/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
