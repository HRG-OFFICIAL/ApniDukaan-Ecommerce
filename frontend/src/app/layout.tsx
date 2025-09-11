import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import ApolloProvider from '../providers/ApolloProvider'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '../contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ApniDukaan - Your Ultimate E-Commerce Destination',
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
        <ThemeProvider>
          <ApolloProvider>
            <AuthProvider>
              <CartProvider>
                <div id="root">
                  {children}
                </div>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'text-sm',
                    style: {
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                />
              </CartProvider>
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
