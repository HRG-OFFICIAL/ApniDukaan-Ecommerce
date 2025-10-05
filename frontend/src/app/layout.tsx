import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Providers } from '../components/providers/Providers'
import ErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ApniDukaan - Your Ultimate E-Commerce Destination',
  description: 'Full-stack e-commerce platform with microservices architecture, featuring product catalog, user management, order processing, and secure payments.',
  keywords: 'ecommerce, shopping, online store, products, cart, checkout',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ApniDukaan'
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                  if ('serviceWorker' in navigator) {
                    // Unregister any existing SWs in dev to avoid stale caches/interception
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister();
                      }
                    });
                    // Clear caches created by SW
                    if (window.caches && caches.keys) {
                      caches.keys().then(function(names) {
                        for (var i = 0; i < names.length; i++) {
                          caches.delete(names[i]);
                        }
                      });
                    }
                  }
                }
              })();
            `,
          }}
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=()" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50`}>
        <ErrorBoundary>
          <ThemeProvider>
            <Providers>
              <div id="root">
                {children}
              </div>
            </Providers>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}