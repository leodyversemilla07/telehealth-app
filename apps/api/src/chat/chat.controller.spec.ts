import { ChatController } from "./chat.controller"
import { ChatService } from "./chat.service"

describe("ChatController", () => {
  let controller: ChatController
  let service: {
    sendMessage: jest.Mock
    getConversations: jest.Mock
    getConversation: jest.Mock
    markAsRead: jest.Mock
    getUnreadCount: jest.Mock
    getContacts: jest.Mock
  }

  const session = {
    user: { id: "user-1", role: "PATIENT" },
    session: { id: "sess-1" },
  }

  beforeEach(() => {
    service = {
      sendMessage: jest.fn().mockResolvedValue({ id: "msg-1" }),
      getConversations: jest.fn().mockResolvedValue([]),
      getConversation: jest.fn().mockResolvedValue([]),
      markAsRead: jest.fn().mockResolvedValue({ count: 3 }),
      getUnreadCount: jest.fn().mockResolvedValue(0),
      getContacts: jest.fn().mockResolvedValue([]),
    }
    controller = new ChatController(service as unknown as ChatService)
  })

  it("sendMessage delegates with appointmentId", async () => {
    await controller.sendMessage(
      session as never,
      {
        receiverId: "doc-1",
        content: "hello",
        appointmentId: "apt-1",
      } as never,
    )
    expect(service.sendMessage).toHaveBeenCalledWith(
      "user-1",
      "doc-1",
      "hello",
      "apt-1",
    )
  })

  it("sendMessage passes undefined appointmentId when omitted", async () => {
    await controller.sendMessage(
      session as never,
      { receiverId: "doc-1", content: "hello" } as never,
    )
    expect(service.sendMessage).toHaveBeenCalledWith(
      "user-1",
      "doc-1",
      "hello",
      undefined,
    )
  })

  it("getConversations delegates with the user id", async () => {
    await controller.getConversations(session as never)
    expect(service.getConversations).toHaveBeenCalledWith("user-1")
  })

  it("getConversation defaults to 50 messages", async () => {
    await controller.getConversation(session as never, "doc-1", undefined)
    expect(service.getConversation).toHaveBeenCalledWith("user-1", "doc-1", 50)
  })

  it("getConversation parses a numeric limit", async () => {
    await controller.getConversation(session as never, "doc-1", "25")
    expect(service.getConversation).toHaveBeenCalledWith("user-1", "doc-1", 25)
  })

  it("getConversation clamps the limit to 200", async () => {
    await controller.getConversation(session as never, "doc-1", "999")
    expect(service.getConversation).toHaveBeenCalledWith("user-1", "doc-1", 200)
  })

  it("markAsRead delegates with the sender id", async () => {
    await controller.markAsRead(session as never, "doc-1")
    expect(service.markAsRead).toHaveBeenCalledWith("user-1", "doc-1")
  })

  it("getUnreadCount delegates", async () => {
    await expect(controller.getUnreadCount(session as never)).resolves.toBe(0)
    expect(service.getUnreadCount).toHaveBeenCalledWith("user-1")
  })

  it("getContacts delegates", async () => {
    await controller.getContacts(session as never)
    expect(service.getContacts).toHaveBeenCalledWith("user-1")
  })
})
