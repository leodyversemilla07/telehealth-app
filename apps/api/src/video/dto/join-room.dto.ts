import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class JoinRoomDto {
  @ApiProperty({
    description: "Appointment ID to join the video room for",
    example: "clx1abc2d0003f7x9ghij",
  })
  @IsString()
  appointmentId!: string
}
