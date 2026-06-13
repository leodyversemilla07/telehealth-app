import { Logger } from "@nestjs/common"
import * as nodemailer from "nodemailer"

const logger = new Logger("Email")

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

let transporter: nodemailer.Transporter | null = null

/**
 * Email provider configuration.
 * Supports:
 * - AWS SES (production) - Uses SMTP interface
 * - Gmail (development fallback)
 */
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const provider = process.env.EMAIL_PROVIDER || "ses"

    if (provider === "ses" && process.env.SMTP_ENDPOINT) {
      // AWS SES SMTP interface
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_ENDPOINT,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      logger.log("Email transporter: AWS SES")
    } else if (provider === "gmail") {
      // Gmail SMTP (development only)
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      logger.log("Email transporter: Gmail SMTP")
    } else {
      // Fallback to Ethereal for development only
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "No email provider configured in production. Emails will not be sent.",
        )
        // Return a no-op transporter that silently drops emails
        transporter = {
          sendMail: async () => {
            logger.error("Email not sent — no provider configured")
          },
        } as unknown as nodemailer.Transporter
      } else {
        logger.warn("No email provider configured. Using Ethereal (test only)")
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: "test@ethereal.email",
            pass: "test",
          },
        })
      }
    }
  }
  return transporter
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    const fromAddress =
      process.env.EMAIL_FROM || "Telehealth Platform <noreply@tele-health.app>"

    await getTransporter().sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    logger.log(`Email sent to ${options.to} — ${options.subject}`)
  } catch (error: unknown) {
    logger.error(
      `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : String(error)}`,
    )
    // Don't throw - allow auth flow to continue even if email fails
  }
}

export async function sendSecurityAlertEmail(
  email: string,
  title: string,
  message: string,
): Promise<void> {
  await sendEmail({
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
