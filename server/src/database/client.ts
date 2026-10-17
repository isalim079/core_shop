import { PrismaPg } from '@prisma/adapter-pg';
import { Environment } from '../config/environment';
import { PrismaClient } from '../generated/prisma/client';

export function createDatabaseClient(config: Pick<Environment,
  'DATABASE_URL' | 'DATABASE_POOL_MAX' | 'DATABASE_CONNECT_TIMEOUT_MS' | 'DATABASE_QUERY_TIMEOUT_MS'>) {
  // The pinned pg adapter serializes UTC wall time and expects UTC result text.
  // Pin the SESSION zone, independently of the server/OS/business timezone.
  const url = new URL(config.DATABASE_URL);
  const options = url.searchParams.get('options') ?? '';
  url.searchParams.set('options', `${options} -c timezone=UTC`.trim());
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url.href,
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
