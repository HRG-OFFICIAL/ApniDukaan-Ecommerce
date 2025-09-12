'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  variant?: 'button' | 'icon' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  variant = 'icon', 
  size = 'md', 
  showLabel = false,
  className = '' 
}: ThemeToggleProps) {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  // Simple toggle function
  const handleToggle = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.theme-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggle}
        className={`theme-toggle text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 ${className}`}
        aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} theme`}
      >
        <motion.div
          key={actualTheme}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="text-current"
        >
        {actualTheme === 'light' ? (
          <Moon className={`${iconSizes[size]} text-current`} />
        ) : (
          <Sun className={`${iconSizes[size]} text-current`} />
        )}
        </motion.div>
        {showLabel && (
          <span className="ml-2 hidden sm:inline text-current">
            {actualTheme === 'light' ? 'Dark' : 'Light'}
          </span>
        )}
      </Button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative theme-toggle ${className}`}>
        <Button
          variant="ghost"
          size={size}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Theme selector"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <CurrentIcon className={`${iconSizes[size]} text-current`} />
          {showLabel && (
            <span className="hidden sm:inline text-current">{currentTheme.label}</span>
          )}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              role="menu"
              aria-orientation="vertical"
            >
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                const isSelected = theme === themeOption.value;
                
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value as 'light' | 'dark' | 'system');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    <span>{themeOption.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default icon variant
  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle inline-flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 ${buttonSizes[size]} ${className}`}
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <motion.div
        key={actualTheme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="text-current"
      >
        {actualTheme === 'light' ? (
          <Moon className={`${iconSizes[size]} text-current stroke-2`} />
        ) : (
          <Sun className={`${iconSizes[size]} text-current stroke-2`} />
        )}
      </motion.div>
    </button>
  );
}

// Compact theme toggle for mobile/small spaces
export function CompactThemeToggle({ className = '' }: { className?: string }) {
  const { actualTheme, setTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle inline-flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 h-8 w-8 ${className}`}
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <motion.div
        key={actualTheme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="text-current"
      >
        {actualTheme === 'light' ? (
          <Moon className="h-4 w-4 text-current stroke-2" />
        ) : (
          <Sun className="h-4 w-4 text-current stroke-2" />
        )}
      </motion.div>
    </button>
  );
}