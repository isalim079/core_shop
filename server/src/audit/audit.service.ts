import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Prisma } from '../generated/prisma/client';
import { TenantScope } from '../common/guards/tenant-authorization';

const evidenceSchema = z.object({
  reasonCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/).optional(),
  changedFields: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,59}$/)).max(30).optional(),
  commandId: z.uuid().optional(),
}).strict();

@Injectable()
export class AuditService {
  async append(tx: Prisma.TransactionClient, scope: TenantScope, event: {
    requestId: string; action: string; entityType: string; entityId?: string;
    metadata?: z.infer<typeof evidenceSchema>;
  }) {
    z.uuid().parse(event.requestId);
    z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/).parse(event.action);
    z.string().regex(/^[A-Z][A-Z0-9_]{0,59}$/).parse(event.entityType);
    if (event.entityId) z.uuid().parse(event.entityId);
    const metadata = evidenceSchema.parse(event.metadata || {});
    return tx.auditEvent.create({ data: {
      organizationId: scope.organizationId, branchId: scope.branchId, actorId: scope.actorId,
      requestId: event.requestId, action: event.action, entityType: event.entityType,
      entityId: event.entityId, metadata,
    } });
  }
}
