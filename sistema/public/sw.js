const CACHE_NAME = "imperio-sucata-v1"
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/favicon_io/android-chrome-192x192.png",
  "/favicon_io/android-chrome-512x512.png",
  "/favicon_io/apple-touch-icon.png",
  "/favicon_io/favicon-32x32.png",
  "/favicon_io/favicon-16x16.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache opened")
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  // Ignorar requisições para recursos de desenvolvimento do Vite
  if (
    event.request.url.includes("@react-refresh") ||
    event.request.url.includes("manifest.json") ||
    event.request.url.includes("vite") ||
    event.request.url.includes("localhost:5173/@")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response
      }

      return fetch(event.request).catch((error) => {
        console.log("[SW] Fetch failed for:", event.request.url, error)
        // Retornar uma resposta padrão ou cache em caso de erro
        if (event.request.destination === "document") {
          return caches.match("/")
        }
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" })
      })
    }),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("[SW] Background sync triggered")
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData(),
    )
  }
})

async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = localStorage.getItem("offlineTransactions")
    if (offlineData) {
      const transactions = JSON.parse(offlineData)
      // Send to Firebase when online
      for (const transaction of transactions) {
        try {
          await fetch("/api/sync-transaction", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transaction),
          })
        } catch (syncError) {
          console.error("[SW] Error syncing individual transaction:", syncError)
        }
      }
      // Clear offline data after successful sync
      localStorage.removeItem("offlineTransactions")
    }
  } catch (error) {
    console.error("[SW] Error syncing offline data:", error)
  }
}
