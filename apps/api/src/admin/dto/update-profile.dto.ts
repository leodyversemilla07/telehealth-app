import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator"

// Admin edit of the canonical display name. The users/dto DTO of the same
// name is intentionally a different shape (firstName/middleName/lastName,
// recomputed server-side) — do not merge them.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsUrl()
  image?: string
}
