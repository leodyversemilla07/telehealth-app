import {
  appointmentSchema,
  availableSlotSchema,
  createAppointmentSchema,
} from "@workspace/shared"
import { describe, expect, it } from "vitest"

describe("Shared Schemas — Appointment", () => {
  describe("createAppointmentSchema", () => {
    it("should validate a valid appointment creation", () => {
      const valid = {
        doctorId: "doc-123",
        scheduleId: "sched-1",
        startTime: "2026-05-30T09:00:00.000Z",
        endTime: "2026-05-30T09:30:00.000Z",
        type: "VIDEO",
        reason: "Headache",
        symptoms: "Throbbing pain, 3 days",
      }
      const result = createAppointmentSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it("should reject missing required fields (doctorId, scheduleId, startTime, endTime)", () => {
      const incomplete = {
        doctorId: "doc-123",
        // missing scheduleId, startTime, endTime
      }
      const result = createAppointmentSchema.safeParse(incomplete)
      expect(result.success).toBe(false)
    })

    it("should reject invalid visit type", () => {
      const invalid = {
        doctorId: "doc-123",
        scheduleId: "sched-1",
        startTime: "2026-05-30T09:00:00.000Z",
        endTime: "2026-05-30T09:30:00.000Z",
        type: "INVALID_TYPE",
      }
      const result = createAppointmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("should accept optional fields (type, reason, symptoms)", () => {
      const minimal = {
        doctorId: "doc-123",
        scheduleId: "sched-1",
        startTime: "2026-05-30T09:00:00.000Z",
        endTime: "2026-05-30T09:30:00.000Z",
      }
      const result = createAppointmentSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })
  })

  describe("availableSlotSchema", () => {
    it("should validate a valid slot", () => {
      const slot = {
        scheduleId: "sched-1",
        startTime: "2026-05-30T09:00:00",
        endTime: "2026-05-30T09:30:00",
        available: true,
      }
      const result = availableSlotSchema.safeParse(slot)
      expect(result.success).toBe(true)
    })

    it("should require scheduleId", () => {
      const slot = {
        startTime: "2026-05-30T09:00:00",
        endTime: "2026-05-30T09:30:00",
      }
      const result = availableSlotSchema.safeParse(slot)
      expect(result.success).toBe(false)
    })

    it("should accept slot without available field (optional)", () => {
      const slot = {
        scheduleId: "sched-1",
        startTime: "2026-05-30T09:00:00",
        endTime: "2026-05-30T09:30:00",
      }
      const result = availableSlotSchema.safeParse(slot)
      expect(result.success).toBe(true)
    })
  })

  describe("appointmentSchema", () => {
    const validAppointment = {
      id: "apt-1",
      doctorId: "doc-1",
      patientId: "pat-1",
      scheduleId: "sched-1",
      startTime: "2026-05-30T09:00:00.000Z",
      endTime: "2026-05-30T09:30:00.000Z",
      status: "BOOKED",
      type: "VIDEO",
      reason: null,
      symptoms: null,
      notes: null,
      roomUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: {
        id: "pat-1",
        name: "Juan Dela Cruz",
        email: "juan@example.com",
      },
      doctor: {
        id: "doc-1",
        specialty: "Cardiology",
        pricePerVisit: null,
        user: {
          id: "user-doc-1",
          name: "Dr. Maria Santos",
          email: "maria@example.com",
          image: null,
        },
      },
    }

    it("should validate a complete appointment object with nested relations", () => {
      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it("should accept roomUrl as nullable optional string", () => {
      const withRoom = {
        ...validAppointment,
        roomUrl: "https://livekit.example.com/room/abc",
        status: "CONFIRMED",
      }
      const result = appointmentSchema.safeParse(withRoom)
      expect(result.success).toBe(true)
    })

    it("should reject invalid status enum", () => {
      const invalid = {
        ...validAppointment,
        status: "PENDING",
      }
      const result = appointmentSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })
})
