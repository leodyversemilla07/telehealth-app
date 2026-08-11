import { PrismaService } from "../../prisma/prisma.service"
import { authorizeUploadsKey } from "./uploads-gate"

describe("authorizeUploadsKey", () => {
  const prisma = {
    medicalDocument: { findFirst: jest.fn() },
  } as unknown as PrismaService

  const patientUser = { id: "pat-1", role: "PATIENT" }
  const doctorUser = { id: "doc-user-1", role: "DOCTOR" }
  const adminUser = { id: "adm-1", role: "ADMIN" }

  afterEach(() => jest.clearAllMocks())

  it("allows avatar keys without any session (public)", async () => {
    await expect(
      authorizeUploadsKey(prisma, undefined, "avatar-u-1-123.png"),
    ).resolves.toEqual({ allow: true, reason: "avatar" })
    expect(prisma.medicalDocument.findFirst).not.toHaveBeenCalled()
  })

  it("forbids non-avatar keys without a session", async () => {
    await expect(
      authorizeUploadsKey(prisma, undefined, "doc-key-1"),
    ).resolves.toEqual({ allow: false, reason: "forbidden" })
  })

  it("lets the appointment's patient read the document", async () => {
    prisma.medicalDocument.findFirst.mockResolvedValue({
      appointment: { patientId: "pat-1", doctor: { userId: "doc-user-1" } },
    })
    await expect(
      authorizeUploadsKey(prisma, patientUser, "doc-key-1"),
    ).resolves.toEqual({ allow: true, reason: "owner" })
  })

  it("lets the assigned doctor read the document", async () => {
    prisma.medicalDocument.findFirst.mockResolvedValue({
      appointment: { patientId: "pat-1", doctor: { userId: "doc-user-1" } },
    })
    await expect(
      authorizeUploadsKey(prisma, doctorUser, "doc-key-1"),
    ).resolves.toEqual({ allow: true, reason: "owner" })
  })

  it("lets admins read any document", async () => {
    prisma.medicalDocument.findFirst.mockResolvedValue({
      appointment: { patientId: "pat-1", doctor: { userId: "doc-user-1" } },
    })
    await expect(
      authorizeUploadsKey(prisma, adminUser, "doc-key-1"),
    ).resolves.toEqual({ allow: true, reason: "owner" })
  })

  it("forbids an unrelated authenticated user", async () => {
    prisma.medicalDocument.findFirst.mockResolvedValue({
      appointment: { patientId: "pat-1", doctor: { userId: "doc-user-1" } },
    })
    await expect(
      authorizeUploadsKey(
        prisma,
        { id: "stranger-1", role: "PATIENT" },
        "doc-key-1",
      ),
    ).resolves.toEqual({ allow: false, reason: "forbidden" })
  })

  it("reports not-found for unknown keys (no validity leak)", async () => {
    prisma.medicalDocument.findFirst.mockResolvedValue(null)
    await expect(
      authorizeUploadsKey(prisma, patientUser, "unknown-key"),
    ).resolves.toEqual({ allow: false, reason: "not-found" })
  })
})
