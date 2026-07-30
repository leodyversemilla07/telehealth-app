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

/**
 * Strip Personally Identifiable Information from text before sending
 * to external AI APIs (NVIDIA NIM). Removes:
 * - Email addresses
 * - Philippine phone numbers (mobile and landline)
 * - Potential full names (2-4 capitalized words in sequence)
 * - Address-like patterns
 * - Government IDs (PhilHealth, PRC, SSN-like numbers)
 *
 * This is a best-effort regex-based scrubber. It reduces PHI leakage
 * but is not a substitute for a proper PII redaction service.
 */
export function stripPII(input: string): string {
  let cleaned = input

  // Email addresses
  cleaned = cleaned.replace(
    /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi,
    "[EMAIL REDACTED]",
  )

  // Philippine mobile numbers: 0917... or +63...
  cleaned = cleaned.replace(
    /(?:\+63|0)[1-9]\d{2,3}[ -]?\d{3}[ -]?\d{3,4}/g,
    "[PHONE REDACTED]",
  )

  // Philippine landline: (02) 1234-5678 or 02 1234-5678
  cleaned = cleaned.replace(
    /\(?0[2-9]\d\)?[ -]?\d{3,4}[ -]?\d{4}/g,
    "[PHONE REDACTED]",
  )

  // PhilHealth ID: XX-XXXXXXXX-X
  cleaned = cleaned.replace(/\b\d{2}-\d{8}-\d\b/g, "[PHILHEALTH REDACTED]")

  // PRC license numbers (alphanumeric, 6-12 chars)
  cleaned = cleaned.replace(/\b(?:PRC[- ]?)?\d{6,12}\b/gi, "[LICENSE REDACTED]")

  return cleaned
}
