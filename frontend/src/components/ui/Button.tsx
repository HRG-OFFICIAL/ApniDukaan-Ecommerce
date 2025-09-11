import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    loading = false, 
    href, 
    children, 
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg'
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    );

    if (href) {
      return (
        <a 
          href={href} 
          className={classes}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.currentTarget.click()
            }
          }}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </a>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading ? (
          <span className="sr-only">Loading...</span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };