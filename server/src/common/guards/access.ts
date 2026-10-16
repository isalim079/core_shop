import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DomainError } from '../errors/domain-error';
import { TenantAuthorization, TenantScope } from './tenant-authorization';

const PUBLIC_ROUTE = 'access:public';
const PERMISSIONS = 'access:permissions';
const BRANCH_REQUIRED = 'access:branch';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const RequirePermissions = (...codes: string[]) => SetMetadata(PERMISSIONS, codes);
export const RequireBranch = () => SetMetadata(BRANCH_REQUIRED, true);

export interface Principal { readonly userId: string; readonly credentialId: string }

// Phase 4 supplies a verified implementation. Headers/body are never identities.
@Injectable()
export class IdentityVerifier {
  async verify(_request: FastifyRequest): Promise<Principal | null> { // eslint-disable-line @typescript-eslint/no-unused-vars
    return null;
  }
}

@Injectable()
export class RequestAccess {
  private readonly principals = new WeakMap<FastifyRequest, Principal>();
  private readonly tenants = new WeakMap<FastifyRequest, TenantScope>();
  setPrincipal(request: FastifyRequest, principal: Principal) { this.principals.set(request, Object.freeze({ ...principal })); }
  principal(request: FastifyRequest) { return this.principals.get(request); }
  setTenant(request: FastifyRequest, scope: TenantScope) { this.tenants.set(request, scope); }
  tenant(request: FastifyRequest) {
    const scope = this.tenants.get(request);
    if (!scope) throw new DomainError('FORBIDDEN', 403);
    return scope;
  }
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly verifier: IdentityVerifier, private readonly access: RequestAccess) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const principal = await this.verifier.verify(request);
    if (!principal || !z.uuid().safeParse(principal.userId).success) throw new DomainError('UNAUTHENTICATED', 401);
    this.access.setPrincipal(request, principal);
    return true;
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly access: RequestAccess, private readonly authorization: TenantAuthorization) {}
  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets)) return true;
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS, targets);
    const branchRequired = this.reflector.getAllAndOverride<boolean>(BRANCH_REQUIRED, targets);
    if (permissions === undefined && !branchRequired) return true;
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const principal = this.access.principal(request);
    if (!principal) throw new DomainError('UNAUTHENTICATED', 401);
    const organizationId = z.uuid().safeParse(request.headers['x-organization-id']);
    const branchId = request.headers['x-branch-id'];
    if (!organizationId.success || (branchId !== undefined && !z.uuid().safeParse(branchId).success) || (branchRequired && !branchId)) {
      throw new DomainError('BAD_REQUEST', 400);
    }
    const scope = await this.authorization.resolve(principal.userId, organizationId.data, branchId as string | undefined, permissions || []);
    this.access.setTenant(request, scope);
    return true;
  }
}
