import { ApiProperty } from "@nestjs/swagger"
import { IsString, MaxLength, MinLength } from "class-validator"

export class GetRecommendationDto {
  @ApiProperty({
    description: "Patient-described symptoms or healthcare needs",
    example: "I've been experiencing chest pain and shortness of breath",
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  symptoms!: string
}
