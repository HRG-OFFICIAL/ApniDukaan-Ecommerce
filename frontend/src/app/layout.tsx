import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShopSphere - Your Ultimate E-Commerce Destination',
  description: 'Full-stack e-commerce platform with microservices architecture, featuring product catalog, user management, order processing, and secure payments.',
  keywords: 'ecommerce, shopping, online store, products, cart, checkout',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div id="root">
              {children}
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
