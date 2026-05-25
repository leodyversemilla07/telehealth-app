import { IsEnum } from "class-validator"

export class SetRoleDto {
  @IsEnum(["PATIENT", "PROVIDER", "ADMIN"], {
    message: 'role must be "PATIENT", "PROVIDER", or "ADMIN"',
  })
  role!: "PATIENT" | "PROVIDER" | "ADMIN"
}
