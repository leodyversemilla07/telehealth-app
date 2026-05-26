import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator"
import { VisitType } from "@generated/prisma/client.js"

export class CreateAppointmentDto {
  @IsString()
  providerId!: string

  @IsString()
  scheduleId!: string

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
