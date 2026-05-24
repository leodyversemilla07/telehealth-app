import { SetMetadata } from "@nestjs/common"

/** Bypass global throttling for public endpoints */
export const IS_PUBLIC_KEY = "isPublic"
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
