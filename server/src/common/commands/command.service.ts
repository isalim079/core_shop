import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';
import { AuditService } from '../../audit/audit.service';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '../../generated/prisma/client';
import { DomainError } from '../errors/domain-error';
import { TenantAuthorization, TenantScope } from '../guards/tenant-authorization';
import { canonicalPayload, payloadHash } from './canonical-payload';

export interface CommandResult { statusCode: number; body: Prisma.InputJsonObject }
interface CommandInput { operation: string; key: string; payload: unknown; requestId: string }

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function transactionFailure(error: unknown) {
  const data = record(error);
  const meta = record(data.meta);
  const cause = record(record(meta.driverAdapterError).cause);
  const sqlState = [meta.code, cause.originalCode, cause.code].find((value) => typeof value === 'string' && /^[0-9A-Z]{5}$/.test(value));
  return {
    retryable: data.code === 'P2034' || cause.kind === 'TransactionWriteConflict' || sqlState === '40001' || sqlState === '40P01',
    timedOut: sqlState === '55P03' || sqlState === '57014',
  };
}

@Injectable()
export class CommandService {
  constructor(private readonly database: DatabaseService, private readonly authorization: TenantAuthorization, private readonly audit: AuditService) {}

  async execute(scope: TenantScope, input: CommandInput,
    handler: (tx: Prisma.TransactionClient, current: TenantScope, commandId: string) => Promise<CommandResult>): Promise<CommandResult & { replayed: boolean }> {
    this.authorization.assertIssued(scope);
    if (!scope.requiredPermissions.length) throw new DomainError('FORBIDDEN', 403);
    z.uuid().parse(input.requestId);
    z.string().regex(/^[A-Z][A-Z0-9_:.-]{0,159}$/i).parse(input.operation);
    const key = z.uuid().parse(input.key).toLowerCase();
    const hash = payloadHash({ version: 1, organizationId: scope.organizationId, actorId: scope.actorId,
      branchId: scope.branchId || null, operation: input.operation, payload: input.payload });
    const client = this.database.client;
    if (!client) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await client.$transaction(async (tx) => {
          const current = await this.authorization.revalidate(scope, tx);
          const commandId = randomUUID();
          const inserted = await tx.$queryRaw<Array<{ id: string }>>`
            INSERT INTO command_records (id,"organizationId","actorId",operation,key,"payloadHash","requestId")
            VALUES (${commandId}::uuid,${current.organizationId}::uuid,${current.actorId}::uuid,${input.operation},${key},${hash},${input.requestId}::uuid)
            ON CONFLICT ("organizationId","actorId",operation,key) DO NOTHING RETURNING id`;
          if (!inserted.length) {
            const existing = await tx.commandRecord.findUniqueOrThrow({ where: { organizationId_actorId_operation_key: {
              organizationId: current.organizationId, actorId: current.actorId, operation: input.operation, key,
            } } });
            if (existing.payloadHash !== hash) throw new DomainError('IDEMPOTENCY_PAYLOAD_MISMATCH', 409);
            if (existing.status !== 'COMPLETED' || existing.responseStatus === null || existing.result === null) throw new DomainError('COMMAND_RETRY_REQUIRED', 409);
            return { statusCode: existing.responseStatus, body: existing.result as Prisma.InputJsonObject, replayed: true };
          }
          // Handler must contain DB effects only. External delivery belongs to the outbox worker.
          const result = await handler(tx, current, commandId);
          if (!Number.isInteger(result.statusCode) || result.statusCode < 200 || result.statusCode > 299) throw new Error('Invalid command result');
          canonicalPayload(result.body);
          await this.audit.append(tx, current, { requestId: input.requestId, action: 'COMMAND_COMMITTED', entityType: 'COMMAND', entityId: commandId });
          await tx.commandRecord.update({ where: { id: commandId }, data: {
            status: 'COMPLETED', result: result.body, responseStatus: result.statusCode, completedAt: new Date(),
          } });
          return { ...result, replayed: false };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 3000, timeout: 10_000 });
      } catch (error) {
        const failure = transactionFailure(error);
        if (failure.timedOut) throw new DomainError('COMMAND_RETRY_REQUIRED', 409);
        if (!failure.retryable) throw error;
        if (attempt === 2) throw new DomainError('COMMAND_RETRY_REQUIRED', 409);
        await setTimeout(20 * (attempt + 1) + Math.floor(Math.random() * 20));
      }
    }
    throw new DomainError('COMMAND_RETRY_REQUIRED', 409);
  }

  async enqueue(tx: Prisma.TransactionClient, scope: TenantScope, commandId: string, eventType: string,
    payload: { entityId: string; documentLocale?: 'en' | 'bn' | 'en-bn' }) {
    this.authorization.assertIssued(scope);
    const data = z.object({ entityId: z.uuid(), documentLocale: z.enum(['en', 'bn', 'en-bn']).optional() }).strict().parse(payload);
    z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/).parse(eventType);
    return tx.outboxEvent.create({ data: { organizationId: scope.organizationId, commandId, eventType, payload: data } });
  }
}
