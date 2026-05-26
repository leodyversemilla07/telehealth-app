import { IsDateString, IsString } from "class-validator"

export class RescheduleAppointmentDto {
  @IsString()
  scheduleId!: string

  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string
}
