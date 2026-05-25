import { IsDateString, IsOptional, IsString } from "class-validator"

export class CreateTimeOffDto {
  @IsDateString()
  date!: string

  @IsString()
  startTime!: string // HH:mm

  @IsString()
  endTime!: string // HH:mm

  @IsOptional()
  @IsString()
  reason?: string
}
