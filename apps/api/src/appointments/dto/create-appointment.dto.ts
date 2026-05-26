import { VisitType } from "@generated/prisma/client.js"
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator"

export class CreateAppointmentDto {
  @IsString()
  providerId!: string

  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string

  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  symptoms?: string

  @IsOptional()
  @IsEnum(VisitType)
  type?: VisitType
}
