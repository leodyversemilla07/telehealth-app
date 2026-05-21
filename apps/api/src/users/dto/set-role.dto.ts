import { IsEnum } from "class-validator"

export class SetRoleDto {
  @IsEnum(["USER", "ADMIN"], { message: 'role must be "USER" or "ADMIN"' })
  role!: "USER" | "ADMIN"
}
