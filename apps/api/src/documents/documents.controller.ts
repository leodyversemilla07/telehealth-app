import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import type { Response } from "express"
import { DocumentsService, type UserRole } from "./documents.service"
import { UploadDocumentDto } from "./dto/upload-document.dto"

/** Medical documents: allow up to 10MB (matches StorageService.MAX_FILE_SIZE). */
const MAX_MEDICAL_FILE_SIZE = 10 * 1024 * 1024

@ApiTags("Medical Documents")
@ApiBearerAuth("session-token")
@Controller("documents")
@Roles(["PATIENT", "DOCTOR", "ADMIN"])
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_MEDICAL_FILE_SIZE },
    }),
  )
  @ApiOperation({ summary: "Upload a medical document for an appointment" })
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({ description: "Document uploaded" })
  @ApiBadRequestResponse({ description: "No file, invalid type, or too large" })
  @ApiForbiddenResponse({
    description: "Not a participant of this appointment",
  })
  async upload(
    @Session() session: UserSession,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.upload(
      session.user.id,
      session.user.role as UserRole,
      dto,
      file,
    )
  }

  @Get("appointment/:appointmentId")
  @ApiOperation({ summary: "List documents for an appointment" })
  @ApiOkResponse({ description: "Documents for the appointment" })
  async listForAppointment(
    @Session() session: UserSession,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.documentsService.listForAppointment(
      session.user.id,
      session.user.role as UserRole,
      appointmentId,
    )
  }

  @Get("patient/me")
  @ApiOperation({ summary: "List the signed-in patient's documents" })
  @ApiOkResponse({ description: "The patient's documents" })
  async listMine(@Session() session: UserSession) {
    return this.documentsService.listForUser(
      session.user.id,
      session.user.role as UserRole,
    )
  }

  @Get(":id/file")
  @ApiOperation({ summary: "Stream a document's bytes (authorized only)" })
  @ApiOkResponse({ description: "Document bytes" })
  @ApiNotFoundResponse({ description: "Document not found" })
  async streamFile(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.getFile(
      session.user.id,
      session.user.role as UserRole,
      id,
    )
    res.setHeader("Content-Type", file.contentType)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    )
    res.setHeader("Content-Length", String(file.sizeBytes))
    res.setHeader("Cache-Control", "private, no-store")
    res.send(file.data)
  }
}
