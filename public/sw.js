// Mictla Service Worker
// This will be replaced by Vite PWA plugin in production

const CACHE_NAME = 'mictla-v1'
const STATIC_CACHE = 'mictla-static-v1'
const DYNAMIC_CACHE = 'mictla-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/assets/models/altar-level-1.gltf',
  '/assets/models/altar-level-2.gltf',
  '/assets/models/altar-level-3.gltf'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Mictla SW: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Mictla SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Mictla SW: Static assets cached')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Mictla SW: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('mictla-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE
            })
            .map(cacheName => {
              console.log('Mictla SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('Mictla SW: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests (except fonts)
  if (url.origin !== location.origin && !url.hostname.includes('fonts.googleapis.com')) {
    return
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Mictla SW: Serving from cache:', request.url)
          return cachedResponse
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse
            }
            
            // Clone response for caching
            const responseToCache = networkResponse.clone()
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                console.log('Mictla SW: Caching dynamic asset:', request.url)
                cache.put(request, responseToCache)
              })
            
            return networkResponse
          })
          .catch(error => {
            console.log('Mictla SW: Network fetch failed:', error)
            
            // Return offline fallback for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html')
            }
            
            throw error
          })
      })
  )
})

// Background sync for memorial data
self.addEventListener('sync', event => {
  if (event.tag === 'memorial-sync') {
    console.log('Mictla SW: Background sync for memorials')
    event.waitUntil(syncMemorials())
  }
})

// Sync memorials when back online
async function syncMemorials() {
  try {
    // This will be implemented when we have the storage system
    console.log('Mictla SW: Syncing memorials...')
    
    // Get pending memorials from IndexedDB
    // Send to sync service
    // Update local storage with results
    
    return Promise.resolve()
  } catch (error) {
    console.error('Mictla SW: Memorial sync failed:', error)
    throw error
  }
}

// Push notifications for family updates
self.addEventListener('push', event => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body || 'Nueva actualización en Mictla',
    icon: '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'mictla-notification',
    data: data.url || '/',
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/action-dismiss.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Mictla', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})