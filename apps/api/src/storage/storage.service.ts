import { extname } from "node:path"
import { Injectable } from "@nestjs/common"
import type { StorageProvider } from "./storage.interface"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

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
    const extension = sanitizeExtension(originalName)
    const key = `avatar-${userId}-${Date.now()}${extension}`
    return this.provider.save(key, buffer, mimeType)
  }

  /** Delete a file by its key (extracted from URL). */
  async deleteFile(key: string): Promise<void> {
    return this.provider.delete(key)
  }
}
