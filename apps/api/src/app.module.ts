import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "@thallesp/nestjs-better-auth"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { auth } from "./auth/auth"
import { PrismaModule } from "./prisma/prisma.module"
import { UsersModule } from "./users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
