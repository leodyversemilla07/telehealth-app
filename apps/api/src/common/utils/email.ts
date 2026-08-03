import { Logger } from "@nestjs/common"
import * as nodemailer from "nodemailer"

const logger = new Logger("Email")

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
  /** Plain-text message. Use for security-sensitive auth emails. */
  text?: string
  /** Rich HTML message for transactional notifications. */
  html?: string
  /**
   * When true, a delivery failure rethrows after logging instead of being
   * silently swallowed. Use for security-critical flows (e.g. password
   * reset) where the caller must not claim success if the email failed.
   */
  critical?: boolean
}): Promise<void> {
  try {
    if (!options.text && !options.html) {
      throw new Error("Email requires a plain-text or HTML body")
    }

    const fromAddress =
      process.env.EMAIL_FROM || "Telehealth App <noreply@tele-health.app>"

    await getTransporter().sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    logger.log(`Email sent to ${options.to} — ${options.subject}`)
  } catch (error: unknown) {
    logger.error(
      `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : String(error)}`,
    )
    // Re-surface failures for critical flows so the caller can respond with
    // an explicit error instead of silently pretending the email was sent.
    if (options.critical) {
      throw error
    }
  }
}

export async function sendSecurityAlertEmail(
  email: string,
  title: string,
  message: string,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `[Telehealth App] Security Alert: ${title}`,
    // Plain text — security-sensitive emails must not rely on rich HTML.
    text: `${title}

${message}

If you did not perform this action, please contact support immediately.

— Telehealth App`,
  })
}
