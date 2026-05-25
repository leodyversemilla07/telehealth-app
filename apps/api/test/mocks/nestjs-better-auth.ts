/**
 * Mock for @thallesp/nestjs-better-auth
 * The real package uses ESM (.mjs) which Jest can't parse in CJS mode.
 * This mock provides decorators used in controllers.
 */

export const AllowAnonymous = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (
    _target: unknown,
    _propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) => {
    // no-op: metadata irrelevant in tests
  }
}
