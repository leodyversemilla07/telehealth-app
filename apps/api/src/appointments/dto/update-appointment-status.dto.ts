import { AppointmentStatus } from "@generated/prisma/client.js"
import { IsEnum } from "class-validator"

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus
}
