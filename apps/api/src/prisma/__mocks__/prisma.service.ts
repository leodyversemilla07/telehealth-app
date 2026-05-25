/**
 * Auto-mock for PrismaService — prevents Jest from resolving
 * the real PrismaService (which imports ESM packages).
 */

import { Injectable } from "@nestjs/common"

@Injectable()
export class PrismaService {
  $queryRaw = jest.fn().mockResolvedValue([{ "1": 1 }])
}
