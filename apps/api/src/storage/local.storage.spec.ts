import { existsSync, mkdirSync, unlinkSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { LocalStorage } from "./local.storage"

jest.mock("node:fs")
jest.mock("node:fs/promises")

const mocked = {
  existsSync: jest.mocked(existsSync),
  mkdirSync: jest.mocked(mkdirSync),
  unlinkSync: jest.mocked(unlinkSync),
  readFile: jest.mocked(readFile),
  writeFile: jest.mocked(writeFile),
}

describe("LocalStorage", () => {
  const originalBaseUrl = process.env.BETTER_AUTH_URL
  let storage: LocalStorage

  beforeEach(() => {
    process.env.BETTER_AUTH_URL = "http://localhost:3001"
    jest.clearAllMocks()
    mocked.existsSync.mockReturnValue(true) // base dir exists by default
    storage = new LocalStorage()
  })

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.BETTER_AUTH_URL
    } else {
      process.env.BETTER_AUTH_URL = originalBaseUrl
    }
  })

  it("creates the base directory when missing", () => {
    mocked.existsSync.mockReturnValue(false)
    new LocalStorage()
    expect(mocked.mkdirSync).toHaveBeenCalled()
  })

  it("skips creating the base directory when it exists", () => {
    new LocalStorage()
    expect(mocked.mkdirSync).not.toHaveBeenCalled()
  })

  it("save writes the file and returns a public URL", async () => {
    mocked.writeFile.mockResolvedValue(undefined as never)
    const url = await storage.save(
      "avatar-u-1.jpg",
      Buffer.from("data"),
      "image/jpeg",
    )

    expect(mocked.writeFile).toHaveBeenCalledWith(
      join(process.cwd(), "uploads", "avatar-u-1.jpg"),
      Buffer.from("data"),
    )
    expect(url).toBe("http://localhost:3001/uploads/avatar-u-1.jpg")
  })

  it("read returns bytes when the file exists", async () => {
    mocked.existsSync.mockReturnValue(true)
    mocked.readFile.mockResolvedValue(Buffer.from("file-content") as never)

    const result = await storage.read("avatar-u-1.jpg")
    expect(result).toEqual({
      data: Buffer.from("file-content"),
      contentType: "image/jpeg",
    })
  })

  it("read returns null when the file is missing", async () => {
    mocked.existsSync.mockReturnValue(false)
    expect(await storage.read("missing.jpg")).toBeNull()
  })

  it("delete removes the file when present", async () => {
    mocked.existsSync.mockReturnValue(true)
    await storage.delete("avatar-u-1.jpg")
    expect(mocked.unlinkSync).toHaveBeenCalledWith(
      join(process.cwd(), "uploads", "avatar-u-1.jpg"),
    )
  })

  it("delete is a no-op when the file is missing", async () => {
    mocked.existsSync.mockReturnValue(false)
    await storage.delete("missing.jpg")
    expect(mocked.unlinkSync).not.toHaveBeenCalled()
  })

  it("exists reports presence", async () => {
    mocked.existsSync.mockReturnValue(true)
    expect(await storage.exists("avatar-u-1.jpg")).toBe(true)
    mocked.existsSync.mockReturnValue(false)
    expect(await storage.exists("missing.jpg")).toBe(false)
  })
})
