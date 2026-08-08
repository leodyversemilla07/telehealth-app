import type { UserSession } from "@thallesp/nestjs-better-auth"
import { JoinRoomDto } from "./dto"
import { VideoController } from "./video.controller"
import { VideoService } from "./video.service"

describe("VideoController", () => {
  let controller: VideoController
  let service: {
    joinRoom: jest.Mock
    endRoom: jest.Mock
  }

  const session = { user: { id: "user-1", role: "DOCTOR" } } as UserSession
  const dto = { appointmentId: "apt-1" } as JoinRoomDto

  beforeEach(() => {
    service = {
      joinRoom: jest.fn().mockResolvedValue({ token: "tk" }),
      endRoom: jest.fn().mockResolvedValue({ status: "ENDED" }),
    }
    controller = new VideoController(service as unknown as VideoService)
  })

  it("joinRoom delegates with dto then user id", async () => {
    await expect(controller.joinRoom(session, dto)).resolves.toEqual({
      token: "tk",
    })
    expect(service.joinRoom).toHaveBeenCalledWith(dto, "user-1")
  })

  it("endRoom delegates with dto then user id", async () => {
    await expect(controller.endRoom(session, dto)).resolves.toEqual({
      status: "ENDED",
    })
    expect(service.endRoom).toHaveBeenCalledWith(dto, "user-1")
  })
})
