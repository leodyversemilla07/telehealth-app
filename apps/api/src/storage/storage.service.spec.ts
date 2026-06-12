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

  describe("validateMagicBytes", () => {
    it("should return true for valid JPEG magic bytes", () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      expect(service.validateMagicBytes(buffer, "image/jpeg")).toBe(true)
    })

    it("should return true for valid PNG magic bytes", () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47])
      expect(service.validateMagicBytes(buffer, "image/png")).toBe(true)
    })

    it("should return true for valid WebP magic bytes", () => {
      // RIFF....WEBP
      const buffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ])
      expect(service.validateMagicBytes(buffer, "image/webp")).toBe(true)
    })

    it("should return false for mismatched magic bytes", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00])
      expect(service.validateMagicBytes(buffer, "image/jpeg")).toBe(false)
    })

    it("should return false for unknown MIME type", () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff])
      expect(service.validateMagicBytes(buffer, "image/gif")).toBe(false)
    })

    it("should return false for buffer shorter than magic bytes", () => {
      const buffer = Buffer.from([0xff])
      expect(service.validateMagicBytes(buffer, "image/jpeg")).toBe(false)
    })
  })

  describe("uploadFile", () => {
    it("should generate key and save via provider", async () => {
      provider.save.mockResolvedValue("https://cdn.example.com/avatar.jpg")
      // JPEG magic bytes: ff d8 ff
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

      const result = await service.uploadFile(
        "u1",
        jpegBuffer,
        "photo.jpg",
        "image/jpeg",
      )

      expect(result).toBe("https://cdn.example.com/avatar.jpg")
      expect(provider.save).toHaveBeenCalledWith(
        expect.stringMatching(/^avatar-u1-\d+\.jpg$/),
        jpegBuffer,
        "image/jpeg",
      )
    })

    it("should use .jpg fallback for extensionless names", async () => {
      provider.save.mockResolvedValue("url")
      // PNG magic bytes: 89 50 4e 47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])

      await service.uploadFile("u1", pngBuffer, "photo", "image/png")

      expect(provider.save).toHaveBeenCalledWith(
        expect.stringMatching(/^avatar-u1-\d+\.jpg$/),
        expect.any(Buffer),
        "image/png",
      )
    })

    it("should reject files with mismatched magic bytes", async () => {
      const fakeBuffer = Buffer.from("not-an-image")

      await expect(
        service.uploadFile("u1", fakeBuffer, "photo.jpg", "image/jpeg"),
      ).rejects.toThrow("File content does not match claimed type")
    })

    it("should reject files exceeding size limit", async () => {
      const hugeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff)

      await expect(
        service.uploadFile("u1", hugeBuffer, "photo.jpg", "image/jpeg"),
      ).rejects.toThrow("File too large")
    })

    it("should reject disallowed MIME types", async () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38])

      await expect(
        service.uploadFile("u1", gifBuffer, "photo.gif", "image/gif"),
      ).rejects.toThrow("Invalid file type")
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
