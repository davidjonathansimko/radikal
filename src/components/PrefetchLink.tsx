// Prefetch Link Component / Prefetch-Link-Komponente / Componentă Link cu Prefetch
// Preloads pages on hover for instant navigation
// Lädt Seiten beim Hover vor für sofortige Navigation
// Preîncarcă paginile la hover pentru navigare instantanee
// Prefetch links for better performance

'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchOnHover?: boolean;
  prefetchDelay?: number; // ms delay before prefetching
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  'aria-label'?: string;
  target?: string;
  rel?: string;
}

export default function PrefetchLink({
  href,
  children,
  className = '',
  prefetchOnHover = true,
  prefetchDelay = 100,
  onClick,
  title,
  'aria-label': ariaLabel,
  target,
  rel,
}: PrefetchLinkProps) {
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Prefetch the page when hovering
  const handleMouseEnter = useCallback(() => {
    if (!prefetchOnHover || isPrefetched) return;
    
    // Skip external links
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Delay prefetch slightly to avoid unnecessary requests on quick mouse movements
    const timeout = setTimeout(() => {
      router.prefetch(href);
      setIsPrefetched(true);
    }, prefetchDelay);

    setHoverTimeout(timeout);
  }, [href, prefetchOnHover, isPrefetched, prefetchDelay, router]);

  // Clear timeout if mouse leaves before prefetch
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [hoverTimeout]);

  // Handle click with optional callback
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  // For external links, use regular anchor
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        title={title}
        aria-label={ariaLabel}
        target={target || '_blank'}
        rel={rel || 'noopener noreferrer'}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={title}
      aria-label={ariaLabel}
      prefetch={false} // We handle prefetch manually on hover
    >
      {children}
    </Link>
  );
}

// Hook for programmatic prefetching
// Hook für programmatisches Prefetching
// Hook pentru prefetch programatic
export function usePrefetch() {
  const router = useRouter();
  const prefetchedUrls = React.useRef<Set<string>>(new Set());

  const prefetch = useCallback((url: string) => {
    if (prefetchedUrls.current.has(url)) return;
    
    // Skip external links
    if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return;
    }

    router.prefetch(url);
    prefetchedUrls.current.add(url);
  }, [router]);

  const prefetchMultiple = useCallback((urls: string[]) => {
    urls.forEach(url => prefetch(url));
  }, [prefetch]);

  return { prefetch, prefetchMultiple };
}

// Higher-order component to add prefetch to any link-like component
// Higher-Order-Komponente zum Hinzufügen von Prefetch zu jeder Link-ähnlichen Komponente
// Componentă higher-order pentru a adăuga prefetch la orice componentă tip link
export function withPrefetch<P extends { href: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function PrefetchedComponent(props: P) {
    const router = useRouter();
    const [isPrefetched, setIsPrefetched] = useState(false);

    const handleMouseEnter = useCallback(() => {
      if (isPrefetched) return;
      if (props.href.startsWith('http')) return;
      
      router.prefetch(props.href);
      setIsPrefetched(true);
    }, [props.href, isPrefetched, router]);

    return (
      <div onMouseEnter={handleMouseEnter}>
        <WrappedComponent {...props} />
      </div>
    );
  };
}
