import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common"
import { PrismaClient } from "../../generated/prisma/client.js"
import { prismaPgAdapter } from "./prisma-client"

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: prismaPgAdapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  // Gracefully shuts down connection pools on NestJS process exits
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
