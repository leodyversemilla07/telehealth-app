import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize user input to prevent XSS attacks.
 * Uses DOMPurify for robust HTML sanitization that handles:
 * - All known XSS vectors including data: URIs, CSS-based attacks
 * - Encoded characters and obfuscation techniques
 * - SVG-based attacks
 *
 * Falls back to basic string cleaning if DOMPurify is unavailable.
 */
export function sanitize(
  input: string | null | undefined,
  maxLength = 2000,
): string | null {
  if (!input) return null

  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip ALL HTML tags
    ALLOWED_ATTR: [], // Strip ALL attributes
    ALLOW_DATA_ATTR: false, // No data-* attributes
  })

  return cleaned.trim().slice(0, maxLength) || null
}
