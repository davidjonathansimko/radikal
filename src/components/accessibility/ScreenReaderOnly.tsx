// Screen Reader Only Component for Accessibility / Nur für Screenreader-Komponente für Barrierefreiheit / Componentă Doar pentru Screen Reader pentru Accesibilitate
// Hides content visually but keeps it accessible to screen readers
// Versteckt Inhalte visuell, hält sie aber für Screenreader zugänglich
// Ascunde conținutul vizual dar îl păstrează accesibil pentru screen readers

import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Visually hidden but screen reader accessible component
 */
export default function ScreenReaderOnly({
  children,
  as: Component = 'span',
  className = '',
}: ScreenReaderOnlyProps) {
  return (
    <Component className={`sr-only ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Announce changes to screen readers
 */
interface LiveRegionProps {
  children: React.ReactNode;
  mode?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function LiveRegion({
  children,
  mode = 'polite',
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Skip to main content link
 */
interface SkipLinkProps {
  targetId?: string;
  className?: string;
}

export function SkipLink({
  targetId = 'main-content',
  className = '',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`
        sr-only focus:not-sr-only 
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2 
        focus:bg-red-600 focus:text-white 
        focus:rounded-lg focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black
        ${className}
      `}
    >
      Zum Hauptinhalt springen
    </a>
  );
}

/**
 * Accessible Icon Button
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

export function IconButton({
  icon,
  label,
  showLabel = false,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={`
        inline-flex items-center justify-center gap-2
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${className}
      `}
    >
      {icon}
      {showLabel ? (
        <span>{label}</span>
      ) : (
        <ScreenReaderOnly>{label}</ScreenReaderOnly>
      )}
    </button>
  );
}

/**
 * Accessible loading indicator
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Wird geladen...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block ${className}`}
    >
      <div
        className={`
          ${sizeClasses[size]}
          border-red-500 border-t-transparent
          rounded-full animate-spin
        `}
      />
      <ScreenReaderOnly>{label}</ScreenReaderOnly>
    </div>
  );
}

/**
 * Focus trap for modals and dialogs
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(itemCount - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(activeIndex);
          break;
      }
    },
    [itemCount, activeIndex, onSelect]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      'aria-selected': index === activeIndex,
      role: 'option',
    }),
  };
}

/**
 * Accessible tooltip
 */
interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const id = React.useId();

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? id : undefined,
      })}
      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className={`
            absolute z-50 px-2 py-1 
            bg-gray-900 text-white text-sm 
            rounded shadow-lg whitespace-nowrap
            ${positionClasses[position]}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}
