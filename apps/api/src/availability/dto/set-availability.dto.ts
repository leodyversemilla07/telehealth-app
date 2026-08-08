import {
  IsInt,
  IsOptional,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator"
import { isValidDayWindowJson } from "../day-window.util"

/**
 * Class-validator counterpart of the zod `daySchedule` refine on the tRPC
 * contract. The appointments service JSON.parses day schedules at booking
 * time and treats a non-array as "no windows" — so anything that isn't a
 * JSON array of HH:MM-HH:MM windows must fail here at write time, never
 * silently brick the doctor's schedule.
 */
@ValidatorConstraint({ name: "isDayWindowJson", async: false })
export class IsDayWindowJson implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isValidDayWindowJson(value)
  }

  defaultMessage(): string {
    return "must be a JSON array of HH:MM-HH:MM windows (end after start, within 00:00-24:00)"
  }
}

export class SetAvailabilityDto {
  @IsOptional()
  @Validate(IsDayWindowJson)
  monday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  tuesday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  wednesday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  thursday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  friday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  saturday?: string

  @IsOptional()
  @Validate(IsDayWindowJson)
  sunday?: string

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  slotDuration?: number // minutes (15, 30, 60, etc.)
}
