import { AdminController } from "./admin.controller"
import { AdminService } from "./admin.service"

describe("AdminController", () => {
  let controller: AdminController
  let service: {
    getDashboardStats: jest.Mock
    getReports: jest.Mock
    listUsers: jest.Mock
    getUser: jest.Mock
    updateUser: jest.Mock
    banUser: jest.Mock
    unbanUser: jest.Mock
    setRole: jest.Mock
    listAllDoctors: jest.Mock
    approveDoctor: jest.Mock
    rejectDoctor: jest.Mock
    verifyDoctor: jest.Mock
    unverifyDoctor: jest.Mock
  }

  const session = {
    user: { id: "admin-1", role: "ADMIN" },
    session: { id: "sess-1", ipAddress: "1.2.3.4" },
  }

  beforeEach(() => {
    service = {
      getDashboardStats: jest.fn().mockResolvedValue({ totalUsers: 1 }),
      getReports: jest.fn().mockResolvedValue({ totalAppointments: 5 }),
      listUsers: jest.fn().mockResolvedValue([]),
      getUser: jest.fn().mockResolvedValue({ id: "u1" }),
      updateUser: jest.fn().mockResolvedValue({ id: "u1" }),
      banUser: jest.fn().mockResolvedValue({ id: "u1" }),
      unbanUser: jest.fn().mockResolvedValue({ id: "u1" }),
      setRole: jest.fn().mockResolvedValue({ id: "u1", role: "DOCTOR" }),
      listAllDoctors: jest.fn().mockResolvedValue([]),
      approveDoctor: jest.fn().mockResolvedValue({ id: "doc-1" }),
      rejectDoctor: jest.fn().mockResolvedValue({ id: "doc-1" }),
      verifyDoctor: jest.fn().mockResolvedValue({ id: "doc-1" }),
      unverifyDoctor: jest.fn().mockResolvedValue({ id: "doc-1" }),
    }
    controller = new AdminController(service as unknown as AdminService)
  })

  it("getDashboard delegates to the service", async () => {
    await expect(controller.getDashboard()).resolves.toEqual({ totalUsers: 1 })
    expect(service.getDashboardStats).toHaveBeenCalled()
  })

  it("getReports delegates to the service", async () => {
    await expect(controller.getReports()).resolves.toEqual({
      totalAppointments: 5,
    })
    expect(service.getReports).toHaveBeenCalled()
  })

  it("listUsers passes pagination through", async () => {
    await controller.listUsers({ limit: 10, offset: 5 } as never)
    expect(service.listUsers).toHaveBeenCalledWith(10, 5)
  })

  it("listUsers defaults pagination when omitted", async () => {
    await controller.listUsers({} as never)
    expect(service.listUsers).toHaveBeenCalledWith(undefined, undefined)
  })

  it("getUser delegates with the param id", async () => {
    await expect(controller.getUser("u1")).resolves.toEqual({ id: "u1" })
    expect(service.getUser).toHaveBeenCalledWith("u1")
  })

  it("updateUser passes session identity through", async () => {
    await controller.updateUser(session as never, "u1", {
      name: "New",
    } as never)
    expect(service.updateUser).toHaveBeenCalledWith("u1", "admin-1", "ADMIN", {
      name: "New",
    })
  })

  it("banUser converts expiresAt to a Date and passes the reason", async () => {
    await controller.banUser(session as never, "u1", {
      reason: "spam",
      expiresAt: "2026-12-31T00:00:00Z",
    } as never)
    expect(service.banUser).toHaveBeenCalledWith("admin-1", "u1", {
      reason: "spam",
      expiresAt: new Date("2026-12-31T00:00:00Z"),
    })
  })

  it("banUser leaves expiresAt undefined when absent", async () => {
    await controller.banUser(session as never, "u1", {
      reason: "spam",
    } as never)
    expect(service.banUser).toHaveBeenCalledWith("admin-1", "u1", {
      reason: "spam",
      expiresAt: undefined,
    })
  })

  it("unbanUser delegates with the admin id", async () => {
    await controller.unbanUser(session as never, "u1")
    expect(service.unbanUser).toHaveBeenCalledWith("admin-1", "u1")
  })

  it("setRole delegates with the target role", async () => {
    const result = await controller.setRole(session as never, "u1", {
      role: "DOCTOR",
    } as never)
    expect(result).toEqual({ id: "u1", role: "DOCTOR" })
    expect(service.setRole).toHaveBeenCalledWith("admin-1", "u1", "DOCTOR")
  })

  it("listAllDoctors passes pagination through", async () => {
    await controller.listAllDoctors({ limit: 25, offset: 0 } as never)
    expect(service.listAllDoctors).toHaveBeenCalledWith(25, 0)
  })

  it("approveDoctor delegates with the admin id", async () => {
    await controller.approveDoctor(session as never, "doc-1")
    expect(service.approveDoctor).toHaveBeenCalledWith("doc-1", "admin-1")
  })

  it("rejectDoctor passes the reason through", async () => {
    await controller.rejectDoctor(session as never, "doc-1", {
      reason: "Incomplete PRC license",
    } as never)
    expect(service.rejectDoctor).toHaveBeenCalledWith(
      "doc-1",
      "admin-1",
      "Incomplete PRC license",
    )
  })

  it("verifyDoctor delegates with the admin id", async () => {
    await controller.verifyDoctor(session as never, "doc-1")
    expect(service.verifyDoctor).toHaveBeenCalledWith("doc-1", "admin-1")
  })

  it("unverifyDoctor delegates with the admin id", async () => {
    await controller.unverifyDoctor(session as never, "doc-1")
    expect(service.unverifyDoctor).toHaveBeenCalledWith("doc-1", "admin-1")
  })
})
