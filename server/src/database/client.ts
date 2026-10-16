import { PrismaPg } from '@prisma/adapter-pg';
import { Environment } from '../config/environment';
import { PrismaClient } from '../generated/prisma/client';

export function createDatabaseClient(config: Pick<Environment,
  'DATABASE_URL' | 'DATABASE_POOL_MAX' | 'DATABASE_CONNECT_TIMEOUT_MS' | 'DATABASE_QUERY_TIMEOUT_MS'>) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.DATABASE_URL,
      max: config.DATABASE_POOL_MAX,
      connectionTimeoutMillis: config.DATABASE_CONNECT_TIMEOUT_MS,
      statement_timeout: config.DATABASE_QUERY_TIMEOUT_MS,
      idleTimeoutMillis: 30_000,
      application_name: 'core-shop-server',
    }),
    // Driver errors and SQL parameters must not be sent to the logger.
    log: [],
    errorFormat: 'minimal',
  });
}
