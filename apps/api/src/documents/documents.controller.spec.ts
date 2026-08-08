import type { Response } from "express"
import { DocumentsController } from "./documents.controller"
import { DocumentsService } from "./documents.service"

describe("DocumentsController", () => {
  let controller: DocumentsController
  let service: {
    upload: jest.Mock
    listForAppointment: jest.Mock
    listForUser: jest.Mock
    getFile: jest.Mock
  }

  const session = {
    user: { id: "user-1", role: "PATIENT" },
    session: { id: "sess-1" },
  }

  beforeEach(() => {
    service = {
      upload: jest.fn().mockResolvedValue({ id: "doc-1" }),
      listForAppointment: jest.fn().mockResolvedValue([]),
      listForUser: jest.fn().mockResolvedValue([]),
      getFile: jest.fn().mockResolvedValue({
        data: Buffer.from("bytes"),
        contentType: "application/pdf",
        fileName: "result.pdf",
        sizeBytes: 5,
      }),
    }
    controller = new DocumentsController(service as unknown as DocumentsService)
  })

  it("upload delegates with file and dto", async () => {
    const file = { originalname: "x.pdf", size: 100 } as Express.Multer.File
    await controller.upload(session as never, file, {
      appointmentId: "apt-1",
    } as never)
    expect(service.upload).toHaveBeenCalledWith(
      "user-1",
      "PATIENT",
      { appointmentId: "apt-1" },
      file,
    )
  })

  it("listForAppointment delegates with the appointment id", async () => {
    await controller.listForAppointment(session as never, "apt-1")
    expect(service.listForAppointment).toHaveBeenCalledWith(
      "user-1",
      "PATIENT",
      "apt-1",
    )
  })

  it("listMine delegates for the signed-in user", async () => {
    await controller.listMine(session as never)
    expect(service.listForUser).toHaveBeenCalledWith("user-1", "PATIENT")
  })

  it("streamFile writes the document headers and bytes", async () => {
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response

    await controller.streamFile(session as never, "doc-1", res)

    expect(service.getFile).toHaveBeenCalledWith("user-1", "PATIENT", "doc-1")
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      "attachment; filename*=UTF-8''result.pdf",
    )
    expect(res.setHeader).toHaveBeenCalledWith("Content-Length", "5")
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store",
    )
    expect(res.send).toHaveBeenCalledWith(Buffer.from("bytes"))
  })

  it("streamFile URL-encodes unusual file names", async () => {
    service.getFile.mockResolvedValue({
      data: Buffer.from("x"),
      contentType: "application/octet-stream",
      fileName: "with space + plus.pdf",
      sizeBytes: 1,
    })
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response

    await controller.streamFile(session as never, "doc-2", res)

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      "attachment; filename*=UTF-8''with%20space%20%2B%20plus.pdf",
    )
  })
})
