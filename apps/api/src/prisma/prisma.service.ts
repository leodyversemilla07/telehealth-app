import { Injectable, type OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "../../generated/prisma/client.js"
import { prismaPgAdapter } from "./prisma-client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: prismaPgAdapter })
  }

  async onModuleInit() {
    await this.$connect()
  }
}
