import { Body, Controller, Post } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { UserSession } from "@thallesp/nestjs-better-auth"
import { Session } from "@thallesp/nestjs-better-auth"
import { JoinRoomDto } from "@/video/dto"
import { VideoService } from "@/video/video.service"

@ApiTags("Video")
@ApiBearerAuth("session-token")
@Controller("video")
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post("join")
  @ApiOperation({
    summary:
      "Join a video consultation room for an appointment (patient or doctor)",
  })
  async joinRoom(@Session() session: UserSession, @Body() dto: JoinRoomDto) {
    return this.videoService.joinRoom(dto, session.user.id)
  }

  @Post("end")
  @ApiOperation({
    summary: "End a video consultation and mark the appointment as completed",
  })
  async endRoom(@Session() session: UserSession, @Body() dto: JoinRoomDto) {
    return this.videoService.endRoom(dto, session.user.id)
  }
}
