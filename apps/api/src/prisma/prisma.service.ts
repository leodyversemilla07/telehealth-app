import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common"
import { type PrismaClient, prisma } from "@telehealth/db"

/**
 * NestJS wrapper around the shared PrismaClient singleton.
 *
 * Uses composition instead of inheritance to avoid creating a second
 * PrismaClient instance (and thus a second connection pool).
 *
 * The constructor returns a Proxy: any property the class itself does not
 * define (`user`, `appointment`, `$transaction`, …) is forwarded to the
 * shared client at runtime, and the merged `PrismaService extends PrismaClient`
 * interface below supplies the compile-time types. Adding a model to the
 * schema therefore needs NO change in this file — previously every model
 * required a hand-written getter.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
@Injectable()
// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: deliberate — the interface supplies the PrismaClient types, the constructor Proxy supplies the runtime surface (avoids hand-writing a getter per model).
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** The shared PrismaClient instance — delegate all queries here. */
  readonly client = prisma

  constructor() {
    // biome-ignore lint/correctness/noConstructorReturn: deliberate — returning the forwarding Proxy IS the service instance.
    return new Proxy(this, {
      get(target, property, receiver) {
        // `client`, lifecycle hooks, and anything else declared on the class
        // resolve normally; everything else is the shared client's surface.
        if (property in target) {
          return Reflect.get(target, property, receiver)
        }
        const value = Reflect.get(target.client as object, property)
        // Client methods ($connect/$transaction/…) depend on `this`; model
        // delegates are plain objects and are returned as-is.
        return typeof value === "function" ? value.bind(target.client) : value
      },
    })
  }

  async onModuleInit() {
    await this.client.$connect()
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }
}

// Declaration merge: the class gets the full PrismaClient surface (model
// delegates + client utilities) for type-checking, while the Proxy above
// provides it at runtime. Biome's noEmptyInterface ignores interfaces that
// extend another type, so this is not flagged.
export interface PrismaService extends PrismaClient {}
