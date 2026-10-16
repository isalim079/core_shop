import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment';
import { createDatabaseClient } from './client';
import { REQUIRED_MIGRATIONS } from './schema-version';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly client: ReturnType<typeof createDatabaseClient> | null;

  constructor(config: ConfigService<Environment, true>) {
    const url = config.get('DATABASE_URL', { infer: true });
    this.client = url ? createDatabaseClient({
      DATABASE_URL: url,
      DATABASE_POOL_MAX: config.get('DATABASE_POOL_MAX', { infer: true }),
      DATABASE_CONNECT_TIMEOUT_MS: config.get('DATABASE_CONNECT_TIMEOUT_MS', { infer: true }),
      DATABASE_QUERY_TIMEOUT_MS: config.get('DATABASE_QUERY_TIMEOUT_MS', { infer: true }),
    }) : null;
  }

  async isReady(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const [role] = await this.client.$queryRaw<Array<{ safe: boolean }>>`
        SELECT NOT r.rolsuper AND NOT r.rolbypassrls AND NOT r.rolcreatedb AND NOT r.rolcreaterole
          AND NOT has_schema_privilege(current_user, 'public', 'CREATE')
          AND NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r' AND pg_has_role(current_user, c.relowner, 'MEMBER')
          ) AS safe FROM pg_roles r WHERE r.rolname = current_user`;
      if (!role?.safe) return false;
      const migrations = await this.client.$queryRaw<Array<{
        migration_name: string; finished_at: Date | null; rolled_back_at: Date | null;
      }>>`SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations ORDER BY migration_name`;
      const applied = migrations.filter((row) => row.rolled_back_at === null);
      if (applied.some((row) => row.finished_at === null)) return false;
      if (applied.map((row) => row.migration_name).join(',') !== REQUIRED_MIGRATIONS.join(',')) return false;
      // Probe actual columns so a migration record alone cannot mask missing tables.
      await this.client.user.findFirst({ select: { id: true, status: true } });
      await this.client.organization.findFirst({ select: { id: true, currency: true } });
      await this.client.storedFile.findFirst({ select: { id: true, purpose: true, status: true } });
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
