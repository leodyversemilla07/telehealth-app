import { type INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import { AppRouterHost } from "nestjs-trpc"

// better-auth ships ESM-only (`.mjs`) and jest runs CJS — this is a router
// wiring test, not an auth-session test, so stub the auth package boundary:
// auth.ts calls createAuth(deps) at import (returning a stub auth object) and
// TrpcContext.create() calls auth.api.getSession only per-request.
jest.mock("@telehealth/auth", () => ({
  createAuth: jest.fn(() => ({ api: { getSession: jest.fn() } })),
}))

import { AppointmentsRouter } from "../appointments/appointments.router"
import { AppointmentsService } from "../appointments/appointments.service"
import { AvailabilityRouter } from "../availability/availability.router"
import { AvailabilityService } from "../availability/availability.service"
import { DoctorsRouter } from "../doctors/doctors.router"
import { DoctorsService } from "../doctors/doctors.service"
import { DocumentsRouter } from "../documents/documents.router"
import { DocumentsService } from "../documents/documents.service"
import { PatientsRouter } from "../patients/patients.router"
import { PatientsService } from "../patients/patients.service"
import { RecordsRouter } from "../records/records.router"
import { RecordsService } from "../records/records.service"
import type { BaseTrpcContext } from "./context.types"
import { TrpcModule } from "./trpc.module"

/**
 * Runtime tRPC shapes, inspected structurally so this test depends only on
 * the stable v11 procedure plumbing (`_def.type`, `_def.meta`, `_def.inputs`)
 * rather than generated router types. The page uses these exact shapes to
 * wire the client, so pinning them here replaces the manual curl probes.
 */
type ProcShape = {
  _def: {
    type: "query" | "mutation"
    meta?: { roles?: string[] }
    inputs: Array<{ parse: (input: unknown) => unknown }>
  }
}
type RouterShape = {
  /** appRouter._def.record flattens nested routers into name → proc maps. */
  _def: { record: Record<string, Record<string, ProcShape>> }
}

const doctorCtx: BaseTrpcContext = {
  session: {
    user: { id: "doctor-1", name: "Dr A", email: "dr@x.com", role: "DOCTOR" },
    session: { id: "sess-1", expiresAt: new Date() },
  },
}
const patientCtx: BaseTrpcContext = {
  session: {
    user: { id: "patient-1", name: "P", email: "p@x.com", role: "PATIENT" },
    session: { id: "sess-2", expiresAt: new Date() },
  },
}

describe("tRPC AppRouter wiring", () => {
  let app: INestApplication
  // Un-typed appRouter (tRPC AnyRouter) so structural wiring assertions below
  // can poke at the runtime procedure plumbing + createCaller freely.
  // biome-ignore lint/suspicious/noExplicitAny: intentional untyped router handle
  let appRouter: any
  const listed = [
    {
      id: "doctor-1",
      specialty: "General Practitioner",
      user: { id: "doctor-1", name: "Dr A", email: "dr@x.com" },
    },
  ]

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule],
      providers: [
        // Routers are discovered by scanning module providers for the @Router
        // decorator — provide them directly and stub each service so no DB is
        // touched (this test pins wiring + guards, not data).
        DoctorsRouter,
        AppointmentsRouter,
        AvailabilityRouter,
        RecordsRouter,
        DocumentsRouter,
        PatientsRouter,
        {
          provide: DoctorsService,
          useValue: {
            findApproved: jest.fn().mockResolvedValue(listed),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            register: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
        { provide: AppointmentsService, useValue: {} },
        { provide: AvailabilityService, useValue: {} },
        {
          provide: RecordsService,
          useValue: {
            getPatientRecords: jest.fn().mockResolvedValue({
              items: [],
              total: 0,
              limit: 20,
              offset: 0,
            }),
            getPatientPrescriptions: jest.fn(),
            createConsultation: jest.fn(),
            getConsultationByAppointment: jest.fn(),
            getDoctorPatients: jest.fn(),
            getPatientRecordsForDoctor: jest.fn(),
          },
        },
        { provide: DocumentsService, useValue: {} },
        {
          provide: PatientsService,
          useValue: {
            findByUserId: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useLogger(false)
    await app.init()
    appRouter = app.get(AppRouterHost).appRouter
  })

  afterAll(async () => {
    await app.close()
  })

  /** Nested-procedure accessor for a leaf procedure at a router.path. */
  function procedure(routerName: string, procName: string): ProcShape {
    const record = (appRouter as unknown as RouterShape)._def.record
    return record[routerName][procName]
  }
  function routerNames(): string[] {
    return Object.keys((appRouter as unknown as RouterShape)._def.record).sort()
  }
  function procedureNames(routerName: string): string[] {
    const record = (appRouter as unknown as RouterShape)._def.record
    return Object.keys(record[routerName]).sort()
  }

  it("registers all six feature routers", () => {
    expect(routerNames()).toEqual(
      [
        "appointments",
        "availability",
        "doctors",
        "documents",
        "patients",
        "records",
      ].sort(),
    )
  })

  it("registers the full procedure set per router (30 total)", () => {
    expect(procedureNames("doctors")).toEqual(
      ["byId", "list", "myProfile", "register", "updateMyProfile"].sort(),
    )
    expect(procedureNames("appointments")).toEqual(
      [
        "cancel",
        "create",
        "findHistory",
        "findMine",
        "findOne",
        "findUpcoming",
        "reschedule",
        "sendReminders",
        "updateStatus",
      ].sort(),
    )
    expect(procedureNames("availability")).toEqual(
      [
        "addTimeOff",
        "deleteTimeOff",
        "getAvailableSlots",
        "getMyAvailability",
        "getSchedule",
        "getTimeOff",
        "setAvailability",
      ].sort(),
    )
    expect(procedureNames("records")).toEqual(
      [
        "byAppointment",
        "create",
        "doctorPatientRecords",
        "doctorPatients",
        "myPrescriptions",
        "myRecords",
      ].sort(),
    )
    expect(procedureNames("documents")).toEqual(["byAppointment"])
    expect(procedureNames("patients")).toEqual(["me", "updateMe"].sort())
  })

  it("marks the right procedures as mutations vs queries", () => {
    expect(procedure("appointments", "create")._def.type).toBe("mutation")
    expect(procedure("records", "create")._def.type).toBe("mutation")
    expect(procedure("doctors", "register")._def.type).toBe("mutation")
    expect(procedure("records", "byAppointment")._def.type).toBe("query")
    expect(procedure("doctors", "list")._def.type).toBe("query")
  })

  it("pins role guards on procedures (roles meta)", () => {
    expect(procedure("records", "myRecords")._def.meta?.roles).toEqual([
      "PATIENT",
    ])
    expect(procedure("records", "doctorPatients")._def.meta?.roles).toEqual([
      "DOCTOR",
    ])
    expect(
      procedure("records", "doctorPatientRecords")._def.meta?.roles,
    ).toEqual(["DOCTOR"])
    expect(procedure("doctors", "register")._def.meta?.roles).toEqual([
      "PATIENT",
      "DOCTOR",
    ])
    expect(procedure("doctors", "myProfile")._def.meta?.roles).toEqual([
      "DOCTOR",
    ])
    // Public / auth-only procedures are unguarded by role
    expect(procedure("doctors", "list")._def.meta?.roles).toBeUndefined()
    expect(
      procedure("documents", "byAppointment")._def.meta?.roles,
    ).toBeUndefined()
  })

  // Regression pin for the input name-collision: appointments take `{id}`,
  // records/documents take `{appointmentId}`. In the generated AppRouter these
  // MUST stay distinct — a shared name would silently swap input shapes.
  it("keeps appointments `{id}` input distinct from records/documents `{appointmentId}`", () => {
    const findOne = procedure("appointments", "findOne")
    expect(findOne._def.inputs.length).toBeGreaterThan(0)
    expect(() => findOne._def.inputs[0].parse({ id: "a" })).not.toThrow()
    expect(() => findOne._def.inputs[0].parse({ appointmentId: "a" })).toThrow()

    const recordByAppt = procedure("records", "byAppointment")
    expect(() =>
      recordByAppt._def.inputs[0].parse({ appointmentId: "a" }),
    ).not.toThrow()
    expect(() => recordByAppt._def.inputs[0].parse({ id: "a" })).toThrow()

    const docByAppt = procedure("documents", "byAppointment")
    expect(() =>
      docByAppt._def.inputs[0].parse({ appointmentId: "a" }),
    ).not.toThrow()
  })

  it("pins doctors.register optional fields (nullable optionals after form null-normalization)", () => {
    const register = procedure("doctors", "register")
    expect(() =>
      register._def.inputs[0].parse({
        specialty: "GP",
        prcLicenseNumber: "123",
        prcLicenseExpiry: "2025-01-01",
        pricePerVisit: null,
        clinicAddress: null,
      }),
    ).not.toThrow()
    expect(() =>
      register._def.inputs[0].parse({ pricePerVisit: "12.345" }),
    ).toThrow()
  })

  it("runs the public doctors.list through the caller and returns service data", async () => {
    const caller = appRouter.createCaller({ session: null })
    await expect(caller.doctors.list({})).resolves.toEqual(listed)
  })

  it("rejects anonymous calls to auth-required procedures", async () => {
    const caller = appRouter.createCaller({ session: null })
    await expect(
      caller.records.byAppointment({ appointmentId: "a" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
    await expect(
      caller.documents.byAppointment({ appointmentId: "a" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  it("enforces role guards through the caller", async () => {
    // A DOCTOR must not read patient-owned records
    await expect(
      appRouter.createCaller(doctorCtx).records.myRecords({}),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })

    // A PATIENT may read their own records (service stubbed)
    await expect(
      appRouter.createCaller(patientCtx).records.myRecords({}),
    ).resolves.toEqual({ items: [], total: 0, limit: 20, offset: 0 })
  })
})
