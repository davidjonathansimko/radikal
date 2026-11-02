// Coperta pentru notificarea media (ecran de blocare, panoul de notificari): imaginea articolului, taiata
// in format lat (ca pastila notificarii) si putin intunecata, ca sa umple tot cardul.

const cache = new Map<string, Promise<string | null>>();

export const ARTWORK_SIZE = '1200x500';

function load(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 6000);
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

/** Adresa (data URL) a copertei late; `null` daca imaginea nu poate fi citita (atunci se foloseste originalul). */
export function wideArtwork(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof window === 'undefined') return Promise.resolve(null);
  const hit = cache.get(url);
  if (hit) return hit;
  const job = (async () => {
    const img = await load(url);
    if (!img) return null;
    try {
      const W = 1200;
      const H = 500;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, 0, W, H);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return null;
    }
  })();
  cache.set(url, job);
  return job;
}
