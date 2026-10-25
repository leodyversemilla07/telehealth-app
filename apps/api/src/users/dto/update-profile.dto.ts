import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator"

// Self-service edit of the individual name parts; the service recomputes the
// canonical `name`. The admin/dto DTO of the same name edits `name` directly
// and is intentionally a different shape — do not merge them.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string

  @IsOptional()
  @IsUrl()
  image?: string
}
