const DATE_TAG = "$telehealth.date"

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function serializeDates(value: unknown): unknown {
  if (value instanceof Date) {
    return { [DATE_TAG]: value.toISOString() }
  }
  if (Array.isArray(value)) {
    return value.map(serializeDates)
  }
  if (value !== null && typeof value === "object" && isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeDates(item)]),
    )
  }
  return value
}

function deserializeDates(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeDates)
  }
  if (value !== null && typeof value === "object" && isPlainObject(value)) {
    const object = value as Record<string, unknown>
    if (
      Object.keys(object).length === 1 &&
      typeof object[DATE_TAG] === "string"
    ) {
      return new Date(object[DATE_TAG])
    }
    return Object.fromEntries(
      Object.entries(object).map(([key, item]) => [
        key,
        deserializeDates(item),
      ]),
    )
  }
  return value
}

/**
 * Minimal tRPC transformer that preserves Date values across JSON transport.
 * Non-plain objects are left untouched so their own JSON serialization (for
 * example Prisma Decimal) continues to work normally.
 */
export const dateTransformer = {
  serialize: serializeDates,
  deserialize: deserializeDates,
}
