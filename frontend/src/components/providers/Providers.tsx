'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '../../contexts/AuthContext'
import { Toaster, type DefaultToastOptions } from 'react-hot-toast'

interface ProvidersProps {
  children: ReactNode
}

// Unified toast configuration combining structured setup with your preferred visuals
const toastConfig: DefaultToastOptions = {
  // Base style for all toasts
  style: {
    background: '#111827',
    color: '#F9FAFB',
    border: '1px solid #1E263D',
    borderRadius: 6,
    boxShadow: 'none',
    padding: '6px 14px'
  },
  icon: null,
  success: {
    // Black tick in a circle
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#000000" strokeWidth="2" />
        <path d="M8 12l3 3 5-6" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    style: {
      background: '#D1FAE5',
      borderColor: '#34D399',
      color: '#000000'
    }
  },
  error: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6l12 12" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    style: {
      borderColor: '#F43F5E'
    }
  },
  loading: {
    icon: (
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2v4M12 18v4M4.93 4.93L7.76 7.76M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    style: {
      borderColor: '#A5B4FC'
    }
  }
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          ...toastConfig,
        }}
      />
    </AuthProvider>
  )
}
