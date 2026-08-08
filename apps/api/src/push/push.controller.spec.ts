import type { UserSession } from "@thallesp/nestjs-better-auth"
import { PushController } from "./push.controller"
import { PushService } from "./push.service"

describe("PushController", () => {
  let controller: PushController
  let service: {
    getVapidPublicKey: jest.Mock
    subscribe: jest.Mock
    unsubscribe: jest.Mock
  }

  const session = { user: { id: "user-1", role: "PATIENT" } } as UserSession

  beforeEach(() => {
    service = {
      getVapidPublicKey: jest.fn().mockReturnValue("vapid-key"),
      subscribe: jest.fn().mockResolvedValue({ ok: true }),
      unsubscribe: jest.fn().mockResolvedValue({ ok: true }),
    }
    controller = new PushController(service as unknown as PushService)
  })

  it("getVapidPublicKey wraps the key", () => {
    expect(controller.getVapidPublicKey()).toEqual({ publicKey: "vapid-key" })
    expect(service.getVapidPublicKey).toHaveBeenCalled()
  })

  it("subscribe delegates with the user id and dto", async () => {
    const dto = {
      endpoint: "https://push.example.com/x",
      keys: { p256dh: "k", auth: "a" },
    }
    await expect(controller.subscribe(session, dto as never)).resolves.toEqual({
      ok: true,
    })
    expect(service.subscribe).toHaveBeenCalledWith("user-1", dto)
  })

  it("unsubscribe delegates with the endpoint", async () => {
    const dto = { endpoint: "https://push.example.com/x" }
    await controller.unsubscribe(session, dto as never)
    expect(service.unsubscribe).toHaveBeenCalledWith(
      "user-1",
      "https://push.example.com/x",
    )
  })
})
