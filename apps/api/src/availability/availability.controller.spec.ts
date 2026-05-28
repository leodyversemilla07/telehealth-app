import type {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from "@nestjs/common"
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from "@nestjs/common"
import { APP_GUARD, Reflector } from "@nestjs/core"
import { Test, type TestingModule } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types"

const ROLES_KEY = "mock:roles"
const ALLOW_ANONYMOUS_KEY = "mock:allow-anonymous"

type TestSession = {
  user: { id: string; role: string }
  session: { id: string }
}

import { AvailabilityController } from "./availability.controller"
import { AvailabilityService } from "./availability.service"

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<{
      userSession?: TestSession
    }>()

    if (!request.userSession) {
      throw new UnauthorizedException("Authentication required")
    }

    const roles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []

    if (roles.length > 0 && !roles.includes(request.userSession.user.role)) {
      throw new ForbiddenException("Insufficient role")
    }

    return true
  }
}

describe("AvailabilityController", () => {
  let app: INestApplication<App>

  const serviceMock = {
    setAvailability: jest.fn(),
    getMyAvailability: jest.fn(),
    createTimeOff: jest.fn(),
    getTimeOff: jest.fn(),
    deleteTimeOff: jest.fn(),
    getAvailableSlots: jest.fn(),
    getSchedule: jest.fn(),
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: serviceMock,
        },
        {
          provide: APP_GUARD,
          useClass: TestAuthGuard,
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(
      (
        req: { headers: Record<string, unknown>; userSession?: TestSession },
        _res: unknown,
        next: () => void,
      ) => {
        const role = req.headers["x-role"]
        if (typeof role === "string") {
          req.userSession = {
            user: {
              id:
                (typeof req.headers["x-user-id"] === "string" &&
                  req.headers["x-user-id"]) ||
                "user-1",
              role,
            },
            session: { id: "sess-1" },
          }
        }
        next()
      },
    )
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    await app.init()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await app.close()
  })

  it("should block non-doctor from setting availability", async () => {
    await request(app.getHttpServer())
      .put("/availability")
      .set("x-role", "PATIENT")
      .send({ monday: '["09:00-10:00"]', slotDuration: 30 })
      .expect(403)
  })

  it("should validate SetAvailabilityDto payload", async () => {
    await request(app.getHttpServer())
      .put("/availability")
      .set("x-role", "DOCTOR")
      .send({ monday: "09:00-10:00", slotDuration: 30 })
      .expect(400)

    expect(serviceMock.setAvailability).not.toHaveBeenCalled()
  })

  it("should pass valid doctor payload to service", async () => {
    serviceMock.setAvailability.mockResolvedValue({ id: "sched-1" })

    await request(app.getHttpServer())
      .put("/availability")
      .set("x-role", "DOCTOR")
      .set("x-user-id", "doc-user-1")
      .send({ monday: '["09:00-10:00"]', slotDuration: 30 })
      .expect(200)

    expect(serviceMock.setAvailability).toHaveBeenCalledWith("doc-user-1", {
      monday: '["09:00-10:00"]',
      slotDuration: 30,
    })
  })

  it("should allow anonymous access to slots endpoint", async () => {
    serviceMock.getAvailableSlots.mockResolvedValue([])

    await request(app.getHttpServer())
      .get("/availability/doc-1/slots")
      .query({ date: "2026-06-15" })
      .expect(200)

    expect(serviceMock.getAvailableSlots).toHaveBeenCalledWith(
      "doc-1",
      "2026-06-15",
    )
  })
})
