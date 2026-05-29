import { Logger } from "@nestjs/common"
import * as nodemailer from "nodemailer"

const logger = new Logger("Email")

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: `"Telehealth Platform" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    logger.log(`Email sent to ${options.to} — ${options.subject}`)
  } catch (error: unknown) {
    logger.error(
      `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function sendSecurityAlertEmail(
  email: string,
  title: string,
  message: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `[Telehealth Platform] Security Alert: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Security Alert</h2>
        <p style="color: #333; line-height: 1.6;">${message}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          If you did not perform this action, please contact support immediately.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 11px;">
          Telehealth Platform — This is an automated security notification.
        </p>
      </div>
    `,
  })
}
