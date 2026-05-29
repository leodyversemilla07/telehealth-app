import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ThrottlerModule } from "@nestjs/throttler"
import { AuthModule } from "@thallesp/nestjs-better-auth"
import { LoggerModule } from "nestjs-pino"
import { AdminModule } from "@/admin/admin.module"
import { AppController } from "@/app.controller"
import { AppService } from "@/app.service"
import { AppointmentsModule } from "@/appointments/appointments.module"
import { AuditLogsModule } from "@/audit-logs/audit-logs.module"
import { auth } from "@/auth/auth"
import { AvailabilityModule } from "@/availability/availability.module"
import { ChatModule } from "@/chat/chat.module"
import { CommonModule } from "@/common/common.module"
import { validate } from "@/config/env.validation"
import {
  throttlerConfig,
  throttlerGuardProvider,
} from "@/config/throttler.config"
import { ConsentModule } from "@/consent/consent.module"
import { DoctorsModule } from "@/doctors/doctors.module"
import { NotificationsModule } from "@/notifications/notifications.module"
import { PatientsModule } from "@/patients/patients.module"
import { PrismaModule } from "@/prisma/prisma.module"
import { RecommendationsModule } from "@/recommendations/recommendations.module"
import { RecordsModule } from "@/records/records.module"
import { RetentionModule } from "@/retention/retention.module"
import { ReviewsModule } from "@/reviews/reviews.module"
import { SecurityAlertsModule } from "@/security-alerts/security-alerts.module"
import { StorageModule } from "@/storage/storage.module"
import { UsersModule } from "@/users/users.module"
import { VideoModule } from "@/video/video.module"

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV !== "production" ? "debug" : "info",
      },
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    CommonModule,
    StorageModule,
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
    DoctorsModule,
    AdminModule,
    PatientsModule,
    ConsentModule,
    AvailabilityModule,
    AppointmentsModule,
    RecordsModule,
    RecommendationsModule,
    VideoModule,
    NotificationsModule,
    ChatModule,
    ReviewsModule,
    RetentionModule,
  ],
  controllers: [AppController],
  providers: [AppService, throttlerGuardProvider],
})
export class AppModule {}
