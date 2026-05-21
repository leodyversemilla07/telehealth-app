import { IsDateString, IsOptional, IsString } from "class-validator"

export class BanUserDto {
  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
