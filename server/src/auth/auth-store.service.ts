import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DomainError } from '../common/errors/domain-error';
import { Prisma } from '../generated/prisma/client';
import { AuthSecrets } from './auth-primitives';

export type AuthTx = Prisma.TransactionClient;
@Injectable()
export class AuthStore {
  constructor(private readonly database: DatabaseService, private readonly secrets: AuthSecrets) {}
  get db() {
    if (!this.database.client) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    return this.database.client;
  }
  async limit(operation: string, ip: string, account?: string) {
    // Committed outside the auth transaction: failures cannot roll the counters back.
    for (const [kind, value, maximum] of [['ip', ip, 30], ...(account ? [['account', account, 8]] : [])] as Array<[string, string, number]>) {
      const key = this.secrets.hmac(`limit:${operation}:${kind}:${value}`);
      const rows = await this.db.$queryRaw<Array<{ hits: number }>>`
        INSERT INTO auth_rate_buckets (key, hits, "expiresAt") VALUES (${key}, 1, now() + interval '15 minutes')
        ON CONFLICT (key) DO UPDATE SET hits = CASE WHEN auth_rate_buckets."expiresAt" <= now() THEN 1 ELSE LEAST(auth_rate_buckets.hits + 1, 100000) END,
          "expiresAt" = CASE WHEN auth_rate_buckets."expiresAt" <= now() THEN now() + interval '15 minutes' ELSE auth_rate_buckets."expiresAt" END RETURNING hits`;
      if (rows[0].hits > maximum) throw new DomainError('RATE_LIMITED', 429);
    }
  }
  audit(tx: AuthTx, requestId: string, action: string, actorId?: string, entityId?: string) {
    return tx.auditEvent.create({ data: { requestId, action, actorId, entityType: 'AUTHENTICATION', entityId, metadata: {} } });
  }
  async requireSession(tx: AuthTx, userId: string, sessionId: string, recent = false) {
    const session = await tx.authSession.findUnique({ where: { id: sessionId } });
    const now = new Date();
    if (!session || session.userId !== userId || session.revokedAt || session.expiresAt <= now || session.accessExpiresAt <= now ||
      (recent && session.createdAt.getTime() < now.getTime() - 10 * 60_000)) throw new DomainError('UNAUTHENTICATED', 401);
  }
  async lockUser(tx: AuthTx, id: string) {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id } });
    if (!user || user.status !== 'ACTIVE' || user.deletedAt) return null;
    return user;
  }
}
