import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsOptional, IsString, Max, Min } from "class-validator"

export enum SortOption {
  PRICE = "price",
  NAME = "name",
}

export class SearchDoctorsDto {
  @ApiPropertyOptional({
    description: "Filter by specialty (case-insensitive partial match)",
    example: "Cardiology",
  })
  @IsOptional()
  @IsString()
  specialty?: string

  @ApiPropertyOptional({
    description:
      "Search by doctor name or specialty (case-insensitive partial match)",
    example: "Del Cruz",
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: "Sort results by price or name",
    enum: SortOption,
    example: "price",
  })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption

  @ApiPropertyOptional({
    description: "Number of results to return",
    default: 50,
  })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number

  @ApiPropertyOptional({ description: "Offset for pagination", default: 0 })
  @IsOptional()
  @Min(0)
  offset?: number
}
