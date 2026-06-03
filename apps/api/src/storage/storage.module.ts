import { Global, Module } from "@nestjs/common"
import { LocalStorage } from "./local.storage"
import { S3Storage } from "./s3.storage"
import { StorageService } from "./storage.service"

function storageFactory(): StorageService {
  const nodeEnv = process.env.NODE_ENV || "development"

  // In production, ALWAYS use S3 - local storage loses files on redeploy
  if (nodeEnv === "production") {
    if (!process.env.S3_BUCKET) {
      console.error(
        "⚠️ S3_BUCKET not set in production! File uploads will fail.",
      )
    }
    return new StorageService(new S3Storage())
  }

  // In development, use S3 if configured, otherwise local
  if (process.env.AWS_REGION && process.env.S3_BUCKET) {
    console.log("Using S3 storage (AWS credentials detected)")
    return new StorageService(new S3Storage())
  }

  console.log("Using local filesystem storage (development only)")
  return new StorageService(new LocalStorage())
}

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useFactory: storageFactory,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
