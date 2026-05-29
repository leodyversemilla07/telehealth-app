// public/sw.js — Telehealth App Service Worker for Web Push Notifications
// This file MUST be at the root of /public so it's served at /sw.js

self.addEventListener("install", (event) => {
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// ── Push event ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "New Notification", body: "", url: "/" }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body || undefined,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "telehealth-notification",
    renotify: true,
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "dismiss") return

  const targetUrl = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app tab is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus()
            client.navigate(targetUrl)
            return
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      }),
  )
})
