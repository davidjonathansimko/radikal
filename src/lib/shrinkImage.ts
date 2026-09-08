/**
 * Pasul 0809003 — MICȘORAREA POZELOR.
 *
 * Poți încărca o fotografie de 25 MB, dar nimeni nu are nevoie s-o și
 * descarce așa. Aici o coborâm la o lățime cuminte și o salvăm ca JPEG,
 * înainte să plece spre server. Ce urcă e ce văd cititorii.
 *
 * Dacă ceva nu merge (fișier ciudat, browser vechi), întoarcem fișierul
 * original neatins — mai bine mare decât deloc.
 */

const MAX_EDGE = 2000;
const QUALITY = 0.82;
/** Sub atât nu are rost să ne obosim. */
const SKIP_UNDER_BYTES = 400 * 1024;

export async function shrinkImage(file: File): Promise<File> {
  if (typeof window === 'undefined') return file;
  if (!file.type.startsWith('image/')) return file;
  // GIF-urile animate și-ar pierde mișcarea, iar SVG-ul nu e o fotografie.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size <= SKIP_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
