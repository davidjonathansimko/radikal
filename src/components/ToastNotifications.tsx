// Toast Notification System / Toast-Benachrichtigungssystem / Sistem Notificări Toast
// Beautiful animated toast notifications with multiple types
// Schöne animierte Toast-Benachrichtigungen mit mehreren Typen
// Notificări toast animate frumoase cu mai multe tipuri

'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaTimes,
  FaBell
} from 'react-icons/fa';

// Toast types / Toast-Typen
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast interface / Toast-Schnittstelle
interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Context interface / Kontext-Schnittstelle
interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
}

// Create context / Kontext erstellen
const ToastContext = createContext<ToastContextValue | null>(null);

// Toast configuration / Toast-Konfiguration
const TOAST_ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
  warning: FaExclamationTriangle
};

const TOAST_COLORS = {
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: 'text-green-400',
    progress: 'bg-green-500'
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: 'text-red-400',
    progress: 'bg-red-500'
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'text-blue-400',
    progress: 'bg-blue-500'
  },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: 'text-yellow-400',
    progress: 'bg-yellow-500'
  }
};

// Generate unique ID / Eindeutige ID generieren
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Toast Provider Component / Toast-Provider-Komponente
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Show toast / Toast anzeigen
  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const duration = toast.duration ?? 5000;

    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto-hide after duration / Nach Dauer automatisch ausblenden
    if (duration > 0) {
      const timer = setTimeout(() => {
        hideToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, []);

  // Hide toast / Toast ausblenden
  const hideToast = useCallback((id: string) => {
    // Clear timer / Timer löschen
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helper functions / Hilfsfunktionen
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'success', title, message, duration });
  }, [showToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'error', title, message, duration: duration ?? 8000 });
  }, [showToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'info', title, message, duration });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return showToast({ type: 'warning', title, message, duration: duration ?? 6000 });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast / Hook zur Verwendung von Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast Container / Toast-Container
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast, index) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onDismiss={() => onDismiss(toast.id)}
          index={index}
        />
      ))}
    </div>
  );
}

// Individual Toast Item / Einzelnes Toast-Element
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  index: number;
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const colors = TOAST_COLORS[toast.type];
  const Icon = TOAST_ICONS[toast.type];

  // Animate in on mount / Bei Mounten einblenden
  React.useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Handle dismiss with animation / Ausblenden mit Animation
  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto max-w-sm w-full transform transition-all duration-300 ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
      style={{ 
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-lg ${colors.bg}`}>
        {/* Main content / Hauptinhalt */}
        <div className="flex items-start gap-3 p-4">
          {/* Icon / Symbol */}
          <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          {/* Text content / Textinhalt */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm">{toast.title}</p>
            {toast.message && (
              <p className="text-white/70 text-sm mt-1">{toast.message}</p>
            )}
            
            {/* Action button / Aktions-Button */}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className="mt-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          {/* Dismiss button / Schließen-Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar / Fortschrittsbalken */}
        {toast.duration && toast.duration > 0 && (
          <div className="h-1 w-full bg-white/10">
            <div 
              className={`h-full ${colors.progress} animate-shrink`}
              style={{ 
                animationDuration: `${toast.duration}ms`,
                animationTimingFunction: 'linear'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Add to globals.css for animation / Zu globals.css für Animation hinzufügen
// @keyframes shrink { from { width: 100%; } to { width: 0%; } }
// .animate-shrink { animation: shrink linear forwards; }

export default ToastProvider;
