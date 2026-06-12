import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { PaginationDto } from "../common/dto/pagination.dto"
import { CreateConsultationDto } from "./dto/create-consultation.dto"
import { CreatePrescriptionDto } from "./dto/create-prescription.dto"
import { RecordsService } from "./records.service"

@ApiTags("Medical Records")
@ApiBearerAuth("session-token")
@Controller("records")
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  // ─── Doctor: Create consultation after appointment ──────────────────

  @Post("consultations")
  @Roles(["DOCTOR"])
  @ApiOperation({
    summary: "Create consultation notes after a completed appointment (Doctor)",
  })
  async createConsultation(
    @Session() session: UserSession,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.recordsService.createConsultation(session.user.id, dto)
  }

  // ─── Get consultation by appointment ID ─────────────────────────────

  @Get("appointment/:appointmentId")
  @Roles(["PATIENT", "DOCTOR", "ADMIN"])
  @ApiOperation({
    summary: "Get consultation details by appointment ID (Patient or Doctor)",
  })
  @ApiParam({ name: "appointmentId", description: "Appointment ID" })
  async getConsultationByAppointment(
    @Session() session: UserSession,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.recordsService.getConsultationByAppointment(
      appointmentId,
      session.user.id,
      session.user.role as string,
    )
  }

  // ─── Patient: Get own medical records ───────────────────────────────

  @Get("consultations")
  @Roles(["PATIENT"])
  @ApiOperation({
    summary: "Get all my medical records / consultations (Patient)",
  })
  async getMyRecords(
    @Session() session: UserSession,
    @Query() pagination: PaginationDto,
  ) {
    return this.recordsService.getPatientRecords(
      session.user.id,
      pagination.limit,
      pagination.offset,
    )
  }

  // ─── Get single consultation detail ─────────────────────────────────

  @Get("consultations/:id")
  @Roles(["PATIENT", "DOCTOR", "ADMIN"])
  @ApiOperation({
    summary: "Get a single consultation detail (Patient or Doctor)",
  })
  @ApiParam({ name: "id", description: "Consultation ID" })
  async getConsultation(
    @Session() session: UserSession,
    @Param("id") id: string,
  ) {
    const consultation = await this.recordsService.getConsultation(id)

    // Authorization: only the patient or the assigned doctor (or admin) may view
    const userId = session.user.id
    const role = session.user.role as string

    if (role === "ADMIN") return consultation

    if (role === "PATIENT") {
      if (consultation.appointment.patientId !== userId) {
        throw new ForbiddenException("Not your medical record")
      }
      return consultation
    }

    if (role === "DOCTOR") {
      // Delegate authorization check to the service
      const isAuthorized = await this.recordsService.isDoctorAuthorized(
        userId,
        consultation.appointment.doctorId,
      )
      if (!isAuthorized) {
        throw new ForbiddenException("Not your medical record")
      }
      return consultation
    }

    throw new ForbiddenException("Not your medical record")
  }

  // ─── Doctor: Add prescription to consultation ───────────────────────

  @Post("consultations/:id/prescriptions")
  @Roles(["DOCTOR"])
  @ApiOperation({
    summary: "Add a prescription to an existing consultation (Doctor)",
  })
  @ApiParam({ name: "id", description: "Consultation ID" })
  async addPrescription(
    @Session() session: UserSession,
    @Param("id") consultationId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.recordsService.addPrescription(
      consultationId,
      session.user.id,
      dto,
    )
  }

  // ─── Patient: Get all prescriptions across consultations ────────────

  @Get("prescriptions")
  @Roles(["PATIENT"])
  @ApiOperation({
    summary: "Get all my prescriptions across all consultations (Patient)",
  })
  async getMyPrescriptions(
    @Session() session: UserSession,
    @Query() pagination: PaginationDto,
  ) {
    return this.recordsService.getPatientPrescriptions(
      session.user.id,
      pagination.limit,
      pagination.offset,
    )
  }

  // ─── Doctor: Access patient records ─────────────────────────────────

  @Get("doctor/patients")
  @Roles(["DOCTOR"])
  @ApiOperation({
    summary: "Get all patients the doctor has seen",
  })
  async getDoctorPatients(
    @Session() session: UserSession,
    @Query() pagination: PaginationDto,
  ) {
    return this.recordsService.getDoctorPatients(
      session.user.id,
      pagination.limit,
      pagination.offset,
    )
  }

  @Get("doctor/patient/:patientId")
  @Roles(["DOCTOR"])
  @ApiOperation({
    summary: "Get a patient's medical history for the doctor",
  })
  @ApiParam({ name: "patientId", description: "Patient user ID" })
  async getPatientRecordsForDoctor(
    @Session() session: UserSession,
    @Param("patientId") patientId: string,
  ) {
    return this.recordsService.getPatientRecordsForDoctor(
      patientId,
      session.user.id,
    )
  }
}
