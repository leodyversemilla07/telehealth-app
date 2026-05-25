import { Module } from "@nestjs/common"
import { ConsentController } from "@/consent/consent.controller"
import { ConsentService } from "@/consent/consent.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule],
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
