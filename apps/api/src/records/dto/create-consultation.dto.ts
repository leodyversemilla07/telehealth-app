import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { CreatePrescriptionDto } from "./create-prescription.dto.js"

export class CreateConsultationDto {
  @IsString()
  appointmentId!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  doctorNotes?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosis?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  plan?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[]
}
