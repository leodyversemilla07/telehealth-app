import type { StorageProvider } from "./storage.interface"

// Dynamic import to avoid requiring @aws-sdk/client-s3 when not using S3
async function getS3() {
  return import("@aws-sdk/client-s3")
}

/**
 * S3-compatible storage provider (AWS S3, MinIO, Cloudflare R2, etc.).
 * Falls back to LocalStorage if AWS credentials are not configured.
 */
export class S3Storage implements StorageProvider {
  private _client: InstanceType<
    Awaited<ReturnType<typeof getS3>>["S3Client"]
  > | null = null
  private readonly bucket: string

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "telehealth-app-uploads"
  }

  private async ensureClient() {
    if (!this._client) {
      const { S3Client } = await getS3()
      // Prefer explicit env keys (local dev / MinIO), otherwise fall back to
      // the SDK default credential chain (e.g. EC2 instance profile in AWS).
      const creds =
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined
      this._client = new S3Client({
        region: process.env.AWS_REGION ?? "us-east-1",
        ...(creds ? { credentials: creds } : {}),
      })
    }
    return this._client
  }

  async save(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { PutObjectCommand } = await getS3()
    const client = await this.ensureClient()
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    )
    // Return the same URL scheme as LocalStorage: served through the API at
    // /uploads/:key. Bucket objects stay PRIVATE (medical data); reads are
    // streamed server-side with instance-profile credentials.
    const apiBaseUrl = (
      process.env.BETTER_AUTH_URL ??
      `http://localhost:${process.env.PORT ?? 3001}`
    ).replace(/\/$/, "")
    return `${apiBaseUrl}/uploads/${key}`
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await getS3()
    const client = await this.ensureClient()
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { HeadObjectCommand } = await getS3()
      const client = await this.ensureClient()
      await client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return true
    } catch {
      return false
    }
  }

  async read(
    key: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    const { GetObjectCommand } = await getS3()
    const client = await this.ensureClient()
    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      if (!res.Body) {
        return null
      }
      const bytes = await res.Body.transformToByteArray()
      return {
        data: Buffer.from(bytes),
        contentType: res.ContentType ?? "application/octet-stream",
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "NoSuchKey") {
        return null
      }
      throw err
    }
  }
}
