import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { RedisModule } from "../redis/redis.module"
import { RetentionService } from "./retention.service"

@Module({
  imports: [ScheduleModule.forRoot(), RedisModule],
  providers: [RetentionService],
})
export class RetentionModule {}
