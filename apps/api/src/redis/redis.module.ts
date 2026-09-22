import { Global, Module } from "@nestjs/common"
import { RedisService } from "./redis.service"

/**
 * Shared Redis infrastructure for cross-instance coordination.
 *
 * When REDIS_URL is absent the service deliberately uses an in-process rate
 * limit store and Socket.IO remains single-instance. This keeps local and test
 * environments dependency-free; production deployments that scale the API
 * horizontally must configure Redis.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
