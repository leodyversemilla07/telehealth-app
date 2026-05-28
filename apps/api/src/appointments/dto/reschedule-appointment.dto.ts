import { ApiProperty } from "@nestjs/swagger"
import { IsDateString } from "class-validator"

export class RescheduleAppointmentDto {
  @ApiProperty({ description: "New proposed appointment start ISO timestamp" })
  @IsDateString()
  startTime!: string

  @ApiProperty({ description: "New proposed appointment end ISO timestamp" })
  @IsDateString()
  endTime!: string
}
