// Error Boundary Component / Fehlergrenz-Komponente / Componenta Graniță Erori
// Catches JavaScript errors and displays a fallback UI
// Fängt JavaScript-Fehler ab und zeigt eine Fallback-Benutzeroberfläche an
// Prinde erorile JavaScript și afișează o interfață de rezervă

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Error icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <FaExclamationTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            {/* Error message */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-white/60 mb-6">
              We encountered an unexpected error. Please try again or return to the home page.
            </p>
            
            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-gray-100 dark:bg-white/5 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer text-gray-700 dark:text-white/70 font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto text-red-600 dark:text-red-400 text-xs">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                <FaRedo className="w-4 h-4" />
                Try Again
              </button>
              
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl font-medium transition-colors"
              >
                <FaHome className="w-4 h-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error component for pages / Einfache Fehlerkomponente für Seiten / Componentă simplă de eroare pentru pagini
export function ErrorPage({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  onRetry
}: {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center animate-pulse">
          <FaExclamationTriangle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-white/60 mb-8">
          {message}
        </p>
        
        <div className="flex gap-4 justify-center">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              <FaRedo className="w-5 h-5" />
              Try Again
            </button>
          )}
          
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-4 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl font-medium transition-all hover:scale-105"
          >
            <FaHome className="w-5 h-5" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// 404 Not Found component / 404 Nicht Gefunden Komponente / Componenta 404 Nu a fost găsit
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-bold text-gray-200 dark:text-white/10 mb-4">
          404
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-white/60 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all hover:scale-105"
        >
          <FaHome className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ErrorBoundary;
