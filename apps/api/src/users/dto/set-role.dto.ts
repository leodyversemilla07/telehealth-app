import { IsEnum } from "class-validator"

export class SetRoleDto {
  @IsEnum(["PATIENT", "DOCTOR", "ADMIN"], {
    message: 'role must be "PATIENT", "DOCTOR", or "ADMIN"',
  })
  role!: "PATIENT" | "DOCTOR" | "ADMIN"
}
