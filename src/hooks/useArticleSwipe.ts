'use client';

// Swipe stanga/dreapta intre cele 6 bloguri afisate in lista (cele mai noi).
// Se foloseste `replace`, ca „inapoi" sa duca la lista si nu prin toate articolele rasfoite.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

const COUNT = 6;

function blocked(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  if (el.closest('input, textarea, select, [contenteditable], [role="dialog"], [data-no-swipe], pre, table, audio')) return true;
  // Zone care se deruleaza pe orizontala (rand cu pastile etc.).
  let node: Element | null = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 4) return true;
    node = node.parentElement;
  }
  return false;
}

export function useArticleSwipe(opts: { enabled: boolean; currentSlug: string; basePath: string }) {
  const { enabled, currentSlug, basePath } = opts;
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([]);
  const slugsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await getSupabaseClient()
          .from('blog_posts')
          .select('slug')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(COUNT);
        if (!alive || !data) return;
        const list = (data as { slug: string }[]).map((r) => r.slug);
        slugsRef.current = list;
        setSlugs(list);
      } catch {
        /* fara swipe */
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

  const index = slugs.indexOf(currentSlug);

  useEffect(() => {
    if (!enabled || index < 0) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      tracking = e.touches.length === 1 && !blocked(e.target);
      if (!tracking) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Date.now() - startT > 700 || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (window.getSelection()?.toString()) return;
      if (document.querySelector('[role="dialog"]')) return;
      // Swipe spre stanga = urmatorul din lista, spre dreapta = cel dinainte.
      const target = slugsRef.current[dx < 0 ? index + 1 : index - 1];
      if (!target) return;
      router.replace(`${basePath}/${target}`);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [enabled, index, basePath, router]);

  return { index, total: slugs.length };
}
