import { Inject } from "@nestjs/common"
import type {
  DoctorPatientItemDto,
  DoctorPatientRecordsDto,
  PatientMedicalHistoryDto,
} from "@workspace/shared"
import {
  Ctx,
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares,
} from "nestjs-trpc"
import type { AuthedTrpcContext } from "../trpc/context.types"
import { paginationInput } from "../trpc/contracts.util"
import { AuthMiddleware } from "../trpc/middlewares/auth.middleware"
import { RolesMiddleware } from "../trpc/middlewares/roles.middleware"
import {
  byAppointmentInput,
  type CreateConsultationInput,
  createConsultationInput,
  patientIdInput,
} from "./records.contracts"
import { RecordsService } from "./records.service"

/**
 * Single boundary where a raw Prisma shape becomes the shared records DTO.
 * The procedures below return the DTOs, so the generated AppRouter types are
 * the client contract (no `as unknown as` casts at the web boundary). Dates
 * stay as `Date` — the global PhtDateInterceptor converts them to PHT
 * strings on the wire, exactly like the appointment/consultation DTOs.
 */
function toDoctorPatientItems(
  r: Awaited<ReturnType<RecordsService["getDoctorPatients"]>>,
): {
  items: DoctorPatientItemDto[]
  total: number
  limit: number
  offset: number
} {
  return { ...r, items: r.items }
}

function toDoctorPatientRecords(
  r: Awaited<ReturnType<RecordsService["getPatientRecordsForDoctor"]>>,
): DoctorPatientRecordsDto {
  return {
    patient: {
      id: r.patient.id,
      name: r.patient.name,
      email: r.patient.email,
      patientProfile: r.patient.patientProfile
        ? {
            dob: r.patient.patientProfile.dob,
            sex: r.patient.patientProfile.sex,
            phone: r.patient.patientProfile.phone,
            address: r.patient.patientProfile.address,
            philhealthNumber: r.patient.patientProfile.philhealthNumber,
            weight: r.patient.patientProfile.weight,
            height: r.patient.patientProfile.height,
            // Prisma JSON — the stored medical-history object is validated at
            // write time; normalize to the shared shape here once.
            medicalHistory: r.patient.patientProfile
              .medicalHistory as unknown as PatientMedicalHistoryDto | null,
          }
        : null,
    },
    appointments: r.appointments.map((appt) => ({
      id: appt.id,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      reason: appt.reason,
      symptoms: appt.symptoms,
      type: appt.type,
      consultation: appt.consultation
        ? {
            id: appt.consultation.id,
            diagnosis: appt.consultation.diagnosis,
            doctorNotes: appt.consultation.doctorNotes,
            plan: appt.consultation.plan,
            patientNotes: appt.consultation.patientNotes,
            prescriptions: appt.consultation.prescriptions.map((p) => ({
              id: p.id,
              medicationName: p.medicationName,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              instructions: p.instructions,
            })),
          }
        : null,
    })),
  }
}

/**
 * tRPC router for medical records (the retired RecordsController had its
 * routes folded here). Doctors create
 * consultations (incl. prescriptions) and read their patients; patients read
 * their own consultations + prescriptions.
 */
@Router({ alias: "records" })
export class RecordsRouter {
  constructor(
    @Inject(RecordsService) private readonly records: RecordsService,
  ) {}

  // ─── Doctor: record a consultation ──────────────────────────────────

  @Mutation({
    input: createConsultationInput,
    meta: { roles: ["DOCTOR"] },
  })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async create(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: CreateConsultationInput,
  ) {
    return this.records.createConsultation(ctx.user.id, input)
  }

  // ─── Read consultation by appointment (patient or doctor) ───────────

  @Query({ input: byAppointmentInput })
  @UseMiddlewares(AuthMiddleware)
  async byAppointment(
    @Ctx() ctx: AuthedTrpcContext,
    @Input("appointmentId") appointmentId: string,
  ) {
    return this.records.getConsultationByAppointment(
      appointmentId,
      ctx.user.id,
      ctx.user.role as string,
    )
  }

  // ─── Patient: my records + prescriptions ────────────────────────────

  @Query({ input: paginationInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myRecords(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.records.getPatientRecords(
      ctx.user.id,
      input.limit,
      input.offset,
    )
  }

  @Query({ input: paginationInput, meta: { roles: ["PATIENT"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async myPrescriptions(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return this.records.getPatientPrescriptions(
      ctx.user.id,
      input.limit,
      input.offset,
    )
  }

  // ─── Doctor: patients + per-patient records ─────────────────────────

  @Query({ input: paginationInput, meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async doctorPatients(
    @Ctx() ctx: AuthedTrpcContext,
    @Input() input: { limit?: number; offset?: number },
  ) {
    return toDoctorPatientItems(
      await this.records.getDoctorPatients(
        ctx.user.id,
        input.limit,
        input.offset,
      ),
    )
  }

  @Query({ input: patientIdInput, meta: { roles: ["DOCTOR"] } })
  @UseMiddlewares(AuthMiddleware, RolesMiddleware)
  async doctorPatientRecords(
    @Ctx() ctx: AuthedTrpcContext,
    @Input("patientId") patientId: string,
  ) {
    return toDoctorPatientRecords(
      await this.records.getPatientRecordsForDoctor(patientId, ctx.user.id),
    )
  }
}
