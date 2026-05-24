import { existsSync, mkdirSync, unlinkSync } from "node:fs"
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { StorageProvider } from "@/storage/storage.interface"

/**
 * Local filesystem storage provider.
 * Files are stored under `{cwd}/uploads/` and served via `/uploads` static middleware.
 */
export class LocalStorage implements StorageProvider {
  private readonly baseDir: string
  private readonly baseUrl: string

  constructor() {
    this.baseDir = join(process.cwd(), "uploads")
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true })
    }

    const apiBaseUrl = (
      process.env.BETTER_AUTH_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`
    ).replace(/\/$/, "")
    this.baseUrl = `${apiBaseUrl}/uploads`
  }

  async save(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const filePath = join(this.baseDir, key)
    await writeFile(filePath, buffer)
    return `${this.baseUrl}/${key}`
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.baseDir, key)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(join(this.baseDir, key))
  }
}
