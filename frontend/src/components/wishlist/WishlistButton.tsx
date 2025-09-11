'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onToggle?: (isInWishlist: boolean) => void;
}

export default function WishlistButton({
  productId,
  variant = 'icon',
  size = 'md',
  showText = false,
  className = '',
  onToggle
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const inWishlist = isInWishlist(productId);

  const handleToggle = async () => {
    if (isLoading || isAnimating) return;

    setIsAnimating(true);
    
    // Create heart particles animation when adding to wishlist
    if (!inWishlist) {
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20
      }));
      setParticles(newParticles);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 1000);
    }

    try {
      const success = await toggleWishlist(productId);
      if (success) {
        onToggle?.(!inWishlist);
        
        // Custom toast for wishlist actions
        if (!inWishlist) {
          toast.success('Added to wishlist ❤️', {
            duration: 2000,
            position: 'bottom-center',
            style: {
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA'
            }
          });
        }
      }
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={handleToggle}
        disabled={isLoading || isAnimating}
        variant={inWishlist ? 'default' : 'outline'}
        size={size}
        className={`relative overflow-hidden transition-all duration-200 ${
          inWishlist 
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
            : 'hover:bg-red-50 hover:border-red-200 hover:text-red-600'
        } ${className}`}
      >
        <div className="relative flex items-center space-x-2">
          <motion.div
            animate={{ 
              scale: isAnimating ? [1, 1.2, 1] : 1,
              rotate: isAnimating ? [0, -10, 10, 0] : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              className={`${iconSizes[size]} transition-all duration-200 ${
                inWishlist 
                  ? 'fill-current text-red-500' 
                  : ''
              }`} 
            />
          </motion.div>
          
          {showText && (
            <span className="text-sm font-medium">
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </span>
          )}

          {/* Floating particles */}
          <AnimatePresence>
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: particle.x,
                  y: particle.y,
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute pointer-events-none"
              >
                <Heart className="h-2 w-2 fill-current text-red-500" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Ripple effect */}
        {isAnimating && (
          <motion.div
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-red-200 rounded-full"
          />
        )}
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || isAnimating}
      className={`relative ${buttonSizes[size]} rounded-full transition-all duration-200 ${
        inWishlist
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-600'
      } ${className}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <div className="relative">
        <motion.div
          animate={{ 
            scale: isAnimating ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Heart 
            className={`${iconSizes[size]} transition-all duration-300 ${
              inWishlist 
                ? 'fill-current text-red-500' 
                : ''
            }`} 
          />
        </motion.div>

        {/* Floating particles for icon variant */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{ 
                scale: [0, 1, 0.5],
                x: particle.x,
                y: particle.y,
                opacity: [1, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Heart className="h-2 w-2 fill-current text-red-500" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading indicator */}
      {(isLoading || isAnimating) && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full"
        >
          <div className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </button>
  );
}
