import { defineConfig } from 'prisma/config';
import { loadToolEnvironment } from './src/config/tool-environment';

const config = loadToolEnvironment();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: config.MIGRATION_DATABASE_URL || config.DATABASE_URL || undefined,
  },
});
