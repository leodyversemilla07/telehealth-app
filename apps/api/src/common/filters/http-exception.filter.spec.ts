import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { HttpExceptionFilter } from "./http-exception.filter"

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter
  let req: { url: string; requestId?: string }
  let res: {
    setHeader: jest.Mock
    status: jest.Mock
    json: jest.Mock
  }
  let host: ArgumentsHost

  beforeEach(() => {
    filter = new HttpExceptionFilter()
    req = { url: "/api/things" }
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    host = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ArgumentsHost
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("shapes a plain HttpException with a derived code", () => {
    const err = new HttpException("Not allowed", HttpStatus.FORBIDDEN)
    filter.catch(err, host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toMatchObject({
      statusCode: HttpStatus.FORBIDDEN,
      message: "Not allowed",
      error: "Not allowed",
      path: "/api/things",
    })
    expect(payload.code).toBe("FORBIDDEN")
    expect(payload.requestId).toBeUndefined()
    expect(typeof payload.timestamp).toBe("string")
  })

  it("keeps an explicit error code from the exception response", () => {
    const err = new HttpException(
      { code: "SLOT_UNAVAILABLE", message: "Taken" },
      HttpStatus.CONFLICT,
    )
    filter.catch(err, host)

    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload.code).toBe("SLOT_UNAVAILABLE")
    expect(payload.message).toBe("Taken")
  })

  it("joins an array message and exposes it as details", () => {
    const err = new HttpException(
      { message: ["email is required", "name is required"] },
      HttpStatus.BAD_REQUEST,
    )
    filter.catch(err, host)

    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload.message).toBe("email is required, name is required")
    expect(payload.error).toBe("email is required, name is required")
    expect(payload.details).toEqual(["email is required", "name is required"])
  })

  it("passes explicit details through", () => {
    const err = new HttpException(
      { message: "nope", details: { hoursBeforeStart: 24 } },
      HttpStatus.UNPROCESSABLE_ENTITY,
    )
    filter.catch(err, host)

    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload.details).toEqual({ hoursBeforeStart: 24 })
  })

  it("maps an unknown error to a 500 and logs a stack", () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined)
    const boom = new Error("kaboom")

    filter.catch(boom, host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload.code).toBe("INTERNAL_ERROR")
    expect(payload.message).toBe("Internal Server Error")
    expect(errorSpy).toHaveBeenCalled()
  })

  it("logs a warn for client errors and prefixes with the request id", () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined)
    req.requestId = "req-123"

    filter.catch(new HttpException("bad", HttpStatus.BAD_REQUEST), host)

    expect(warnSpy).toHaveBeenCalled()
    expect(String(warnSpy.mock.calls[0][0])).toContain("[req-123]")
  })

  it("adds rate-limit headers on 429 responses", () => {
    filter.catch(
      new HttpException("too many", HttpStatus.TOO_MANY_REQUESTS),
      host,
    )

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "60")
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "30")
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "0")
    expect(res.setHeader).toHaveBeenCalledWith(
      "X-RateLimit-Reset",
      expect.stringMatching(/^\d+$/),
    )
  })

  it("includes the request id in the response body when present", () => {
    req.requestId = "req-abc"

    filter.catch(new HttpException("nope", HttpStatus.BAD_REQUEST), host)

    const payload = res.json.mock.calls[0][0] as Record<string, unknown>
    expect(payload.requestId).toBe("req-abc")
  })
})
