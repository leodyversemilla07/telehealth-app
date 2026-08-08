import { BadRequestException } from "@nestjs/common"
import { StorageService } from "../storage/storage.service"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"

describe("UsersController", () => {
  let controller: UsersController
  let usersService: {
    updateProfile: jest.Mock
    getActiveSessions: jest.Mock
    revokeSession: jest.Mock
    revokeOtherSessions: jest.Mock
    deleteAccount: jest.Mock
  }
  let storage: {
    validateMimeType: jest.Mock
    validateSize: jest.Mock
    uploadFile: jest.Mock
    allowedMimeTypes: string[]
    maxFileSize: number
  }

  const session = {
    user: { id: "user-1", role: "PATIENT", email: "p@test.ph" },
    session: { id: "sess-1" },
  }

  beforeEach(() => {
    usersService = {
      updateProfile: jest.fn().mockResolvedValue({ id: "user-1" }),
      getActiveSessions: jest.fn().mockResolvedValue([]),
      revokeSession: jest.fn().mockResolvedValue({ success: true }),
      revokeOtherSessions: jest.fn().mockResolvedValue({ count: 2 }),
      deleteAccount: jest.fn().mockResolvedValue({ success: true }),
    }
    storage = {
      validateMimeType: jest.fn().mockReturnValue(true),
      validateSize: jest.fn().mockReturnValue(true),
      uploadFile: jest
        .fn()
        .mockResolvedValue("https://cdn/uploads/avatar-1.jpg"),
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      maxFileSize: 2 * 1024 * 1024,
    }
    controller = new UsersController(
      usersService as unknown as UsersService,
      storage as unknown as StorageService,
    )
  })

  it("getProfile returns the session as-is", async () => {
    await expect(controller.getProfile(session as never)).resolves.toBe(session)
  })

  it("updateMyProfile delegates with session identity", async () => {
    await controller.updateMyProfile(
      session as never,
      { name: "New Name" } as never,
    )
    expect(usersService.updateProfile).toHaveBeenCalledWith(
      "user-1",
      "user-1",
      "PATIENT",
      { name: "New Name" },
    )
  })

  it("uploadAvatar rejects when no file is provided", async () => {
    await expect(
      controller.uploadAvatar(session as never, undefined as never),
    ).rejects.toThrow(BadRequestException)
  })

  it("uploadAvatar rejects unsupported mime types", async () => {
    storage.validateMimeType.mockReturnValue(false)
    const file = { mimetype: "text/html", size: 100 } as Express.Multer.File
    await expect(
      controller.uploadAvatar(session as never, file),
    ).rejects.toThrow(BadRequestException)
    await expect(
      controller.uploadAvatar(session as never, file),
    ).rejects.toThrow(/Invalid file type/)
  })

  it("uploadAvatar rejects oversized files", async () => {
    storage.validateSize.mockReturnValue(false)
    const file = {
      mimetype: "image/png",
      size: 3 * 1024 * 1024,
    } as Express.Multer.File
    await expect(
      controller.uploadAvatar(session as never, file),
    ).rejects.toThrow(/File is too large/)
  })

  it("uploadAvatar stores the file and updates the profile image", async () => {
    const file = {
      mimetype: "image/png",
      size: 1000,
      buffer: Buffer.from("img"),
      originalname: "me.png",
    } as Express.Multer.File

    const result = await controller.uploadAvatar(session as never, file)

    expect(storage.uploadFile).toHaveBeenCalledWith(
      "user-1",
      file.buffer,
      "me.png",
      "image/png",
    )
    expect(usersService.updateProfile).toHaveBeenCalledWith(
      "user-1",
      "user-1",
      "PATIENT",
      { image: "https://cdn/uploads/avatar-1.jpg" },
    )
    expect(result).toEqual({ id: "user-1" })
  })

  it("getMySessions delegates with the current session id", async () => {
    await controller.getMySessions(session as never)
    expect(usersService.getActiveSessions).toHaveBeenCalledWith(
      "user-1",
      "sess-1",
    )
  })

  it("revokeMySession delegates", async () => {
    await controller.revokeMySession(session as never, "sess-2")
    expect(usersService.revokeSession).toHaveBeenCalledWith("user-1", "sess-2")
  })

  it("revokeMyOtherSessions delegates with the current session id", async () => {
    await expect(
      controller.revokeMyOtherSessions(session as never),
    ).resolves.toEqual({ count: 2 })
    expect(usersService.revokeOtherSessions).toHaveBeenCalledWith(
      "user-1",
      "sess-1",
    )
  })

  it("deleteMyAccount passes the email for erasure flows", async () => {
    await controller.deleteMyAccount(session as never)
    expect(usersService.deleteAccount).toHaveBeenCalledWith(
      "user-1",
      "p@test.ph",
    )
  })

  it("publicRoute returns a public message", async () => {
    await expect(controller.publicRoute()).resolves.toEqual({
      message: "Public endpoint",
    })
  })
})
