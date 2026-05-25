import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator"

export enum CreateAppointmentVisitType {
  VIDEO = "VIDEO",
  PHONE = "PHONE",
  IN_PERSON = "IN_PERSON",
}

export class CreateAppointmentDto {
  @IsUUID()
  providerProfileId!: string

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
  @IsEnum(CreateAppointmentVisitType)
  type?: CreateAppointmentVisitType
}

export class UpdateAppointmentStatusDto {
  @IsEnum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
  status!: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
}

export class RescheduleAppointmentDto {
  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string
}
