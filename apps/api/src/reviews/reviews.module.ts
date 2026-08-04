import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { TrpcModule } from "../trpc/trpc.module"
import { ReviewsRouter } from "./reviews.router"
import { ReviewsService } from "./reviews.service"

@Module({
  imports: [TrpcModule, PrismaModule],
  providers: [ReviewsRouter, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
