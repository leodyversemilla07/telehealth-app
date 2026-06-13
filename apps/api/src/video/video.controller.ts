import { Body, Controller, Post } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Roles, Session } from "@thallesp/nestjs-better-auth"
import { JoinRoomDto } from "./dto"
import { VideoService } from "./video.service"

@ApiTags("Video")
@ApiBearerAuth("session-token")
@Roles(["PATIENT", "DOCTOR"])
@Controller("video")
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post("join")
  @ApiOperation({
    summary:
      "Join a video consultation room for an appointment (patient or doctor)",
  })
  @ApiOkResponse({ description: "Joined video room" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async joinRoom(@Session() session: UserSession, @Body() dto: JoinRoomDto) {
    return this.videoService.joinRoom(dto, session.user.id)
  }

  @Post("end")
  @ApiOperation({
    summary: "End a video consultation and mark the appointment as completed",
  })
  @ApiOkResponse({ description: "Video room ended" })
  @ApiBadRequestResponse({ description: "Invalid input" })
  @ApiUnauthorizedResponse({ description: "Not authenticated" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  async endRoom(@Session() session: UserSession, @Body() dto: JoinRoomDto) {
    return this.videoService.endRoom(dto, session.user.id)
  }
}
