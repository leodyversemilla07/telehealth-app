import { IsInt, IsOptional, IsString, Min, Max } from "class-validator"

export class SetAvailabilityDto {
  @IsOptional() @IsString() monday?: string
  @IsOptional() @IsString() tuesday?: string
  @IsOptional() @IsString() wednesday?: string
  @IsOptional() @IsString() thursday?: string
  @IsOptional() @IsString() friday?: string
  @IsOptional() @IsString() saturday?: string
  @IsOptional() @IsString() sunday?: string

  @IsOptional() @IsInt() @Min(15) @Max(120) slotDuration?: number
}
