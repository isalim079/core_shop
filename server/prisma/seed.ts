import { PERMISSIONS as permissions } from '../src/organizations/permissions';
import { loadToolEnvironment } from '../src/config/tool-environment';
import { createDatabaseClient } from '../src/database/client';



async function seed() {
  const config = loadToolEnvironment();
  const databaseUrl = config.MIGRATION_DATABASE_URL || config.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL or MIGRATION_DATABASE_URL is required.');
  const client = createDatabaseClient({ ...config, DATABASE_URL: databaseUrl });
  try {
    await client.$transaction(Object.entries(permissions).map(([code, description]) =>
      client.permission.upsert({ where: { code }, create: { code, description }, update: { description } })));
    console.log(`Seeded ${Object.keys(permissions).length} permission definitions. No users or credentials created.`);
  } finally {
    await client.$disconnect();
  }
}

void seed().catch(() => {
  console.error('Reference seed failed. Check database access and migration status.');
  process.exitCode = 1;
});
