import { IsInt, IsJSON, IsOptional, IsString, Min, Max } from "class-validator"

export class SetAvailabilityDto {
  @IsOptional()
  @IsJSON()
  monday?: string

  @IsOptional()
  @IsJSON()
  tuesday?: string

  @IsOptional()
  @IsJSON()
  wednesday?: string

  @IsOptional()
  @IsJSON()
  thursday?: string

  @IsOptional()
  @IsJSON()
  friday?: string

  @IsOptional()
  @IsJSON()
  saturday?: string

  @IsOptional()
  @IsJSON()
  sunday?: string

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  slotDuration?: number // minutes (15, 30, 60, etc.)
}
