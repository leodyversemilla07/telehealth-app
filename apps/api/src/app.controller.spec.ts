import { Test, type TestingModule } from "@nestjs/testing"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { PrismaService } from "./prisma/prisma.service"

jest.mock("./prisma/prisma.service")

describe("AppController", () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, PrismaService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe("health", () => {
    it("should return health status object", async () => {
      const result = await appController.getHealth()
      expect(result).toHaveProperty("status", "ok")
      expect(result).toHaveProperty("uptime")
      expect(result).toHaveProperty("timestamp")
      expect(result).toHaveProperty("database")
      expect(result.database).toHaveProperty("status")
    })
  })
})
