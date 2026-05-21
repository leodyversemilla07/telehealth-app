import type { z } from "zod"
import type { signInSchema, signUpSchema } from "../schemas/auth.schema.js"

export type SignInDto = z.infer<typeof signInSchema>
export type SignUpDto = z.infer<typeof signUpSchema>
