import { beforeEach, describe, expect, it, vi } from "vitest"
import { createLogger } from "@/lib/logger"

describe("createLogger", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

  beforeEach(() => {
    vi.unstubAllEnvs()
    for (const spy of [logSpy, debugSpy, infoSpy, warnSpy, errorSpy]) {
      spy.mockClear()
    }
  })

  it("logs a timestamped, tagged INFO message in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    createLogger("auth").info("hello world")
    const message = infoSpy.mock.calls[0]?.[0] as string
    expect(message).toMatch(/^\[.*\] \[INFO\] \[auth\] hello world$/)
    expect(message).toMatch(/\[INFO\]/)
  })

  it("channels each level to its own console method", () => {
    vi.stubEnv("NODE_ENV", "development")
    const logger = createLogger("app")
    logger.debug("d")
    logger.info("i")
    logger.warn("w")
    logger.error("e")
    expect(debugSpy.mock.calls[0]?.[0]).toContain("[DEBUG] [app] d")
    expect(infoSpy.mock.calls[0]?.[0]).toContain("[INFO] [app] i")
    expect(warnSpy.mock.calls[0]?.[0]).toContain("[WARN] [app] w")
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[ERROR] [app] e")
  })

  it("spreads extra arguments to the console", () => {
    vi.stubEnv("NODE_ENV", "development")
    createLogger("x").warn("failed", { code: 42 })
    expect(warnSpy.mock.calls[0]?.[1]).toEqual({ code: 42 })
  })

  it("silences debug/info in production, keeping warn/error", () => {
    vi.stubEnv("NODE_ENV", "production")
    const logger = createLogger("prod")
    logger.debug("hidden")
    logger.info("hidden too")
    logger.warn("keep me")
    logger.error("keep me too")
    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy.mock.calls[0]?.[0]).toContain("[WARN] [prod] keep me")
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[ERROR] [prod] keep me too")
  })
})
