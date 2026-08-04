import { HttpException } from "@nestjs/common"
import type { TRPCDefaultErrorShape, TRPCErrorFormatter } from "@trpc/server"
import { codeForStatus } from "../common/errors/error-codes"

interface Issue {
  message?: unknown
  path?: unknown
}

/**
 * tRPC stringifies a failed input parse into the whole `ZodError`, so a form
 * that sends eight characters too few shows the reader a JSON array with
 * `code`, `minimum`, `inclusive` and a `path` in it. The sentence we wrote for
 * that rule is in there, and it is the only part anybody wants.
 *
 * Read by duck-typing rather than `instanceof ZodError`: the error crosses a
 * package boundary, and two copies of zod in a workspace would silently stop
 * matching and put the JSON back on screen.
 */
function issuesIn(cause: unknown): Issue[] | null {
  if (typeof cause !== "object" || cause === null) return null

  const issues = (cause as { issues?: unknown }).issues

  return Array.isArray(issues) && issues.length > 0 ? (issues as Issue[]) : null
}

function sentence(issue: Issue): string | null {
  if (typeof issue.message !== "string" || issue.message.trim() === "") {
    return null
  }

  const message = issue.message.trim()

  // Zod's own defaults ("Required", "Invalid input") name nothing, so they are
  // only useful with the field in front of them. Ours are whole sentences.
  if (/[.!?]$/.test(message)) return message

  const field = Array.isArray(issue.path)
    ? issue.path.filter((part) => typeof part === "string").at(-1)
    : undefined

  return field ? `${field}: ${message}` : message
}

export function readableInputError(
  message: string,
  cause: unknown,
): string | null {
  const issues = issuesIn(cause)
  if (!issues) return null

  const sentences = [...new Set(issues.map(sentence).filter(Boolean))]

  return sentences.length > 0 ? sentences.join(" ") : message
}

/**
 * Makes tRPC errors match the REST error envelope:
 *  - readable message for zod input failures (sentence per field),
 *  - SRS Appendix C machine `code` in `shape.data.code` when the underlying
 *    cause is a Nest HttpException carrying an explicit code.
 */
export const formatTrpcError: TRPCErrorFormatter<
  object,
  TRPCDefaultErrorShape
> = ({ shape, error }) => {
  const readable = readableInputError(shape.message, error.cause)
  let data: TRPCDefaultErrorShape["data"] = shape.data

  const cause = error.cause
  if (cause instanceof HttpException) {
    const response = cause.getResponse()
    const responseObject =
      typeof response === "object" && response !== null
        ? (response as Record<string, unknown>)
        : null
    const code =
      typeof responseObject?.code === "string"
        ? responseObject.code
        : codeForStatus(cause.getStatus())
    // SRS Appendix C machine code — rides along in the error payload the same
    // way the REST envelope carries `code`.
    data = { ...data, code } as TRPCDefaultErrorShape["data"]
  }

  return readable ? { ...shape, message: readable, data } : { ...shape, data }
}
