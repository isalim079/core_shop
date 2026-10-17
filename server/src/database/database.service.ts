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
      const [timezone] = await this.client.$queryRaw<Array<{ zone: string }>>`SELECT current_setting('TimeZone') AS zone`;
      if (timezone?.zone !== 'UTC') return false;
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
      await this.client.user.findFirst({ select: { id: true, status: true, preferredLanguage: true } });
      await this.client.organization.findFirst({ select: { id: true, currency: true, documentLanguage: true, address: true } });
      await this.client.storedFile.findFirst({ select: { id: true, purpose: true, status: true, finalObjectKey: true } });
      await this.client.commandRecord.findFirst({ select: { id: true, payloadHash: true } });
      await this.client.auditEvent.findFirst({ select: { id: true, requestId: true } });
      await this.client.outboxEvent.findFirst({ select: { id: true, status: true } });
      await this.client.authSession.findFirst({ select: { id: true, accessHash: true } });
      await this.client.authChallenge.findFirst({ select: { id: true, secretHash: true } });
      await this.client.googleIdentity.findFirst({ select: { id: true, subject: true } });
      await this.client.authRefreshToken.findFirst({ select: { id: true, usedAt: true } });
      await this.client.authRateBucket.findFirst({ select: { key: true, hits: true } });
      await this.client.membershipInvitation.findFirst({ select: { id: true, roleIds: true } });
      await this.client.organizationCreation.findFirst({ select: { organizationId: true, payloadHash: true } });
      await this.client.role.findFirst({ select: { id: true, archivedAt: true } });
      await this.client.branch.findFirst({ select: { id: true, address: true } });
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
