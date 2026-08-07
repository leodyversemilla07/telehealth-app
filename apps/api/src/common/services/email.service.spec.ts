import { sendEmail } from "../utils/email"
import { EmailService } from "./email.service"

jest.mock("../utils/email")

const sendEmailMock = jest.mocked(sendEmail)

describe("EmailService", () => {
  let service: EmailService

  beforeEach(() => {
    jest.clearAllMocks()
    sendEmailMock.mockResolvedValue(undefined)
    service = new EmailService()
  })

  it("sendMail forwards the options to the util", async () => {
    await service.sendMail({ to: "a@b.c", subject: "hi", text: "body" })
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: "a@b.c",
      subject: "hi",
      text: "body",
    })
  })

  it("sendSecurityAlert uses a plain-text alert body", async () => {
    await service.sendSecurityAlert("u@b.c", "Suspicious login", "Detail line")

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@b.c",
        subject: "[Telehealth App] Security Alert: Suspicious login",
        text: expect.stringContaining("Detail line"),
      }),
    )
  })

  it("sendAppointmentConfirmation escapes user-controlled fields into HTML", async () => {
    await service.sendAppointmentConfirmation(
      "u@b.c",
      "Ana <script>alert(1)</script>",
      "Dr. <img src=x onerror=alert(1)>",
      "Aug 2, 2026",
      "video",
    )

    const args = sendEmailMock.mock.calls[0][0] as { html: string }
    expect(args.subject).toBe("[Telehealth App] Appointment Confirmed")
    expect(args.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(args.html).not.toContain("<script>")
  })

  it("sendAppointmentReminder forwards recipient details", async () => {
    await service.sendAppointmentReminder(
      "u@b.c",
      "Ana",
      "Dr. Smith",
      "Aug 2, 2026",
    )

    const args = sendEmailMock.mock.calls[0][0] as { html: string }
    expect(args.subject).toBe("[Telehealth App] Upcoming Appointment Reminder")
    expect(args.html).toContain("Ana")
    expect(args.html).toContain("Dr. Smith")
  })

  it("sendAppointmentCancellation forwards cancellation details", async () => {
    await service.sendAppointmentCancellation(
      "u@b.c",
      "Ana",
      "Dr. Smith",
      "Aug 2, 2026",
    )

    const args = sendEmailMock.mock.calls[0][0] as { html: string }
    expect(args.subject).toBe("[Telehealth App] Appointment Cancelled")
    expect(args.html).toContain("Ana")
    expect(args.html).toContain("Dr. Smith")
  })
})
