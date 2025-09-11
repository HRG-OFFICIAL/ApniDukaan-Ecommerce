import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Providers } from '../components/providers/Providers'

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Force light mode by default - override any system/saved preferences
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                  
                  // Clear any dark theme preferences
                  localStorage.setItem('theme', 'light');
                  
                  // Set body background to light theme
                  document.body.style.backgroundColor = '#f9fafb'; // gray-50
                  document.body.style.color = '#111827'; // gray-900
                } catch (e) {
                  // Default to light mode if localStorage is not available
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 light`}>
        <ThemeProvider>
          <Providers>
            <div id="root">
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}