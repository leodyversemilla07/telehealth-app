import { TRPCError } from "@trpc/server"
import type { MiddlewareOptions } from "nestjs-trpc"
import { RolesMiddleware } from "./roles.middleware"

function makeOpts(overrides: {
  role?: string
  roles?: string[]
  twoFactorEnabled?: boolean
}): MiddlewareOptions {
  return {
    ctx: {
      user: {
        id: "user-1",
        email: "a@b.c",
        role: overrides.role,
        twoFactorEnabled: overrides.twoFactorEnabled ?? true,
      },
    },
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

  it("blocks a DOCTOR without 2FA on a privileged-only procedure", async () => {
    const opts = makeOpts({
      role: "DOCTOR",
      roles: ["DOCTOR"],
      twoFactorEnabled: false,
    })
    await expect(middleware.use(opts)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("Two-factor"),
    })
  })

  it("lets a DOCTOR with 2FA through on a privileged-only procedure", async () => {
    const opts = makeOpts({ role: "DOCTOR", roles: ["DOCTOR"] })
    const result = await middleware.use(opts)
    expect(result.ok).toBe(true)
  })

  it("blocks an ADMIN without 2FA on an admin-only procedure", async () => {
    const opts = makeOpts({
      role: "ADMIN",
      roles: ["ADMIN"],
      twoFactorEnabled: false,
    })
    await expect(middleware.use(opts)).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
  })

  it("does not require 2FA when the procedure also allows PATIENT", async () => {
    const opts = makeOpts({
      role: "DOCTOR",
      roles: ["DOCTOR", "PATIENT"],
      twoFactorEnabled: false,
    })
    const result = await middleware.use(opts)
    expect(result.ok).toBe(true)
  })

  it("does not require 2FA for a PATIENT on a patient-only procedure", async () => {
    const opts = makeOpts({
      role: "PATIENT",
      roles: ["PATIENT"],
      twoFactorEnabled: false,
    })
    const result = await middleware.use(opts)
    expect(result.ok).toBe(true)
  })
})
