import type { StorageProvider } from "./storage.interface"
import { StorageService } from "./storage.service"

describe("StorageService", () => {
  let service: StorageService
  let provider: jest.Mocked<StorageProvider>

  beforeEach(() => {
    provider = { save: jest.fn(), delete: jest.fn(), exists: jest.fn() }
    service = new StorageService(provider)
  })

  describe("validateMimeType", () => {
    it("should return true for allowed types", () => {
      expect(service.validateMimeType("image/jpeg")).toBe(true)
      expect(service.validateMimeType("image/png")).toBe(true)
      expect(service.validateMimeType("image/webp")).toBe(true)
    })

    it("should return false for disallowed types", () => {
      expect(service.validateMimeType("image/gif")).toBe(false)
      expect(service.validateMimeType("application/pdf")).toBe(false)
      expect(service.validateMimeType("text/html")).toBe(false)
    })
  })

  describe("validateSize", () => {
    it("should return true for files within limit", () => {
      expect(service.validateSize(1)).toBe(true)
      expect(service.validateSize(2 * 1024 * 1024)).toBe(true)
    })

    it("should return false for empty files", () => {
      expect(service.validateSize(0)).toBe(false)
    })

    it("should return false for files exceeding limit", () => {
      expect(service.validateSize(2 * 1024 * 1024 + 1)).toBe(false)
    })
  })

  describe("maxFileSize", () => {
    it("should return 2MB", () => {
      expect(service.maxFileSize).toBe(2 * 1024 * 1024)
    })
  })

  describe("allowedMimeTypes", () => {
    it("should return the allowed types", () => {
      expect(service.allowedMimeTypes).toEqual([
        "image/jpeg",
        "image/png",
        "image/webp",
      ])
    })
  })

  describe("uploadFile", () => {
    it("should generate key and save via provider", async () => {
      provider.save.mockResolvedValue("https://cdn.example.com/avatar.jpg")

      const result = await service.uploadFile(
        "u1",
        Buffer.from("data"),
        "photo.jpg",
        "image/jpeg",
      )

      expect(result).toBe("https://cdn.example.com/avatar.jpg")
      expect(provider.save).toHaveBeenCalledWith(
        expect.stringMatching(/^avatar-u1-\d+\.jpg$/),
        Buffer.from("data"),
        "image/jpeg",
      )
    })

    it("should use .jpg fallback for extensionless names", async () => {
      provider.save.mockResolvedValue("url")

      await service.uploadFile("u1", Buffer.from("data"), "photo", "image/png")

      expect(provider.save).toHaveBeenCalledWith(
        expect.stringMatching(/^avatar-u1-\d+\.jpg$/),
        expect.any(Buffer),
        "image/png",
      )
    })
  })

  describe("deleteFile", () => {
    it("should call provider.delete with key", async () => {
      provider.delete.mockResolvedValue(undefined)

      await service.deleteFile("avatar-u1-12345.jpg")

      expect(provider.delete).toHaveBeenCalledWith("avatar-u1-12345.jpg")
    })
  })
})
