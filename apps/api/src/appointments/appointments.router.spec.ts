import type { AppointmentRow } from "./appointments.router"
import { toAppointmentDto, toPagedAppointments } from "./appointments.router"

/** A Decimal-shaped value (Prisma's decimal.js-light) that String()s to "750". */
const decimal750 = { toString: () => "750" }

/** Minimal but structurally complete appointment row (Prisma shape). */
function row(overrides: Partial<AppointmentRow> = {}): AppointmentRow {
  return {
    id: "apt-1",
    patientId: "patient-1",
    doctorId: "doctor-1",
    scheduleId: "sched-1",
    startTime: new Date("2026-06-01T00:30:00.000Z"),
    endTime: new Date("2026-06-01T01:00:00.000Z"),
    status: "BOOKED",
    reason: "Fever",
    symptoms: "Cough",
    type: "VIDEO",
    roomUrl: null,
    notes: null,
    callMetadata: null,
    createdAt: new Date("2026-05-30T08:00:00.000Z"),
    updatedAt: new Date("2026-05-30T08:00:00.000Z"),
    patient: { id: "patient-1", name: "Ana", email: "ana@x.com" },
    doctor: {
      id: "doctor-1",
      specialty: "Cardiology",
      // Raw Prisma rows carry Decimal here; a plain number is also accepted.
      pricePerVisit: decimal750 as AppointmentRow["doctor"]["pricePerVisit"],
      clinicAddress: "Makati",
      user: { id: "doc-user-1", name: "Dr. Cruz", email: "cruz@x.com" },
    },
    ...overrides,
  } as unknown as AppointmentRow
}

describe("toAppointmentDto", () => {
  it("normalizes a Decimal pricePerVisit to a plain number", () => {
    expect(toAppointmentDto(row()).doctor.pricePerVisit).toBe(750)
    const nullPrice = row({
      doctor: { ...row().doctor, pricePerVisit: null as never },
    })
    expect(toAppointmentDto(nullPrice).doctor.pricePerVisit).toBeNull()
  })

  it("keeps the DTO subset — no patient image leaks from the raw row", () => {
    const withImage = row()
    withImage.patient = { ...withImage.patient, image: "avatar-x.jpg" } as never
    const dto = toAppointmentDto(withImage)
    expect("image" in dto.patient).toBe(false)
    expect(dto.patient.email).toBe("ana@x.com")
  })

  it("passes callMetadata through when present", () => {
    const callMetadata = {
      endedAt: "2026-06-01T01:10:00.000Z",
      duration: 40,
      roomName: "appointment-apt-1",
      participants: ["patient-1", "doc-user-1"],
    }
    const dto = toAppointmentDto(row({ callMetadata: callMetadata as never }))
    expect(dto.callMetadata).toEqual(callMetadata)
  })

  it("maps every appointment field onto the DTO contract", () => {
    expect(toAppointmentDto(row())).toEqual({
      id: "apt-1",
      patientId: "patient-1",
      doctorId: "doctor-1",
      scheduleId: "sched-1",
      startTime: new Date("2026-06-01T00:30:00.000Z"),
      endTime: new Date("2026-06-01T01:00:00.000Z"),
      status: "BOOKED",
      reason: "Fever",
      symptoms: "Cough",
      type: "VIDEO",
      roomUrl: null,
      notes: null,
      callMetadata: null,
      createdAt: new Date("2026-05-30T08:00:00.000Z"),
      updatedAt: new Date("2026-05-30T08:00:00.000Z"),
      patient: { id: "patient-1", name: "Ana", email: "ana@x.com" },
      doctor: {
        id: "doctor-1",
        specialty: "Cardiology",
        pricePerVisit: 750,
        clinicAddress: "Makati",
        user: { id: "doc-user-1", name: "Dr. Cruz", email: "cruz@x.com" },
      },
    })
  })
})

describe("toPagedAppointments", () => {
  it("maps every row and preserves the pagination envelope", () => {
    const result = toPagedAppointments({
      items: [row(), row({ id: "apt-2" } as Partial<AppointmentRow>)],
      total: 2,
      limit: 10,
      offset: 0,
    })
    expect(result.items).toHaveLength(2)
    expect(result.items[1].id).toBe("apt-2")
    expect(result.total).toBe(2)
    expect(result.limit).toBe(10)
    expect(result.offset).toBe(0)
  })
})
