import { ConflictException } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { formatTrpcError, readableInputError } from "./error-formatter"

describe("error-formatter", () => {
  describe("readableInputError", () => {
    it("turns a zod issue into a single readable sentence", () => {
      const schema = z.object({
        specialty: z.string().min(3, "specialty must be at least 3 characters"),
      })
      const result = schema.safeParse({ specialty: "ab" })

      expect(result.success).toBe(false)
      const message = readableInputError("Invalid input", result.error)
      expect(message).toContain("specialty must be at least 3 characters")
    })

    it("returns null when the cause is not a zod error", () => {
      expect(readableInputError("boom", new Error("nope"))).toBeNull()
    })

    it("returns the original message when the cause has no issues", () => {
      expect(readableInputError("ok", undefined)).toBeNull()
    })
  })

  describe("formatTrpcError", () => {
    const baseShape = {
      message: "Conflict",
      code: "CONFLICT" as const,
      data: { code: "CONFLICT" as const, httpStatus: 409 },
    }

    it("injects the SRS Appendix C code from an HttpException cause", () => {
      const exception = new ConflictException({
        code: "SLOT_UNAVAILABLE",
        message: "This time slot is already booked",
      })
      const error = new TRPCError({
        code: "CONFLICT",
        message: "Conflict",
        cause: exception,
      })

      const shaped = formatTrpcError({ shape: { ...baseShape }, error })
      expect(shaped.data.code).toBe("SLOT_UNAVAILABLE")
      expect(shaped.message).toBe("Conflict")
    })

    it("passes through the shape unchanged when there is no HttpException cause", () => {
      const error = new TRPCError({ code: "NOT_FOUND", message: "m" })
      const shaped = formatTrpcError({ shape: { ...baseShape }, error })
      expect(shaped.data).toBe(baseShape.data)
    })
  })
})
