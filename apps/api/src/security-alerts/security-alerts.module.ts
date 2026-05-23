import { Module } from "@nestjs/common"
import { SecurityAlertsController } from "@/security-alerts/security-alerts.controller"
import { SecurityAlertsService } from "@/security-alerts/security-alerts.service"

@Module({
  controllers: [SecurityAlertsController],
  providers: [SecurityAlertsService],
  exports: [SecurityAlertsService],
})
export class SecurityAlertsModule {}
