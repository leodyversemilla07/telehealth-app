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

import { RecordsController } from "./records.controller"
import { RecordsService } from "./records.service"

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

describe("RecordsController", () => {
  let app: INestApplication<App>

  const serviceMock = {
    createConsultation: jest.fn(),
    getConsultationByAppointment: jest.fn(),
    getPatientRecords: jest.fn(),
    getConsultation: jest.fn(),
    isDoctorAuthorized: jest.fn(),
    addPrescription: jest.fn(),
    getPatientPrescriptions: jest.fn(),
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [
        {
          provide: RecordsService,
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

  it("should enforce DOCTOR role for consultation creation", async () => {
    await request(app.getHttpServer())
      .post("/records/consultations")
      .set("x-role", "PATIENT")
      .send({ appointmentId: "apt-1" })
      .expect(403)
  })

  it("should validate consultation payload", async () => {
    await request(app.getHttpServer())
      .post("/records/consultations")
      .set("x-role", "DOCTOR")
      .send({})
      .expect(400)

    expect(serviceMock.createConsultation).not.toHaveBeenCalled()
  })

  it("should call createConsultation for valid doctor payload", async () => {
    serviceMock.createConsultation.mockResolvedValue({ id: "cons-1" })

    await request(app.getHttpServer())
      .post("/records/consultations")
      .set("x-role", "DOCTOR")
      .set("x-user-id", "doctor-user-1")
      .send({ appointmentId: "apt-1", diagnosis: "Migraine" })
      .expect(201)

    expect(serviceMock.createConsultation).toHaveBeenCalledWith(
      "doctor-user-1",
      expect.objectContaining({
        appointmentId: "apt-1",
        diagnosis: "Migraine",
      }),
    )
  })

  it("should return patient records for PATIENT role", async () => {
    serviceMock.getPatientRecords.mockResolvedValue([])

    await request(app.getHttpServer())
      .get("/records/consultations")
      .set("x-role", "PATIENT")
      .set("x-user-id", "patient-1")
      .expect(200)

    expect(serviceMock.getPatientRecords).toHaveBeenCalledWith("patient-1")
  })

  it("should reject doctor access when not assigned to consultation", async () => {
    serviceMock.getConsultation.mockResolvedValue({
      id: "cons-1",
      appointment: {
        patientId: "patient-1",
        doctorId: "doctor-profile-1",
      },
    })
    serviceMock.isDoctorAuthorized.mockResolvedValue(false)

    await request(app.getHttpServer())
      .get("/records/consultations/cons-1")
      .set("x-role", "DOCTOR")
      .set("x-user-id", "doctor-user-2")
      .expect(403)

    expect(serviceMock.isDoctorAuthorized).toHaveBeenCalledWith(
      "doctor-user-2",
      "doctor-profile-1",
    )
  })
})
