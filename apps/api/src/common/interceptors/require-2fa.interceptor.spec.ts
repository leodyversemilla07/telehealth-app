import "reflect-metadata"
import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { lastValueFrom, of } from "rxjs"
import { Require2FaInterceptor } from "./require-2fa.interceptor"

describe("Require2FaInterceptor", () => {
  const reflector = new Reflector()
  let interceptor: Require2FaInterceptor

  function makeContext(roles: string[] | undefined, sessionUser?: unknown) {
    const request = sessionUser ? { session: { user: sessionUser } } : {}
    const handler = (() => {}) as never
    if (roles) {
      Reflect.defineMetadata("ROLES", roles, handler)
    }
    return {
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext
  }

  async function run(context: ExecutionContext): Promise<boolean> {
    const callHandler: CallHandler = { handle: () => of("ok") }
    const out = await lastValueFrom(
      interceptor.intercept(context, callHandler) as never,
    )
    return out === "ok"
  }

  beforeEach(() => {
    interceptor = new Require2FaInterceptor(reflector)
  })

  it("passes routes without roles metadata (public)", async () => {
    expect(
      await run(
        makeContext(undefined, { role: "ADMIN", twoFactorEnabled: false }),
      ),
    ).toBe(true)
  })

  it("passes routes open to PATIENT (shared, enforced on every role)", async () => {
    for (const user of [
      { role: "PATIENT", twoFactorEnabled: false },
      { role: "DOCTOR", twoFactorEnabled: false },
      { role: "ADMIN", twoFactorEnabled: false },
    ]) {
      expect(await run(makeContext(["PATIENT", "DOCTOR"], user))).toBe(true)
    }
  })

  it("passes privileged sessions with 2FA enabled on admin routes", async () => {
    expect(
      await run(
        makeContext(["ADMIN"], { role: "ADMIN", twoFactorEnabled: true }),
      ),
    ).toBe(true)
    expect(
      await run(
        makeContext(["DOCTOR", "ADMIN"], {
          role: "DOCTOR",
          twoFactorEnabled: true,
        }),
      ),
    ).toBe(true)
  })

  it("blocks a privileged session without 2FA on an admin route", async () => {
    await expect(
      run(makeContext(["ADMIN"], { role: "ADMIN", twoFactorEnabled: false })),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("blocks a doctor without 2FA on DOCTOR/ADMIN-only routes", async () => {
    await expect(
      run(
        makeContext(["DOCTOR", "ADMIN"], {
          role: "DOCTOR",
          twoFactorEnabled: false,
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("blocks privileged sessions when 2FA status is unknown (undefined)", async () => {
    await expect(
      run(makeContext(["ADMIN"], { role: "ADMIN" })),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("passes a non-privileged session on a privileged-only route (guard owns the role check)", async () => {
    expect(
      await run(
        makeContext(["ADMIN"], { role: "PATIENT", twoFactorEnabled: false }),
      ),
    ).toBe(true)
  })

  it("passes when no session is attached (route already guard-protected)", async () => {
    expect(await run(makeContext(["ADMIN"]))).toBe(true)
  })
})
