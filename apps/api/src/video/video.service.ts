import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AccessToken, RoomServiceClient } from "livekit-server-sdk"
import { PrismaService } from "@/prisma/prisma.service"
import type { JoinRoomDto } from "./dto"

@Injectable()
export class VideoService {
  private readonly livekitUrl: string
  private readonly livekitApiKey: string
  private readonly livekitApiSecret: string
  private readonly roomServiceClient: RoomServiceClient

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.livekitUrl = this.configService.getOrThrow<string>("LIVEKIT_URL")
    this.livekitApiKey =
      this.configService.getOrThrow<string>("LIVEKIT_API_KEY")
    this.livekitApiSecret =
      this.configService.getOrThrow<string>("LIVEKIT_API_SECRET")

    this.roomServiceClient = new RoomServiceClient(
      this.livekitUrl,
      this.livekitApiKey,
      this.livekitApiSecret,
    )
  }

  /**
   * Create a unique LiveKit room for an appointment.
   * F-CONSULT-01: Generate unique video room for each appointment.
   */
  async createRoom(
    appointmentId: string,
    doctorName: string,
    patientName: string,
  ) {
    const roomName = `appointment-${appointmentId}`

    const room = await this.roomServiceClient.createRoom({
      name: roomName,
      metadata: JSON.stringify({
        appointmentId,
        doctorName,
        patientName,
      }),
    })

    return {
      roomName: room.name,
      url: this.livekitUrl,
    }
  }

  /**
   * Generate a LiveKit access token for a participant.
   * F-CONSULT-03: Doctor gets canUpdateMetadata for admit control.
   * F-CONSULT-04: Both participants get canPublish and canSubscribe for mute/camera/end-call.
   */
  async generateToken(
    participantIdentity: string,
    roomName: string,
    isDoctor: boolean,
  ): Promise<string> {
    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: participantIdentity,
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      // Doctor gets canUpdateMetadata for admit control (F-CONSULT-03)
      ...(isDoctor && { canUpdateMetadata: true }),
    })

    return await token.toJwt()
  }

  /**
   * Join a video room for an appointment.
   * F-CONSULT-02: Patient can join at appointment start time.
   * Validates appointment exists, user is participant, status is CONFIRMED/IN_PROGRESS,
   * and current time is within the appointment window (5 min before start to end).
   */
  async joinRoom(
    dto: JoinRoomDto,
    userId: string,
  ): Promise<{
    token: string
    url: string
    roomName: string
  }> {
    const { appointmentId } = dto

    // Validate appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: {
          select: {
            id: true,
            userId: true,
            specialty: true,
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!appointment) {
      throw new NotFoundException("Appointment not found")
    }

    // Determine if the current user is the patient or the doctor
    const isPatient = appointment.patientId === userId
    let isDoctor = false

    if (!isPatient) {
      // Check if user is the assigned doctor
      if (appointment.doctor.userId === userId) {
        isDoctor = true
      } else {
        throw new ForbiddenException(
          "You are not a participant of this appointment",
        )
      }
    }

    // Validate appointment status — must be CONFIRMED or IN_PROGRESS
    if (
      appointment.status !== "CONFIRMED" &&
      appointment.status !== "IN_PROGRESS"
    ) {
      throw new ForbiddenException(
        "Appointment is not in a joinable state (must be CONFIRMED or IN_PROGRESS)",
      )
    }

    // Validate time window — 5 minutes before start to end
    const now = new Date()
    const windowStart = new Date(
      appointment.startTime.getTime() - 5 * 60 * 1000,
    )
    const windowEnd = appointment.endTime

    if (now < windowStart || now > windowEnd) {
      throw new ForbiddenException(
        "You can only join 5 minutes before the appointment start time and before the appointment ends",
      )
    }

    // Create room if not already exists (F-CONSULT-01)
    const roomName = `appointment-${appointmentId}`
    const doctorName = appointment.doctor.user.name ?? "Doctor"
    const patientName = appointment.patient.name ?? "Patient"

    let roomUrl = appointment.roomUrl

    if (!roomUrl) {
      const room = await this.createRoom(appointmentId, doctorName, patientName)
      roomUrl = room.url

      // Update appointment with room URL and set status to IN_PROGRESS
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          roomUrl,
          status: "IN_PROGRESS",
        },
      })
    } else if (appointment.status === "CONFIRMED") {
      // Room already exists but status hasn't been updated yet
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "IN_PROGRESS" },
      })
    }

    // Generate token for the participant
    const participantIdentity = isDoctor
      ? `doctor-${userId}`
      : `patient-${userId}`
    const token = await this.generateToken(
      participantIdentity,
      roomName,
      isDoctor,
    )

    return {
      token,
      url: roomUrl || this.livekitUrl,
      roomName,
    }
  }

  /**
   * End a video room for an appointment.
   * F-CONSULT-05: Redirect to post-visit screen after call ends.
   * F-CONSULT-06: Store call metadata (duration, participants, timestamps).
   */
  async endRoom(
    dto: JoinRoomDto,
    userId: string,
  ): Promise<{
    appointmentId: string
    status: string
    endedAt: Date
    duration: number
  }> {
    const { appointmentId } = dto

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { userId: true } },
      },
    })

    if (!appointment) {
      throw new NotFoundException("Appointment not found")
    }

    if (appointment.status !== "IN_PROGRESS") {
      throw new ForbiddenException(
        "Appointment is not in progress and cannot be ended",
      )
    }

    if (
      appointment.patientId !== userId &&
      appointment.doctor.userId !== userId
    ) {
      throw new ForbiddenException(
        "You are not a participant of this appointment",
      )
    }

    // Delete the LiveKit room (ends the call for all participants)
    const roomName = `appointment-${appointmentId}`
    try {
      await this.roomServiceClient.deleteRoom(roomName)
    } catch {
      // Room may already be empty/deleted — that's fine
    }

    // Calculate duration in seconds
    const endedAt = new Date()
    const duration = Math.round(
      (endedAt.getTime() - appointment.startTime.getTime()) / 1000,
    )

    // Store metadata and mark appointment as COMPLETED (F-CONSULT-06)
    const metadata = JSON.stringify({
      endedAt: endedAt.toISOString(),
      duration,
      roomName,
      participants: ["doctor", "patient"],
    })

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        notes: metadata,
      },
    })

    return {
      appointmentId,
      status: "COMPLETED",
      endedAt,
      duration,
    }
  }
}
