import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function Breadcrumb({ 
  items, 
  showHome = true, 
  separator: Separator = ChevronRight,
  className 
}: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/', icon: Home }, ...items]
    : items;

  return (
    <nav
      className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const ItemIcon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <Separator 
                  className="h-4 w-4 mx-2 text-gray-400" 
                  aria-hidden="true" 
                />
              )}
              
              {isLast || !item.href ? (
                <span 
                  className={cn(
                    'flex items-center space-x-1',
                    isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {ItemIcon && <ItemIcon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {ItemIcon && <ItemIcon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook to generate breadcrumbs from pathname
export function useBreadcrumbs(pathname: string, customLabels: Record<string, string> = {}) {
  const segments = pathname.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = customLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return { label, href };
  });

  return items;
}

// Predefined breadcrumb configurations
export const BREADCRUMB_LABELS = {
  'products': 'Products',
  'categories': 'Categories',
  'cart': 'Shopping Cart',
  'checkout': 'Checkout',
  'orders': 'My Orders',
  'profile': 'My Profile',
  'wishlist': 'Wishlist',
  'auth': 'Authentication',
  'login': 'Sign In',
  'register': 'Sign Up',
  'forgot-password': 'Forgot Password',
  'admin': 'Admin',
  'dashboard': 'Dashboard'
} as const;
