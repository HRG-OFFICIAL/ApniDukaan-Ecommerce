import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ApiErrorAlertProps {
  /** Error message to display */
  error: string | Error | null;
  /** Function to retry the failed operation */
  onRetry?: () => void;
  /** Function to dismiss the error */
  onDismiss?: () => void;
  /** Whether the retry operation is loading */
  retryLoading?: boolean;
  /** Custom title for the error alert */
  title?: string;
  /** Variant style for the alert */
  variant?: 'error' | 'warning' | 'info';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the retry button */
  showRetry?: boolean;
  /** Whether to show the dismiss button */
  showDismiss?: boolean;
  /** Additional context or helpful information */
  context?: string;
  /** Custom retry button text */
  retryText?: string;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    button: 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    button: 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    button: 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100',
  },
};

export function ApiErrorAlert({
  error,
  onRetry,
  onDismiss,
  retryLoading = false,
  title,
  variant = 'error',
  className,
  showRetry = true,
  showDismiss = true,
  context,
  retryText = 'Retry',
}: ApiErrorAlertProps) {
  // Don't render if no error
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const styles = variantStyles[variant];
  
  const defaultTitles = {
    error: 'API Error',
    warning: 'Connection Warning',
    info: 'Information',
  };

  const displayTitle = title || defaultTitles[variant];

  return (
    <div className={cn('border rounded-md p-4', styles.container, className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={cn('h-5 w-5', styles.icon)} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={cn('text-sm font-medium', styles.title)}>
            {displayTitle}
          </h3>
          <div className={cn('mt-2 text-sm', styles.message)}>
            <p>{errorMessage}</p>
            {context && <p className="mt-2">{context}</p>}
          </div>
          
          {(showRetry || showDismiss) && (
            <div className="mt-4">
              <div className="flex space-x-2">
                {showRetry && onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    disabled={retryLoading}
                    loading={retryLoading}
                    className={cn(styles.button)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {retryText}
                  </Button>
                )}
                
                {showDismiss && onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className={cn('text-gray-600 hover:text-gray-800')}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {showDismiss && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className={cn('inline-flex rounded-md p-1.5 focus:outline-none', styles.message)}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized variants for common use cases
export function NetworkErrorAlert(props: Omit<ApiErrorAlertProps, 'variant' | 'title' | 'context'>) {
  return (
    <ApiErrorAlert
      {...props}
      variant="error"
      title="Network Error"
      context="Please check your internet connection and try again."
    />
  );
}

export function ServerErrorAlert(props: Omit<ApiErrorAlertProps, 'variant' | 'title' | 'context'>) {
  return (
    <ApiErrorAlert
      {...props}
      variant="error"
      title="Server Error"
      context="Our servers are experiencing issues. Please try again later."
    />
  );
}

export function SyncErrorAlert(props: Omit<ApiErrorAlertProps, 'variant' | 'title' | 'context'>) {
  return (
    <ApiErrorAlert
      {...props}
      variant="warning"
      title="Sync Warning"
      context="Your data is saved locally and will sync when the connection is restored."
    />
  );
}

export function AuthErrorAlert(props: Omit<ApiErrorAlertProps, 'variant' | 'title' | 'context'>) {
  return (
    <ApiErrorAlert
      {...props}
      variant="error"
      title="Authentication Error"
      context="Please log in again to continue."
      showRetry={false}
    />
  );
}

// Hook for managing error alert state
export function useApiErrorAlert() {
  const [error, setError] = React.useState<string | Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const showError = React.useCallback((error: string | Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retry = React.useCallback(async (retryFn: () => Promise<void>) => {
    if (!retryFn) return;
    
    try {
      setIsRetrying(true);
      await retryFn();
      clearError();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setIsRetrying(false);
    }
  }, [clearError]);

  return {
    error,
    isRetrying,
    showError,
    clearError,
    retry,
  };
}
