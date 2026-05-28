import { IsBoolean, IsIn, IsString, MaxLength } from "class-validator"

const CONSENT_TYPES = [
  "privacy_policy",
  "data_sharing",
  "recording",
  "marketing",
] as const

export class RecordConsentDto {
  @IsString()
  @IsIn(CONSENT_TYPES)
  @MaxLength(64)
  consentType!: (typeof CONSENT_TYPES)[number]

  @IsBoolean()
  granted!: boolean
}
