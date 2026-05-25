export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type VisitType = "VIDEO" | "PHONE" | "IN_PERSON"

export interface AvailabilitySlotDto {
  id: string
  providerId: string
  dayOfWeek: number
  startTime: string // HH:mm
  endTime: string // HH:mm
  slotDuration: number
  isActive: boolean
}

export interface TimeOffDto {
  id: string
  providerId: string
  date: string
  startTime: string
  endTime: string
  reason: string | null
}

export interface TimeSlot {
  startTime: string // HH:mm
  endTime: string // HH:mm
}

export interface AppointmentDto {
  id: string
  patientId: string
  providerId: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  reason: string | null
  symptoms: string | null
  language: string | null
  type: VisitType
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  provider?: {
    id: string
    specialty: string
    pricePerVisit: number
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }
}
