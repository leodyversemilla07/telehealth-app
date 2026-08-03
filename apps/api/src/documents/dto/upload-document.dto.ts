import { IsIn, IsOptional, IsUUID } from "class-validator"

export const DOCUMENT_TYPES = [
  "LAB_RESULT",
  "PRESCRIPTION",
  "IMAGING",
  "OTHER",
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export class UploadDocumentDto {
  @IsUUID()
  appointmentId!: string

  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  type?: DocumentType
}
