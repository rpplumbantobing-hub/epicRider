import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// epicRider Phase 4: log level dikurangkan dari ['query'] menjadi ['error'].
// Alasan keamanan (REQ-023/REQ-092; API_ARCHITECTURE §10 "no tenant data leaks
// via queries, logs"): query logging menulis parameter query (berisi data user
// dan tenant) ke stdout. Hanya error yang dicatat; konteks tambahan via audit
// event terstruktur (`src/lib/audit/audit-service.ts`).
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
