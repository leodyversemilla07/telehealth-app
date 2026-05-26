import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator"

export class RegisterDoctorDto {
  @IsString()
  @MaxLength(100)
  specialty!: string

  @IsString()
  prcLicenseNumber!: string

  @IsDateString()
  prcLicenseExpiry!: string

  @IsOptional()
  @IsString()
  philhealthAccreditation?: string

  @IsOptional()
  @IsString()
  pdeaS2License?: string

  @IsOptional()
  @IsDateString()
  pdeaS2Expiry?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string

  @IsOptional()
  @IsString()
  clinicAddress?: string

  @IsOptional()
  @IsDecimal({ decimal_digits: "2" })
  pricePerVisit?: string

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean
}
