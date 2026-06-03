import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator"
import { VisitType } from "../../generated/prisma/client.js"

export class CreateAppointmentDto {
  @ApiProperty({ description: "The unique ID of the doctor profile" })
  @IsString()
  doctorId!: string

  @ApiProperty({
    description: "The unique ID of the availability schedule block",
  })
  @IsString()
  scheduleId!: string

  @ApiProperty({ description: "The appointment start timestamp in ISO format" })
  @IsDateString()
  startTime!: string

  @ApiProperty({ description: "The appointment end timestamp in ISO format" })
  @IsDateString()
  endTime!: string

  @ApiPropertyOptional({
    description: "The clinical reason for booking the consultation",
  })
  @IsOptional()
  @IsString()
  reason?: string

  @ApiPropertyOptional({
    description: "Intake symptom details reported by the patient",
  })
  @IsOptional()
  @IsString()
  symptoms?: string

  @ApiPropertyOptional({
    enum: VisitType,
    default: VisitType.VIDEO,
    description: "The mode of consultation",
  })
  @IsOptional()
  @IsEnum(VisitType)
  type?: VisitType
}
