import { Type } from "class-transformer"
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator"

export class WeeklySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number

  @IsString()
  startTime!: string // HH:mm

  @IsString()
  endTime!: string // HH:mm

  @IsInt()
  @Min(15)
  slotDuration!: number // minutes

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklySlotDto)
  slots!: WeeklySlotDto[]
}
