import { Global, Module } from "@nestjs/common"
import { LocalStorage } from "./local.storage"
import { S3Storage } from "./s3.storage"
import { StorageService } from "./storage.service"

function storageFactory(): StorageService {
  // When AWS credentials and S3 bucket are configured, use S3 storage.
  // Falls back to local filesystem for development.
  if (process.env.AWS_REGION && process.env.S3_BUCKET) {
    return new StorageService(new S3Storage())
  }
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
