/**
 * Mock for isomorphic-dompurify in Jest tests.
 *
 * DOMPurify is a browser-oriented library that requires jsdom.
 * In unit tests we only need the API shape, not real HTML sanitization.
 */
export default {
  sanitize: (input: string, _options?: Record<string, unknown>) => input,
}
