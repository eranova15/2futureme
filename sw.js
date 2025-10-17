// 2FutureMe Service Worker - PWA Offline Support
const CACHE_NAME = '2futureme-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/voice-recognition.js',
  '/js/recording.js',
  '/js/camera.js',
  '/js/vault.js',
  '/manifest.json',
  // Icons
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  // Offline page
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] App shell cached');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'text/plain'
              }
            });
          });
      })
  );
});

// Background sync for queued actions (when back online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-voice-process') {
    event.waitUntil(processQueuedVoiceMessages());
  } else if (event.tag === 'background-photo-process') {
    event.waitUntil(processQueuedPhotos());
  }
});

// Handle message events from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_VOICE_MESSAGE':
      cacheVoiceMessage(data);
      break;
      
    case 'CACHE_PHOTO_MESSAGE':
      cachePhotoMessage(data);
      break;
      
    case 'CLEAR_CACHE':
      clearAppCache();
      break;
  }
});

// Push notifications for message delivery reminders
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'You have a message from your past self ready to view!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: '2futureme-delivery',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Message',
        icon: '/assets/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: '/assets/icons/dismiss-action.png'
      }
    ],
    data: {
      url: '/?action=vault'
    }
  };

  event.waitUntil(
    self.registration.showNotification('2FutureMe - Message Ready!', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Helper functions
async function processQueuedVoiceMessages() {
  try {
    console.log('[SW] Processing queued voice messages');
    // Implementation for processing voice messages when back online
    // This could involve uploading to cloud storage if implemented
  } catch (error) {
    console.error('[SW] Failed to process voice messages:', error);
  }
}

async function processQueuedPhotos() {
  try {
    console.log('[SW] Processing queued photos');
    // Implementation for processing photos when back online
    // This could involve cloud backup if implemented
  } catch (error) {
    console.error('[SW] Failed to process photos:', error);
  }
}

async function cacheVoiceMessage(messageData) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(messageData.blob, {
      headers: {
        'Content-Type': messageData.mimeType,
        'Content-Length': messageData.blob.size
      }
    });
    await cache.put(`/cached-messages/voice-${messageData.id}`, response);
    console.log('[SW] Voice message cached');
  } catch (error) {
    console.error('[SW] Failed to cache voice message:', error);
  }
}

async function cachePhotoMessage(messageData) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(messageData.blob, {
      headers: {
        'Content-Type': messageData.mimeType,
        'Content-Length': messageData.blob.size
      }
    });
    await cache.put(`/cached-messages/photo-${messageData.id}`, response);
    console.log('[SW] Photo message cached');
  } catch (error) {
    console.error('[SW] Failed to cache photo message:', error);
  }
}

async function clearAppCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

// Periodic background sync to check for ready messages
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-ready-messages') {
    event.waitUntil(checkForReadyMessages());
  }
});

async function checkForReadyMessages() {
  try {
    console.log('[SW] Checking for ready messages');
    
    // Get all clients (open tabs/windows)
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Send message to main app to check vault
      clients[0].postMessage({
        type: 'CHECK_READY_MESSAGES'
      });
    }
  } catch (error) {
    console.error('[SW] Failed to check ready messages:', error);
  }
}

// Handle app shortcuts
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle shortcut URLs
  if (url.searchParams.has('action')) {
    const action = url.searchParams.get('action');
    
    event.respondWith(
      caches.match('/')
        .then((response) => {
          if (response) {
            // Clone response and modify to include action data
            return response.text().then((html) => {
              const modifiedHtml = html.replace(
                '<body>',
                `<body data-shortcut-action="${action}">`
              );
              return new Response(modifiedHtml, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText
              });
            });
          }
          return fetch(event.request);
        })
    );
  }
});

// Update available notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.waitUntil(checkForUpdates(event.ports[0]));
  }
});

async function checkForUpdates(port) {
  try {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    
    port.postMessage({
      type: 'UPDATE_STATUS',
      hasUpdate: manifest.version !== CACHE_NAME.split('-v')[1],
      version: manifest.version
    });
  } catch (error) {
    console.error('[SW] Failed to check for updates:', error);
    port.postMessage({
      type: 'UPDATE_ERROR',
      error: error.message
    });
  }
}