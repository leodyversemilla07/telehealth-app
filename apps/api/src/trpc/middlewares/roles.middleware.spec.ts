import { TRPCError } from "@trpc/server"
import type { MiddlewareOptions } from "nestjs-trpc"
import { RolesMiddleware } from "./roles.middleware"

function makeOpts(overrides: {
  role?: string
  roles?: string[]
}): MiddlewareOptions {
  return {
    ctx: { user: { id: "user-1", email: "a@b.c", role: overrides.role } },
    type: "query",
    path: "doctors.myProfile",
    input: undefined,
    getRawInput: async () => ({}),
    meta: { roles: overrides.roles },
    signal: undefined,
    next: async ({ ctx } = {}) => ({ ok: true, data: "ok", ctx }),
  } as unknown as MiddlewareOptions
}

describe("RolesMiddleware", () => {
  const middleware = new RolesMiddleware()

  it("lets a user through when their role is in meta.roles", async () => {
    const result = await middleware.use(
      makeOpts({ role: "DOCTOR", roles: ["DOCTOR"] }),
    )
    expect(result.ok).toBe(true)
  })

  it("lets any authenticated user through when meta.roles is absent", async () => {
    const result = await middleware.use(makeOpts({ role: "PATIENT" }))
    expect(result.ok).toBe(true)
  })

  it("rejects a user whose role is not in meta.roles", async () => {
    const opts = makeOpts({ role: "PATIENT", roles: ["DOCTOR"] })
    await expect(middleware.use(opts)).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
    await expect(middleware.use(opts)).rejects.toBeInstanceOf(TRPCError)
  })

  it("rejects a user with no role when a role is required", async () => {
    const opts = makeOpts({ role: undefined, roles: ["DOCTOR"] })
    await expect(middleware.use(opts)).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
  })
})
