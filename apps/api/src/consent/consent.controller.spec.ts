import type { UserSession } from "@thallesp/nestjs-better-auth"
import { ConsentController } from "./consent.controller"
import { ConsentService } from "./consent.service"
import { RecordConsentDto } from "./dto"

describe("ConsentController", () => {
  let controller: ConsentController
  let service: {
    recordConsent: jest.Mock
    getUserConsents: jest.Mock
  }

  const baseSession = {
    user: { id: "user-1", role: "PATIENT" },
    session: { id: "sess-1" },
  } as UserSession

  beforeEach(() => {
    service = {
      recordConsent: jest.fn().mockResolvedValue({ id: "consent-1" }),
      getUserConsents: jest.fn().mockResolvedValue([]),
    }
    controller = new ConsentController(service as unknown as ConsentService)
  })

  it("recordConsent passes the session IP address", async () => {
    const session = {
      ...baseSession,
      session: { id: "sess-1", ipAddress: "203.0.113.10" },
    } as UserSession
    const dto = {
      consentType: "privacy_policy",
      granted: true,
    } as RecordConsentDto

    await controller.recordConsent(session, dto)

    expect(service.recordConsent).toHaveBeenCalledWith(
      "user-1",
      "privacy_policy",
      true,
      "203.0.113.10",
    )
  })

  it("recordConsent passes undefined IP when absent", async () => {
    const dto = {
      consentType: "data_sharing",
      granted: false,
    } as RecordConsentDto

    await controller.recordConsent(baseSession, dto)

    expect(service.recordConsent).toHaveBeenCalledWith(
      "user-1",
      "data_sharing",
      false,
      undefined,
    )
  })

  it("recordConsent passes undefined IP when session is not an object", async () => {
    const session = {
      ...baseSession,
      session: "opaque-token" as never,
    } as UserSession
    const dto = {
      consentType: "privacy_policy",
      granted: true,
    } as RecordConsentDto

    await controller.recordConsent(session, dto)

    expect(service.recordConsent).toHaveBeenCalledWith(
      "user-1",
      "privacy_policy",
      true,
      undefined,
    )
  })

  it("getMyConsents delegates with the user id", async () => {
    await expect(controller.getMyConsents(baseSession)).resolves.toEqual([])
    expect(service.getUserConsents).toHaveBeenCalledWith("user-1")
  })
})
