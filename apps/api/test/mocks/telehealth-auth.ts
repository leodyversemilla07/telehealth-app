/**
 * Mock for @telehealth/auth (packages/auth) — used by full-AppModule e2e
 * specs (CRM-style: compile the real AppModule, drive it over HTTP).
 *
 * packages/auth is ESM-only (better-auth) so jest CJS cannot load it. This
 * stub mirrors the real contract: `createAuth(config)` returns an `auth`
 * object whose `api.getSession({ headers })` resolves the request session —
 * here a shared jest.fn so specs can seed sessions per request.
 */

export type MockUserSession = {
  user: { id: string; role: string; email?: string }
  session?: { id?: string }
}

export const mockGetSession = jest.fn<
  Promise<MockUserSession | null>,
  [{ headers: Headers }]
>(() => Promise.resolve(null))

export const createAuth = jest.fn((config: object) => ({
  ...config,
  api: { getSession: mockGetSession },
}))

// Matches src/auth/auth.ts's `export const auth = createAuth({...})` shape,
// re-exported so callers can read the same mocked instance.
export const auth = { api: { getSession: mockGetSession } }
