import { AuditLogsController } from "./audit-logs.controller"
import { AuditLogsService } from "./audit-logs.service"

describe("AuditLogsController", () => {
  let controller: AuditLogsController
  let service: { getLogs: jest.Mock }

  beforeEach(() => {
    service = { getLogs: jest.fn().mockResolvedValue({ items: [] }) }
    controller = new AuditLogsController(service as unknown as AuditLogsService)
  })

  it("defaults to 50 limit / 0 offset", async () => {
    await controller.getLogs(undefined, undefined)
    expect(service.getLogs).toHaveBeenCalledWith(50, 0)
  })

  it("parses numeric pagination", async () => {
    await controller.getLogs("100", "20")
    expect(service.getLogs).toHaveBeenCalledWith(100, 20)
  })

  it("clamps the limit to 200", async () => {
    await controller.getLogs("999", "0")
    expect(service.getLogs).toHaveBeenCalledWith(200, 0)
  })

  it("falls back on non-numeric values", async () => {
    await controller.getLogs("abc", "xyz")
    expect(service.getLogs).toHaveBeenCalledWith(50, 0)
  })
})
