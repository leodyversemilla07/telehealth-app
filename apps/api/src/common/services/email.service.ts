import { Injectable, Logger } from "@nestjs/common"
import { sendEmail } from "../utils/email"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  async sendMail(options: {
    to: string
    subject: string
    html: string
  }): Promise<void> {
    await sendEmail(options)
    this.logger.log(`Email sent to ${options.to}`)
  }

  async sendSecurityAlert(
    email: string,
    title: string,
    message: string,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `[Telehealth Platform] Security Alert: ${escapeHtml(title)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Security Alert</h2>
          <p style="color: #333; line-height: 1.6;">${escapeHtml(message)}</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            If you did not perform this action, please contact support immediately.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Telehealth Platform - This is an automated security notification.
          </p>
        </div>
      `,
    })
  }

  async sendAppointmentConfirmation(
    email: string,
    patientName: string,
    doctorName: string,
    appointmentTime: string,
    type: string,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `[Telehealth Platform] Appointment Confirmed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Appointment Confirmed</h2>
          <p style="color: #333; line-height: 1.6;">
            Hello ${escapeHtml(patientName)},
          </p>
          <p style="color: #333; line-height: 1.6;">
            Your ${escapeHtml(type.toLowerCase())} consultation with <strong>Dr. ${escapeHtml(doctorName)}</strong> has been booked for <strong>${escapeHtml(appointmentTime)}</strong>.
          </p>
          <p style="color: #333; line-height: 1.6;">
            Please ensure you are available at the scheduled time. You can join the consultation from your dashboard.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Telehealth Platform - This is an automated notification.
          </p>
        </div>
      `,
    })
  }

  async sendAppointmentReminder(
    email: string,
    recipientName: string,
    otherPartyName: string,
    appointmentTime: string,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `[Telehealth Platform] Upcoming Appointment Reminder`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Appointment Reminder</h2>
          <p style="color: #333; line-height: 1.6;">
            Hello ${escapeHtml(recipientName)},
          </p>
          <p style="color: #333; line-height: 1.6;">
            This is a reminder that you have an upcoming consultation with <strong>${escapeHtml(otherPartyName)}</strong> scheduled for <strong>${escapeHtml(appointmentTime)}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Telehealth Platform - This is an automated notification.
          </p>
        </div>
      `,
    })
  }

  async sendAppointmentCancellation(
    email: string,
    recipientName: string,
    cancelledByName: string,
    appointmentTime: string,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `[Telehealth Platform] Appointment Cancelled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Appointment Cancelled</h2>
          <p style="color: #333; line-height: 1.6;">
            Hello ${escapeHtml(recipientName)},
          </p>
          <p style="color: #333; line-height: 1.6;">
            The appointment with <strong>${escapeHtml(cancelledByName)}</strong> scheduled for <strong>${escapeHtml(appointmentTime)}</strong> has been cancelled.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Telehealth Platform - This is an automated notification.
          </p>
        </div>
      `,
    })
  }
}
