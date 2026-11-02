// Coperta pentru notificarea media (ecran de blocare, panoul de notificari): imaginea articolului, taiata patrat
// (centrat), ca sa umple complet cercul/patratul din notificare.

const cache = new Map<string, Promise<string | null>>();

export const ARTWORK_SIZE = '640x640';

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
      const W = 640;
      const H = 640;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  })();
  cache.set(url, job);
  return job;
}
