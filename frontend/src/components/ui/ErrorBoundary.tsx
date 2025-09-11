'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
    <div className="bg-red-50 rounded-full p-3 mb-4">
      <AlertTriangle className="h-8 w-8 text-red-500" />
    </div>
    
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Something went wrong
    </h2>
    
    <p className="text-gray-600 mb-6 max-w-md">
      We encountered an unexpected error. Please try again or contact support if the problem persists.
    </p>
    
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mb-6 p-4 bg-gray-100 rounded-lg text-left max-w-2xl w-full">
        <summary className="cursor-pointer font-medium text-gray-800 mb-2">
          Error Details
        </summary>
        <pre className="text-sm text-red-600 whitespace-pre-wrap">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      </details>
    )}
    
    <Button onClick={resetError} variant="default">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Async error boundary component
interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  onReset?: () => void;
}

export function AsyncErrorBoundary({ 
  children, 
  onReset, 
  ...props 
}: AsyncErrorBoundaryProps) {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    onReset?.();
    setResetKey(prev => prev + 1);
  }, [onReset]);

  return (
    <ErrorBoundary
      key={resetKey}
      {...props}
      fallback={({ error }) => (
        <DefaultErrorFallback error={error} resetError={reset} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
