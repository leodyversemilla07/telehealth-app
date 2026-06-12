import { IsOptional, IsString, Matches, MaxLength } from "class-validator"

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
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: "pricePerVisit must be a valid number with up to 2 decimal places",
  })
  pricePerVisit?: string
}
