import type { INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"
import { AppController } from "@/app.controller"
import { AppService } from "@/app.service"
import { PrismaService } from "@/prisma/prisma.service"

jest.mock("@/prisma/prisma.service")

describe("AppController (e2e)", () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
          },
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it("/ (GET)", () => {
    return request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("status", "ok")
        expect(res.body).toHaveProperty("timestamp")
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
