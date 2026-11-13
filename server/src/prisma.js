import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton with Connection Pool Limiting for Low Memory & Serverless
 *
 * For VPS with low RAM (e.g. 512MB-1GB) or serverless environments (Vercel),
 * we recommend appending `?connection_limit=5` to DATABASE_URL to prevent
 * excessive PostgreSQL client connections and high memory footprint.
 */
function getDatasourceUrl() {
  const originalUrl = process.env.DATABASE_URL;
  if (!originalUrl) return undefined;

  // Append connection_limit=5 if not explicitly configured in connection string
  if (!originalUrl.includes('connection_limit=')) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}connection_limit=5`;
  }
  return originalUrl;
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
