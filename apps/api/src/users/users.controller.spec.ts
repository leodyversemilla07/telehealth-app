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

import { StorageService } from "@/storage/storage.service"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"

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

describe("UsersController", () => {
  let app: INestApplication<App>

  const serviceMock = {
    updateProfile: jest.fn(),
    getActiveSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeOtherSessions: jest.fn(),
  }

  const storageMock = {
    validateMimeType: jest.fn(),
    validateSize: jest.fn(),
    uploadFile: jest.fn(),
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 2 * 1024 * 1024,
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
        {
          provide: StorageService,
          useValue: storageMock,
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
            session: {
              id:
                (typeof req.headers["x-session-id"] === "string" &&
                  req.headers["x-session-id"]) ||
                "sess-1",
            },
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

  it("should allow anonymous access to /users/public", async () => {
    await request(app.getHttpServer()).get("/users/public").expect(200)
  })

  it("should require auth for /users/me", async () => {
    await request(app.getHttpServer()).get("/users/me").expect(401)
  })

  it("should validate profile update payload", async () => {
    await request(app.getHttpServer())
      .patch("/users/me")
      .set("x-role", "PATIENT")
      .send({ name: "Leo", unsupported: true })
      .expect(400)

    expect(serviceMock.updateProfile).not.toHaveBeenCalled()
  })

  it("should update profile with valid payload", async () => {
    serviceMock.updateProfile.mockResolvedValue({ id: "user-1", name: "Leo" })

    await request(app.getHttpServer())
      .patch("/users/me")
      .set("x-role", "PATIENT")
      .set("x-user-id", "user-1")
      .send({ name: "Leo" })
      .expect(200)

    expect(serviceMock.updateProfile).toHaveBeenCalledWith(
      "user-1",
      "user-1",
      "PATIENT",
      { name: "Leo" },
    )
  })

  it("should list active sessions for current user", async () => {
    serviceMock.getActiveSessions.mockResolvedValue([])

    await request(app.getHttpServer())
      .get("/users/me/sessions")
      .set("x-role", "PATIENT")
      .set("x-user-id", "user-42")
      .set("x-session-id", "sess-42")
      .expect(200)

    expect(serviceMock.getActiveSessions).toHaveBeenCalledWith(
      "user-42",
      "sess-42",
    )
  })
})
