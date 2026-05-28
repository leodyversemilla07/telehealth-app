import { Type } from "class-transformer"
import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator"

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsDateString()
  dob?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sex?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  philhealthNumber?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number

  @IsOptional()
  @IsObject()
  medicalHistory?: Record<string, unknown>
}
