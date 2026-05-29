import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common"
import { prisma } from "./prisma-client"

/**
 * NestJS wrapper around the shared PrismaClient singleton.
 *
 * Uses composition instead of inheritance to avoid creating a second
 * PrismaClient instance (and thus a second connection pool).
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** The shared PrismaClient instance — delegate all queries here. */
  readonly client = prisma

  async onModuleInit() {
    await this.client.$connect()
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }

  // Proxy all PrismaClient methods so existing service code works unchanged
  get user() {
    return this.client.user
  }
  get session() {
    return this.client.session
  }
  get account() {
    return this.client.account
  }
  get verification() {
    return this.client.verification
  }
  get patientProfile() {
    return this.client.patientProfile
  }
  get doctorProfile() {
    return this.client.doctorProfile
  }
  get availabilitySchedule() {
    return this.client.availabilitySchedule
  }
  get timeOff() {
    return this.client.timeOff
  }
  get appointment() {
    return this.client.appointment
  }
  get consultation() {
    return this.client.consultation
  }
  get prescription() {
    return this.client.prescription
  }
  get notification() {
    return this.client.notification
  }
  get consentLog() {
    return this.client.consentLog
  }
  get auditLog() {
    return this.client.auditLog
  }
  get securityAlert() {
    return this.client.securityAlert
  }
  get chatMessage() {
    return this.client.chatMessage
  }
  get review() {
    return this.client.review
  }

  // Proxy PrismaClient utility methods
  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client)
  }
  get $executeRaw() {
    return this.client.$executeRaw.bind(this.client)
  }
  get $transaction() {
    return this.client.$transaction.bind(this.client)
  }
}
