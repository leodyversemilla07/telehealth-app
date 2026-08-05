import { Logger } from "@nestjs/common"
import { type CreateEmailOptions, Resend } from "resend"

const logger = new Logger("Email")

let resendClient: Resend | null = null

/**
 * Email provider: Resend SDK (production).
 *
 * Resend is our single email provider, so we use its official Node.js SDK
 * (resend.emails.send) rather than an SMTP shim. The API key is read from
 * RESEND_API_KEY at call time — env loads happen before this module is used
 * (apps/api/src/main.ts loads the root .env first).
 */
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
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
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    const fromAddress =
      process.env.EMAIL_FROM || "Telehealth App <noreply@tele-health.app>"

    // Official Resend docs pattern. sendEmail guarantees text or html is
    // present, so the cast to CreateEmailOptions is safe — that union
    // demands at least one of react/html/text OR `template`, which TS can't
    // infer from the conditional spread.
    const { error } = await getResendClient().emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      ...(options.text ? { text: options.text } : {}),
      ...(options.html ? { html: options.html } : {}),
    } as CreateEmailOptions)
    if (error) {
      throw error
    }
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
