import { Logger } from "@nestjs/common"
import { Resend } from "resend"
import { sendEmail, sendSecurityAlertEmail } from "./email"

jest.mock("resend", () => {
  const sent: unknown[] = []
  return {
    Resend: class {
      apiKey: string
      emails: { send: jest.Mock }
      constructor(apiKey: string) {
        this.apiKey = apiKey
        this.emails = {
          send: jest.fn().mockResolvedValue({ error: null, data: {} }),
        }
        sent.push(this)
      }
      static __sent: unknown[] = sent
    },
  }
})

const resendMock = Resend as unknown as {
  __sent: Array<{ apiKey: string; emails: { send: jest.Mock } }>
}

/** The single cached client (email util keeps a module-level singleton). */
function client(): {
  apiKey: string
  emails: { send: jest.Mock }
} {
  const c = resendMock.__sent[0]
  if (!c) throw new Error("Resend client not yet created")
  return c
}

describe("email util", () => {
  const originalKey = process.env.RESEND_API_KEY

  beforeEach(async () => {
    // clearAllMocks only clears call history — the factory's default send()
    // implementation survives, and every test overrides it explicitly.
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = "re_test_key"
    process.env.EMAIL_FROM = undefined
    // Warm-up: the util caches ONE Resend client as a module singleton; run a
    // harmless send so client() resolves to the real instance in every test.
    await sendEmail({
      to: "warmup@telehealth.app",
      subject: "warmup",
      text: "warmup",
    })
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = originalKey
    }
  })

  it("silently swallows a missing RESEND_API_KEY for non-critical mail", async () => {
    delete process.env.RESEND_API_KEY
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined)

    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", text: "body" }),
    ).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
  })

  it("rethrows a missing RESEND_API_KEY for critical mail", async () => {
    delete process.env.RESEND_API_KEY
    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", text: "body", critical: true }),
    ).rejects.toThrow("RESEND_API_KEY is not configured")
  })

  it("silently swallows missing text/html for non-critical mail", async () => {
    await expect(
      sendEmail({ to: "a@b.c", subject: "hi" }),
    ).resolves.toBeUndefined()
  })

  it("rethrows missing text/html for critical mail", async () => {
    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", critical: true }),
    ).rejects.toThrow("Email requires a plain-text or HTML body")
  })

  it("sends through Resend, creates the client once, and logs success", async () => {
    const logSpy = jest
      .spyOn(Logger.prototype, "log")
      .mockImplementation(() => undefined)
    client().emails.send.mockResolvedValue({ error: null, data: {} })

    await sendEmail({ to: "a@b.c", subject: "hi", text: "body" })
    await sendEmail({ to: "a@b.c", subject: "hi", text: "body" })

    expect(resendMock.__sent).toHaveLength(1) // singleton, not recreated
    expect(client().emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.c", subject: "hi", text: "body" }),
    )
    expect(logSpy).toHaveBeenCalled()
  })

  it("uses the EMAIL_FROM override when provided", async () => {
    process.env.EMAIL_FROM = "noreply@health.info"
    client().emails.send.mockResolvedValue({ error: null })

    await sendEmail({ to: "a@b.c", subject: "hi", text: "body" })

    expect(client().emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "noreply@health.info" }),
    )
  })

  it("sends html only when only html is provided", async () => {
    client().emails.send.mockResolvedValue({ error: null })

    await sendEmail({ to: "a@b.c", subject: "hi", html: "<p>rich</p>" })

    expect(client().emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>rich</p>" }),
    )
    expect(client().emails.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ text: expect.any(String) }),
    )
  })

  it("swallows delivery errors for non-critical mail", async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined)
    client().emails.send.mockResolvedValue({ error: new Error("down") })

    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", text: "body" }),
    ).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
  })

  it("rethrows for critical mail when delivery fails", async () => {
    client().emails.send.mockResolvedValue({ error: new Error("down") })

    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", text: "body", critical: true }),
    ).rejects.toThrow("down")
  })

  it("rethrows for critical mail when the SDK call itself throws", async () => {
    client().emails.send.mockRejectedValue(new Error("network"))

    await expect(
      sendEmail({ to: "a@b.c", subject: "hi", text: "body", critical: true }),
    ).rejects.toThrow("network")
  })

  it("sendSecurityAlertEmail uses a plain-text security subject", async () => {
    client().emails.send.mockResolvedValue({ error: null })

    await sendSecurityAlertEmail("u@b.c", "New login", "A new device logged in")

    expect(client().emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@b.c",
        subject: "[Telehealth App] Security Alert: New login",
        text: expect.stringContaining("A new device logged in"),
      }),
    )
  })
})
