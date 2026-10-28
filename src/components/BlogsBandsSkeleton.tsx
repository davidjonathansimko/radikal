'use client';

// Scheletul benzii de carduri (telefon): un rand sau doua, dupa ultimul mod ales in admin.

import React, { useEffect, useState } from 'react';
import { cachedBlogsHomeMode } from '@/lib/blogsHome';

export default function BlogsBandsSkeleton() {
  const [rows, setRows] = useState(1);
  useEffect(() => {
    setRows(cachedBlogsHomeMode() >= 3 ? 2 : 1);
  }, []);
  const compact = rows === 2;
  const card = compact ? 'w-[27vw] min-w-[104px] max-w-[132px] sm:w-[20vw]' : 'w-[42vw] min-w-[150px] max-w-[220px] sm:w-[28vw]';

  return (
    <div className={`lg:hidden ${compact ? '' : 'flex min-h-[44dvh] flex-col justify-center'}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={compact ? 'mb-5' : ''}>
          <div className="mb-2 h-4 w-44 max-w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:-mx-6 sm:px-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`shrink-0 ${card}`}>
                <div className="aspect-square w-full animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-2.5 w-10 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-1.5 h-2.5 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
