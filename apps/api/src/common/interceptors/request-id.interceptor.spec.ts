import type { ExecutionContext } from "@nestjs/common"
import { of } from "rxjs"
import { RequestIdInterceptor } from "./request-id.interceptor"

describe("RequestIdInterceptor", () => {
  let interceptor: RequestIdInterceptor
  let request: { headers: Record<string, string>; requestId?: string }
  let response: { setHeader: jest.Mock }

  beforeEach(() => {
    interceptor = new RequestIdInterceptor()
    request = { headers: {} }
    response = { setHeader: jest.fn() }
  })

  function buildContext(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext
  }

  it("generates a request id when no header is supplied", () => {
    const callHandler = { handle: () => of({ ok: true }) }
    interceptor.intercept(buildContext(), callHandler as never).subscribe()

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-Request-Id",
      request.requestId,
    )
  })

  it("honours an upstream x-request-id header", () => {
    request.headers["x-request-id"] = "trace-42"
    const callHandler = { handle: () => of({ ok: true }) }
    interceptor.intercept(buildContext(), callHandler as never).subscribe()

    expect(request.requestId).toBe("trace-42")
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", "trace-42")
  })

  it("emits the handled value downstream", (done) => {
    const callHandler = { handle: () => of({ hello: "world" }) }
    interceptor
      .intercept(buildContext(), callHandler as never)
      .subscribe((value) => {
        expect(value).toEqual({ hello: "world" })
        done()
      })
  })
})
