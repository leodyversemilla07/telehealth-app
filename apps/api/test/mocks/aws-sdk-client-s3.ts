/**
 * Jest mock for @aws-sdk/client-s3 (moduleNameMapper target in jest config).
 *
 * S3Storage dynamically imports the real SDK; jest cannot load the real ESM
 * graph inside its vm, so tests redirect to this lightweight double. The
 * command classes hold their `input` and S3Client captures the constructor
 * config on `this.cfg` for assertions.
 */

export class S3Client {
  cfg: unknown

  constructor(cfg: unknown) {
    this.cfg = cfg
  }

  // @ts-expect-error – jest mocks/overrides this in specs
  async send(_command: unknown): Promise<unknown> {
    return {}
  }
}

export class PutObjectCommand {
  input: Record<string, unknown>

  constructor(input: Record<string, unknown>) {
    this.input = input
  }
}

export class DeleteObjectCommand {
  input: Record<string, unknown>

  constructor(input: Record<string, unknown>) {
    this.input = input
  }
}

export class HeadObjectCommand {
  input: Record<string, unknown>

  constructor(input: Record<string, unknown>) {
    this.input = input
  }
}

export class GetObjectCommand {
  input: Record<string, unknown>

  constructor(input: Record<string, unknown>) {
    this.input = input
  }
}
