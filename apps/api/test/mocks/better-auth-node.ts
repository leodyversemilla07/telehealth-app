/**
 * CJS stub for `better-auth/node` (ESM-only `.mjs` — jest CJS cannot import
 * it). TrpcContext only calls `fromNodeHeaders` inside its per-request
 * `create()` (session resolution), never at boot — so a stub that records the
 * call is sufficient for tests that instantiate the tRPC module graph.
 */
export const fromNodeHeaders = jest.fn(() => new Headers())

export const toNodeHandler = null

export const toNodeMiddleware = null
