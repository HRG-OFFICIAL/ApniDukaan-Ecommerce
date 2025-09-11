'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { cn } from '../../utils/cn'

// Fade in animation variants
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

// Scale animations
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
}

// Slide animations
export const slideVariants = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  left: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  right: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  }
}

// Stagger children animation
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Animation duration presets
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5
}

// Easing presets
export const easings = {
  ease: [0.25, 0.46, 0.45, 0.94],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55]
}

// Reusable animation components
interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}

export function FadeIn({ children, className = '', delay = 0, duration = 0.3 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: easings.easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
  delay?: number
  duration?: number
}

export function SlideIn({ 
  children, 
  direction = 'up', 
  className = '', 
  delay = 0, 
  duration = 0.3 
}: SlideInProps) {
  return (
    <motion.div
      initial={slideVariants[direction].hidden}
      animate={slideVariants[direction].visible}
      exit={slideVariants[direction].exit}
      transition={{ duration, delay, ease: easings.easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}

export function ScaleIn({ children, className = '', delay = 0, duration = 0.3 }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration, delay, ease: easings.bounce }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation
interface StaggeredListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggeredList({ children, className = '', staggerDelay = 0.1 }: StaggeredListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
      style={{ 
        // @ts-ignore - CSS custom property for stagger delay
        '--stagger-delay': `${staggerDelay}s`
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={{ delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Intersection observer animation
interface AnimateOnViewProps {
  children: React.ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale'
  className?: string
  delay?: number
  duration?: number
  once?: boolean
}

export function AnimateOnView({ 
  children, 
  animation = 'fadeIn', 
  className = '', 
  delay = 0,
  duration = 0.5,
  once = true
}: AnimateOnViewProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once })

  const getVariants = () => {
    switch (animation) {
      case 'slideUp':
        return slideVariants.up
      case 'slideDown':
        return slideVariants.down
      case 'slideLeft':
        return slideVariants.left
      case 'slideRight':
        return slideVariants.right
      case 'scale':
        return scaleVariants
      default:
        return fadeInVariants
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={getVariants()}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration, delay, ease: easings.easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Loading spinner with animations
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

export function Spinner({ size = 'md', variant = 'primary', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-400',
    white: 'text-white'
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(sizeClasses[size], className)}
    >
      <svg className={cn('animate-spin', variantClasses[variant])} fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  )
}

// Pulse animation for loading states
interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function Pulse({ children, className = '', intensity = 'medium' }: PulseProps) {
  const intensityClasses = {
    low: 'animate-pulse',
    medium: 'animate-pulse',
    high: 'animate-bounce'
  }

  return (
    <div className={cn(intensityClasses[intensity], className)}>
      {children}
    </div>
  )
}

// Floating action button animation
interface FloatingButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  show?: boolean
}

export function FloatingButton({ 
  children, 
  onClick, 
  className = '', 
  position = 'bottom-right',
  show = true
}: FloatingButtonProps) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-20 right-6',
    'top-left': 'fixed top-20 left-6'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17,
            duration: 0.3
          }}
          onClick={onClick}
          className={cn(
            positionClasses[position],
            'z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            className
          )}
        >
          {children}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Card hover animations
interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: 'lift' | 'glow' | 'tilt' | 'none'
}

export function AnimatedCard({ 
  children, 
  className = '', 
  hoverEffect = 'lift' 
}: AnimatedCardProps) {
  const getHoverAnimation = () => {
    switch (hoverEffect) {
      case 'lift':
        return { y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }
      case 'glow':
        return { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }
      case 'tilt':
        return { rotateX: 5, rotateY: 5 }
      default:
        return {}
    }
  }

  return (
    <motion.div
      whileHover={getHoverAnimation()}
      transition={{ duration: 0.2 }}
      className={cn('cursor-pointer', className)}
    >
      {children}
    </motion.div>
  )
}

// Progress bar animation
interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
  showValue?: boolean
  animated?: boolean
}

export function AnimatedProgress({ 
  value, 
  max = 100, 
  className = '', 
  color = 'blue',
  showValue = false,
  animated = true
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  return (
    <div className={cn('relative w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: animated ? 1 : 0, ease: easings.easeOut }}
        className={cn('h-full rounded-full', colorClasses[color])}
      />
      {showValue && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: easings.easeOut }}
    >
      {children}
    </motion.div>
  )
}

// Notification animation
interface NotificationProps {
  show: boolean
  children: React.ReactNode
  position?: 'top' | 'bottom'
  className?: string
}

export function AnimatedNotification({ 
  show, 
  children, 
  position = 'top', 
  className = '' 
}: NotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: position === 'top' ? -100 : 100,
            scale: 0.8
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0, 
            y: position === 'top' ? -100 : 100,
            scale: 0.8
          }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3
          }}
          className={cn(
            'fixed left-1/2 transform -translate-x-1/2 z-50',
            position === 'top' ? 'top-4' : 'bottom-4',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
