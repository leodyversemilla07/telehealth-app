import { IsOptional, IsString, MaxLength } from "class-validator"

export class CreatePrescriptionDto {
  @IsString()
  @MaxLength(200)
  medicationName!: string

  @IsString()
  @MaxLength(100)
  dosage!: string

  @IsString()
  @MaxLength(100)
  frequency!: string

  @IsString()
  @MaxLength(100)
  duration!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string
}
