import type { UserSession } from "@thallesp/nestjs-better-auth"
import { SecurityAlertsController } from "./security-alerts.controller"
import { SecurityAlertsService } from "./security-alerts.service"

describe("SecurityAlertsController", () => {
  let controller: SecurityAlertsController
  let service: {
    getAlerts: jest.Mock
    markAsRead: jest.Mock
  }

  const session = { user: { id: "user-1", role: "PATIENT" } } as UserSession

  beforeEach(() => {
    service = {
      getAlerts: jest.fn().mockResolvedValue([]),
      markAsRead: jest.fn().mockResolvedValue({ count: 2 }),
    }
    controller = new SecurityAlertsController(
      service as unknown as SecurityAlertsService,
    )
  })

  it("getMyAlerts delegates with the user id", async () => {
    await expect(controller.getMyAlerts(session)).resolves.toEqual([])
    expect(service.getAlerts).toHaveBeenCalledWith("user-1")
  })

  it("readAllMyAlerts delegates with the user id", async () => {
    await expect(controller.readAllMyAlerts(session)).resolves.toEqual({
      count: 2,
    })
    expect(service.markAsRead).toHaveBeenCalledWith("user-1")
  })
})
