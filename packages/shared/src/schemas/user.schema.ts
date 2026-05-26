import { z } from "zod"

export const roleSchema = z.enum(["PATIENT", "DOCTOR", "ADMIN"])

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  mobile: z.string().nullable(),
  mobileVerified: z.boolean(),
  preferredLang: z.enum(["FILIPINO", "ENGLISH"]),
  image: z.string().url().nullable(),
  role: roleSchema,
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const publicUserSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  createdAt: true,
})

export const patientProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dob: z.coerce.date().nullable(),
  sex: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  philhealthNumber: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

const doctorProfileBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  specialty: z.string(),
  prcLicenseNumber: z.string(),
  prcLicenseExpiry: z.coerce.date(),
  philhealthAccreditation: z.string().nullable(),
  pdeaS2License: z.string().nullable(),
  pdeaS2Expiry: z.coerce.date().nullable(),
  bio: z.string().nullable(),
  clinicAddress: z.string().nullable(),
  pricePerVisit: z.number(),
  isApproved: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const doctorProfileSchema = doctorProfileBaseSchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    image: z.string().url().nullable(),
  }),
})
