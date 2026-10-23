// Imagine pentru partajare: versetul scris peste o poza intunecata (sau peste
// un fundal negru), gata de trimis pe retele. Se deseneaza local, in browser.

export interface ShareImageOptions {
  text: string;
  reference?: string | null;
  /** Poza de fundal (optional). Daca nu poate fi citita, folosim fundal negru. */
  imageUrl?: string | null;
  /** Linkul care insoteste imaginea. */
  url?: string;
  title?: string;
}

export type ShareImageResult = 'shared' | 'cancelled' | 'downloaded' | 'unsupported';

const W = 1080;
const H = 1350;

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  text.split('\n').forEach((paragraph) => {
    let line = '';
    paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
  });
  return lines;
}

async function draw(opts: ShareImageOptions, withImage: boolean): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    await Promise.all([
      document.fonts?.load('italic 400 60px "EB Garamond"'),
      document.fonts?.load('600 34px Cinzel'),
    ]);
  } catch {
    /* fonturile de rezerva sunt suficiente */
  }

  // Fundal
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const bg = withImage && opts.imageUrl ? await loadImage(opts.imageUrl) : null;
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    const w = bg.width * scale;
    const h = bg.height * scale;
    ctx.drawImage(bg, (W - w) / 2, (H - h) / 2, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0b0b');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Text
  const raw = opts.text.trim();
  // Daca textul are deja ghilimele (la inceput sau la sfarsit), nu le dublam.
  const quoted = /^[\u201E\u201C\u201D"\u00AB]/.test(raw) || /[\u201C\u201D"\u00BB]$/.test(raw);
  const text = quoted ? raw : `\u201E${raw}\u201C`;
  const len = text.length;
  const size = len < 90 ? 68 : len < 170 ? 58 : len < 300 ? 48 : len < 480 ? 40 : 34;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic 400 ${size}px "EB Garamond", Georgia, serif`;
  const lines = wrap(ctx, text, W - 220);
  const lineHeight = size * 1.38;
  const blockHeight = lines.length * lineHeight;
  const refHeight = opts.reference ? 90 : 0;
  let y = (H - (blockHeight + refHeight)) / 2 + size;
  lines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += lineHeight;
  });

  if (opts.reference) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 34px Cinzel, Georgia, serif';
    ctx.fillText(`\u2014 ${opts.reference}`, W / 2, y + 40);
  }

  // Semnatura
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 30px Cinzel, Georgia, serif';
  ctx.fillText('RADIKAL.', W / 2, H - 80);

  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png');
    } catch {
      resolve(null);
    }
  });
}

export async function shareVerseImage(opts: ShareImageOptions): Promise<ShareImageResult> {
  if (typeof window === 'undefined') return 'unsupported';

  let blob = await draw(opts, true);
  // Poza dintr-o alta adresa poate bloca exportul: reincercam cu fundal negru.
  if (!blob && opts.imageUrl) blob = await draw(opts, false);
  if (!blob) return 'unsupported';

  const file = new File([blob], 'radikal-verset.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: opts.title ?? 'RADIKAL.', text: opts.url });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      /* la orice alta eroare coboram la descarcare */
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'radikal-verset.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 4000);
  return 'downloaded';
}

export const IMAGE_SAVED: Record<string, string> = {
  de: 'Bild gespeichert',
  en: 'Image saved',
  ro: 'Imagine salvată',
  ru: 'Изображение сохранено',
};
