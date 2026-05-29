import { IsOptional, IsString, MaxLength } from "class-validator"

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string

  @IsOptional()
  @IsString()
  clinicAddress?: string

  @IsOptional()
  @IsString()
  pricePerVisit?: string
}
