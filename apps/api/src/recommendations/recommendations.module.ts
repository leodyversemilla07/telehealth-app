import { Module } from "@nestjs/common"
import { ConsentModule } from "../consent/consent.module"
import { PrismaModule } from "../prisma/prisma.module"
import { RecommendationsController } from "./recommendations.controller"
import { RecommendationsService } from "./recommendations.service"

@Module({
  imports: [ConsentModule, PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
