import type { StorageProvider } from "@/storage/storage.interface"

// Dynamic import to avoid requiring @aws-sdk/client-s3 when not using S3
// biome-ignore lint/suspicious/noExplicitAny: dynamic optional dependency
async function getS3(): Promise<any> {
  // @ts-expect-error — optional dependency, only resolves when S3 is used
  return import("@aws-sdk/client-s3")
}

/**
 * S3-compatible storage provider (AWS S3, MinIO, Cloudflare R2, etc.).
 * Falls back to LocalStorage if AWS credentials are not configured.
 */
export class S3Storage implements StorageProvider {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic S3 client loaded lazily
  private _client: any
  private readonly bucket: string
  private readonly publicUrlBase: string

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "telehealth-app-uploads"

    // CloudFront or direct S3 URL
    this.publicUrlBase =
      process.env.S3_PUBLIC_URL ??
      `https://${this.bucket}.s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com`
  }

  private async ensureClient() {
    if (!this._client) {
      const { S3Client } = await getS3()
      this._client = new S3Client({
        region: process.env.AWS_REGION ?? "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
        },
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
    return `${this.publicUrlBase}/${key}`
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
}
