import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { RetentionService } from "@/retention/retention.service"

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RetentionService],
})
export class RetentionModule {}
