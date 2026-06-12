import { extname } from "node:path"
import { BadRequestException, Injectable } from "@nestjs/common"
import type { StorageProvider } from "./storage.interface"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

// Magic bytes for allowed image formats
const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header (bytes 0-3); WebP marker at bytes 8-11: "WEBP"
} as const

function sanitizeExtension(filename: string): string {
  const ext = extname(filename).toLowerCase()
  if (
    !ext ||
    !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
  ) {
    return ".jpg"
  }
  return ext
}

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

@Injectable()
export class StorageService {
  private readonly provider: StorageProvider

  constructor(provider: StorageProvider) {
    this.provider = provider
  }

  /** Validate MIME type against the allowed list. */
  validateMimeType(mimeType: string): mimeType is AllowedMimeType {
    return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)
  }

  /** Validate file size. */
  validateSize(bytes: number): boolean {
    return bytes > 0 && bytes <= MAX_FILE_SIZE
  }

  /** Validate file content matches claimed MIME type via magic bytes. */
  validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const expected = MAGIC_BYTES[mimeType as keyof typeof MAGIC_BYTES]
    if (!expected) return false
    if (buffer.length < expected.length) return false
    return expected.every((byte, i) => buffer[i] === byte)
  }

  get maxFileSize(): number {
    return MAX_FILE_SIZE
  }

  get allowedMimeTypes(): readonly string[] {
    return ALLOWED_MIME_TYPES
  }

  /**
   * Upload a file. Generates a unique key based on userId and timestamp.
   * Returns the public URL of the stored file.
   */
  async uploadFile(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    if (!this.validateMimeType(mimeType)) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      )
    }
    if (!this.validateSize(buffer.length)) {
      throw new BadRequestException(
        `File too large: ${buffer.length} bytes. Max: ${MAX_FILE_SIZE} bytes`,
      )
    }
    if (!this.validateMagicBytes(buffer, mimeType)) {
      throw new BadRequestException(
        `File content does not match claimed type: ${mimeType}`,
      )
    }
    const extension = sanitizeExtension(originalName)
    const key = `avatar-${userId}-${Date.now()}${extension}`
    return this.provider.save(key, buffer, mimeType)
  }

  /** Delete a file by its key (extracted from URL). */
  async deleteFile(key: string): Promise<void> {
    return this.provider.delete(key)
  }
}
