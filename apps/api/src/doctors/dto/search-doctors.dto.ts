import { IsEnum, IsOptional, IsString } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"

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
    description: "Search by doctor name or specialty (case-insensitive partial match)",
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
}
