import { stripPII } from "./sanitize"

describe("stripPII", () => {
  it("redacts labelled names and addresses", () => {
    const input =
      "My name is Juan Dela Cruz. Address: 123 Mabini Street, Manila; I have a fever."

    const result = stripPII(input)

    expect(result).toContain("My name is [NAME REDACTED]")
    expect(result).toContain("Address: [ADDRESS REDACTED]")
    expect(result).not.toContain("Juan Dela Cruz")
    expect(result).not.toContain("123 Mabini Street")
    expect(result).toContain("I have a fever")
  })

  it("redacts common contact and government identifiers", () => {
    const result = stripPII(
      "Email jane@example.com, mobile +63 917 123 4567, PhilHealth 12-34567890-1.",
    )

    expect(result).toContain("[EMAIL REDACTED]")
    expect(result).toContain("[PHONE REDACTED]")
    expect(result).toContain("[PHILHEALTH REDACTED]")
    expect(result).not.toContain("jane@example.com")
  })

  it("redacts an unlabelled street address", () => {
    expect(stripPII("Lives at 42 Rizal Ave., Quezon City")).toBe(
      "Lives at [ADDRESS REDACTED]",
    )
  })
})
