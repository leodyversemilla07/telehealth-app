import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { S3Storage } from "./s3.storage"

/**
 * The dynamic import() inside S3Storage loads the real @aws-sdk/client-s3
 * (jest cannot intercept it without ESM vm support), so we stub the client
 * boundary instead: every real command funnels through S3Client.prototype.send.
 */
describe("S3Storage", () => {
  let sendSpy: jest.SpyInstance
  let clientConfigs: Array<{ region?: string; credentials?: unknown }>

  const originalEnv: Record<string, string | undefined> = {
    S3_BUCKET: process.env.S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    PORT: process.env.PORT,
  }

  beforeEach(() => {
    process.env.S3_BUCKET = "telehealth-uploads"
    process.env.AWS_REGION = "us-east-1"
    process.env.BETTER_AUTH_URL = "https://api.tele-health.app"
    // Ensure ambient credentials don't leak between tests
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
    clientConfigs = []
    sendSpy = jest
      .spyOn(S3Client.prototype, "send")
      .mockImplementation(function (
        this: { config: unknown },
        _command: unknown,
      ) {
        clientConfigs.push(this.cfg as never)
        return Promise.resolve({})
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it("defaults the bucket name when S3_BUCKET is unset", () => {
    delete process.env.S3_BUCKET
    const storage = new S3Storage()
    expect((storage as unknown as { bucket: string }).bucket).toBe(
      "telehealth-app-uploads",
    )
  })

  it("save PUTs the object and returns the proxied URL", async () => {
    const storage = new S3Storage()

    const url = await storage.save(
      "avatar-u-1.jpg",
      Buffer.from("data"),
      "image/jpeg",
    )

    expect(url).toBe("https://api.tele-health.app/uploads/avatar-u-1.jpg")
    const command = sendSpy.mock.calls[0][0] as PutObjectCommand
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect(command.input).toMatchObject({
      Bucket: "telehealth-uploads",
      Key: "avatar-u-1.jpg",
      ContentType: "image/jpeg",
    })
  })

  it("falls back to the SDK credential chain when env keys are absent", async () => {
    await new S3Storage().save("k", Buffer.from("x"), "image/png")
    expect(clientConfigs[0]?.credentials).toBeUndefined()
    expect(clientConfigs[0]?.region).toBe("us-east-1")
  })

  it("uses explicit credentials when provided", async () => {
    process.env.AWS_ACCESS_KEY_ID = "AKIAEXAMPLE"
    process.env.AWS_SECRET_ACCESS_KEY = "secret"
    await new S3Storage().save("k", Buffer.from("x"), "image/png")

    expect(clientConfigs[0]?.credentials).toEqual({
      accessKeyId: "AKIAEXAMPLE",
      secretAccessKey: "secret",
    })
  })

  it("delete sends a DeleteObjectCommand", async () => {
    const storage = new S3Storage()
    await storage.delete("avatar-u-1.jpg")

    const command = sendSpy.mock.calls[0][0] as DeleteObjectCommand
    expect(command).toBeInstanceOf(DeleteObjectCommand)
    expect(command.input).toMatchObject({ Key: "avatar-u-1.jpg" })
  })

  it("exists returns true when the object is present", async () => {
    const storage = new S3Storage()
    expect(await storage.exists("avatar-u-1.jpg")).toBe(true)
    expect(sendSpy.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand)
  })

  it("exists returns false when the object is missing", async () => {
    sendSpy.mockRejectedValue(new Error("NotFound"))
    const storage = new S3Storage()
    expect(await storage.exists("avatar-u-1.jpg")).toBe(false)
  })

  it("read streams bytes with the stored content type", async () => {
    sendSpy.mockResolvedValue({
      Body: { transformToByteArray: async () => Uint8Array.from([1, 2, 3]) },
      ContentType: "image/png",
    })
    const storage = new S3Storage()

    const result = await storage.read("avatar-u-1.jpg")
    expect(result).toEqual({
      data: Buffer.from([1, 2, 3]),
      contentType: "image/png",
    })
    expect(sendSpy.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand)
  })

  it("read returns null for a missing body or NoSuchKey", async () => {
    const storage = new S3Storage()

    sendSpy.mockResolvedValue({ Body: null })
    expect(await storage.read("avatar-u-1.jpg")).toBeNull()

    sendSpy.mockRejectedValue({ name: "NoSuchKey" })
    expect(await storage.read("avatar-u-1.jpg")).toBeNull()
  })

  it("read rethrows non-NoSuchKey errors", async () => {
    sendSpy.mockRejectedValue(new Error("network down"))
    const storage = new S3Storage()

    await expect(storage.read("avatar-u-1.jpg")).rejects.toThrow("network down")
  })
})
