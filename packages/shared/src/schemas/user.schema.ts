import { z } from "zod"

export const roleSchema = z.enum(["USER", "ADMIN"])

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean(),
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
