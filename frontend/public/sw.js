// In dev, do not activate any SW logic to avoid interfering with HMR/chunk loads
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

const CACHE_NAME = 'apnidukaan-v1.0.0'
const STATIC_CACHE = 'apnidukaan-static-v1.0.0'
const DYNAMIC_CACHE = 'apnidukaan-dynamic-v1.0.0'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/search/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  if (isDev) {
    // Immediately become a no-op in dev
    self.skipWaiting()
    return
  }
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (isDev) {
    // In dev, clear any caches created previously and claim clients without controlling them
    event.waitUntil(
      (async () => {
        const names = await caches.keys()
        await Promise.all(names.map((n) => caches.delete(n)))
        await self.clients.claim()
      })()
    )
    return
  }
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  if (isDev) {
    // Don't intercept any requests in dev
    return
  }
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Bypass Next.js build assets and HMR endpoints entirely
  // These include _next/static, _next/webpack-hmr, and Next server runtime chunks
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('__webpack_hmr') ||
    url.hostname !== self.location.hostname
  ) {
    return
  }

  event.respondWith(
    handleRequest(request)
  )
})

async function handleRequest(request) {
  const url = new URL(request.url)

  try {
    // API requests - cache first, then network
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request)
    }

    // Static assets - cache first
    if (isStaticAsset(url.pathname)) {
      return await handleStaticRequest(request)
    }

    // HTML pages - network first, then cache
    if (request.headers.get('accept')?.includes('text/html')) {
      return await handlePageRequest(request)
    }

    // Other requests - network first
    return await fetch(request)

  } catch (error) {
    console.error('Service Worker: Fetch error', error)
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return await caches.match('/offline')
    }
    
    // Return cached version for other requests
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Check if this API endpoint should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  
  if (!shouldCache) {
    return await fetch(request)
  }

  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Return cached response and update in background
    updateCacheInBackground(request)
    return cachedResponse
  }

  // Fetch from network
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: API fetch failed', error)
    throw error
  }
}

async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Fetch from network
  const networkResponse = await fetch(request)
  
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return await caches.match('/offline')
  }
}

function isStaticAsset(pathname) {
  // Do not treat Next.js assets as cacheable static assets
  if (pathname.startsWith('/_next/')) return false
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
}

async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse)
    }
  } catch (error) {
    console.log('Service Worker: Background update failed', error)
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Service Worker: Background sync triggered')
  
  // Handle offline actions like cart updates, wishlist, etc.
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      await processOfflineAction(action)
    }
    
    console.log('Service Worker: Background sync completed')
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

async function getPendingActions() {
  // This would integrate with your app's IndexedDB
  // For now, return empty array
  return []
}

async function processOfflineAction(action) {
  // Process offline actions when back online
  console.log('Service Worker: Processing offline action', action)
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-24x24.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-24x24.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})
