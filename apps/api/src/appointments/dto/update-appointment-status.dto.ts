import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { AppointmentStatus } from "../../generated/prisma/client.js"

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    description: "The next target clinical status of the appointment",
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus
}
