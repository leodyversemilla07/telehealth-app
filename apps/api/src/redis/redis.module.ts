import { Global, Module } from "@nestjs/common"
import { CacheService } from "../common/cache/cache.service"
import { RedisService } from "./redis.service"

/**
 * Shared Redis infrastructure for cross-instance coordination.
 *
 * When REDIS_URL is absent the service deliberately uses an in-process rate
 * limit store and Socket.IO remains single-instance. This keeps local and test
 * environments dependency-free; production deployments that scale the API
 * horizontally must configure Redis.
 *
 * Also provides CacheService (domain-data cache), which mirrors the same
 * split: shared Redis entries when configured, in-process MemoryCache
 * otherwise.
 */
@Global()
@Module({
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class RedisModule {}
