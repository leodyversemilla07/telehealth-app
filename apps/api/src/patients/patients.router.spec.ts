import { toPatientProfileDto } from "./patients.router"
import type { PatientProfileRow } from "./patients.service"

/** A raw patient profile row as returned by the service (Prisma shape). */
function row(overrides: Partial<PatientProfileRow> = {}): PatientProfileRow {
  return {
    id: "profile-1",
    userId: "user-1",
    dob: new Date("1990-05-15T00:00:00.000Z"),
    sex: "female",
    phone: "+639171234567",
    address: "Makati",
    philhealthNumber: "PH-123",
    weight: 62,
    height: 165,
    medicalHistory: { allergies: ["penicillin"] },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    user: {
      id: "user-1",
      name: "Ana",
      firstName: "Ana",
      middleName: null,
      lastName: "Santos",
      email: "ana@x.com",
      image: null,
    },
    ...overrides,
  } as unknown as PatientProfileRow
}

describe("toPatientProfileDto", () => {
  it("maps every profile field onto the DTO contract", () => {
    expect(toPatientProfileDto(row())).toEqual({
      id: "profile-1",
      userId: "user-1",
      dob: new Date("1990-05-15T00:00:00.000Z"),
      sex: "female",
      phone: "+639171234567",
      address: "Makati",
      philhealthNumber: "PH-123",
      weight: 62,
      height: 165,
      medicalHistory: { allergies: ["penicillin"] },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      user: {
        id: "user-1",
        name: "Ana",
        firstName: "Ana",
        middleName: null,
        lastName: "Santos",
        email: "ana@x.com",
        image: null,
      },
    })
  })

  it("fills unselected user name parts with null instead of dropping them", () => {
    const sparse = row()
    sparse.user = { ...sparse.user, firstName: null, lastName: null }
    const dto = toPatientProfileDto(sparse)
    expect(dto.user.firstName).toBeNull()
    expect(dto.user.lastName).toBeNull()
    expect(dto.user.email).toBe("ana@x.com")
  })

  it("keeps a null medicalHistory and dob as null", () => {
    const dto = toPatientProfileDto(
      row({
        dob: null,
        medicalHistory: null,
      }),
    )
    expect(dto.dob).toBeNull()
    expect(dto.medicalHistory).toBeNull()
  })
})
