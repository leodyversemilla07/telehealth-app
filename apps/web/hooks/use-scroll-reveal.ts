"use client"

import { useEffect, useRef } from "react"

/**
 * Applies scroll-triggered reveal animations to elements.
 * Usage: `<div ref={scrollRef} className="reveal-on-scroll">`
 *
 * Elements with `.reveal-on-scroll` get the `.revealed` class
 * when they enter the viewport.
 */
export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const cards = el.querySelectorAll<HTMLElement>(".reveal-on-scroll")

    if (cards.length === 0) {
      // Single element mode
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry?.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        },
        { threshold: 0.15 },
      )
      observer.observe(el)
      return () => observer.disconnect()
    }

    // Multiple children mode (stagger)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15 },
    )

    for (const card of cards) {
      observer.observe(card)
    }

    return () => observer.disconnect()
  })

  return ref
}
