import { IsOptional, IsString, MaxLength } from "class-validator"

export class RejectDoctorDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string
}
