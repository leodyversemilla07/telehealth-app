import { Global, Module } from "@nestjs/common"
import { EmailService } from "@/common/services/email.service"

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class CommonModule {}
