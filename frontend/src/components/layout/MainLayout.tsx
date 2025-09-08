'use client'

import { Inter } from 'next/font/google'
import Navbar from './Navbar'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'
import { cn } from '../../utils/cn'

const inter = Inter({ subsets: ['latin'] })

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', inter.className)}>
      <Navbar />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      <Footer />
      <CartSidebar />
    </div>
  )
}

