import { PrismaClient } from "@generated/prisma/client.js"
import { Injectable, type OnModuleInit } from "@nestjs/common"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(pool)
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }
}
