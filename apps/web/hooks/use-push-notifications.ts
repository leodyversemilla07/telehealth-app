"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getCurrentSubscription,
  getServiceWorkerRegistration,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push"

export type PushPermission = "default" | "granted" | "denied" | "unsupported"

export interface UsePushNotificationsReturn {
  /** Whether the browser supports push notifications */
  isSupported: boolean
  /** Current browser notification permission state */
  permission: PushPermission
  /** Whether the user currently has an active push subscription */
  isSubscribed: boolean
  /** Whether a subscribe/unsubscribe operation is in progress */
  isLoading: boolean
  /** Subscribe the current browser to push notifications */
  subscribe: () => Promise<void>
  /** Unsubscribe the current browser from push notifications */
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<PushPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check initial state
  useEffect(() => {
    const supported = isPushSupported()
    setIsSupported(supported)

    if (!supported) {
      setPermission("unsupported")
      return
    }

    setPermission(Notification.permission as PushPermission)

    // Register SW and check for existing subscription
    ;(async () => {
      await getServiceWorkerRegistration()
      const existing = await getCurrentSubscription()
      setIsSubscribed(!!existing)
    })()
  }, [])

  const subscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      const sub = await subscribeToPush()
      if (sub) {
        setIsSubscribed(true)
        setPermission("granted")
      } else {
        // User denied or VAPID not configured
        setPermission(Notification.permission as PushPermission)
      }
    } catch (err) {
      console.error("[Push] Subscribe failed:", err)
      setPermission(Notification.permission as PushPermission)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      await unsubscribeFromPush()
      setIsSubscribed(false)
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
