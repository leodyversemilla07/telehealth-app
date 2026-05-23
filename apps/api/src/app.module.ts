import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "@thallesp/nestjs-better-auth"
import { AppController } from "@/app.controller"
import { AppService } from "@/app.service"
import { AuditLogsModule } from "@/audit-logs/audit-logs.module"
import { auth } from "@/auth/auth"
import { validate } from "@/config/env.validation"
import { PrismaModule } from "@/prisma/prisma.module"
import { SecurityAlertsModule } from "@/security-alerts/security-alerts.module"
import { UsersModule } from "@/users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
      },
    }),
    UsersModule,
    AuditLogsModule,
    SecurityAlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
