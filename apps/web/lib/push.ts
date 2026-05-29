"use client"

import { apiClient } from "@/lib/api-client"
import { env } from "@/lib/env"

// ── Helpers ────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return view
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready
    return reg
  } catch (err) {
    console.warn("[Push] Service worker registration failed:", err)
    return null
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await getServiceWorkerRegistration()
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

// ── Subscribe ─────────────────────────────────────────────────────────────

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  const vapidKey = env.NEXT_PUBLIC_VAPID_KEY
  if (!vapidKey) {
    console.warn("[Push] NEXT_PUBLIC_VAPID_KEY is not configured")
    return null
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    console.warn("[Push] Notification permission denied")
    return null
  }

  const reg = await getServiceWorkerRegistration()
  if (!reg) return null

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  // Register subscription with the API
  const sub = subscription.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  await apiClient.post("/push/subscribe", {
    endpoint: sub.endpoint,
    keys: sub.keys,
    userAgent: navigator.userAgent,
  })

  return subscription
}

// ── Unsubscribe ───────────────────────────────────────────────────────────

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentSubscription()
  if (!sub) return false

  try {
    await apiClient.delete("/push/subscribe", {
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
  } catch {
    // Best-effort API call; always unsubscribe locally
  }

  await sub.unsubscribe()
  return true
}
