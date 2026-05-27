import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator"

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsUrl()
  image?: string

  @IsOptional()
  @IsEnum(["DOCTOR"] as const)
  role?: "DOCTOR"
}
