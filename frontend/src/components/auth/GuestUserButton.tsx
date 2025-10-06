'use client';

import { useState } from 'react';
import { User, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface GuestUserButtonProps {
  onGuestLogin: (email: string, password: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GuestUserButton({ 
  onGuestLogin, 
  disabled = false, 
  className = '',
  size = 'md'
}: GuestUserButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFilling, setIsFilling] = useState(false);

  const guestCredentials = {
    email: 'guest@apnidukaan.com',
    password: 'guest123456'
  };

  const handleGuestLogin = async () => {
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    setIsFilling(true);

    // Simulate typing animation with delays
    const email = guestCredentials.email;
    const password = guestCredentials.password;
    
    // Create a typing effect by calling onGuestLogin with progressively filled data
    let currentEmail = '';
    let currentPassword = '';
    
    // Type email character by character
    for (let i = 0; i <= email.length; i++) {
      currentEmail = email.slice(0, i);
      onGuestLogin(currentEmail, '');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Small pause between email and password
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Type password character by character
    for (let i = 0; i <= password.length; i++) {
      currentPassword = password.slice(0, i);
      onGuestLogin(email, currentPassword);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Final pause before submitting
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsFilling(false);
    setIsAnimating(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGuestLogin}
      disabled={disabled || isAnimating}
      className={`
        ${sizeClasses[size]}
        ${className}
        ${isAnimating ? 'animate-pulse' : ''}
        border-2 border-black hover:border-black
        bg-white hover:bg-white
        text-black hover:text-black font-medium
        transition-all duration-300 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isAnimating ? (
        <>
          <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-spin`} />
          {isFilling ? 'Filling credentials...' : 'Signing in...'}
        </>
      ) : (
        <>
          <User className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
          Guest User (Autofill)
        </>
      )}
    </Button>
  );
}
