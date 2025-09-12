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
                  // Set default theme to light, but let page-specific hooks override
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                  
                  // Set default theme in localStorage
                  if (!localStorage.getItem('theme')) {
                    localStorage.setItem('theme', 'light');
                  }
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
      <body className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50`}>
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