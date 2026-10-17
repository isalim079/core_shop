import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { Environment } from '../config/environment';
import { DomainError } from '../common/errors/domain-error';
import { AuthStore, AuthTx } from './auth-store.service';
import { ACCESS_MS, ClientKind, digest, equalHash, opaque, SESSION_MS, validToken } from './auth-primitives';

export interface SessionTokens { accessToken: string; refreshToken: string; csrfToken: string; sessionId: string; accessExpiresAt: Date; expiresAt: Date }
@Injectable()
export class Sessions {
  constructor(private readonly store: AuthStore, private readonly config: ConfigService<Environment, true>) {}
  cookieName(kind: 'access' | 'refresh') {
    const prefix = this.config.get('NODE_ENV', { infer: true }) === 'production' ? (kind === 'access' ? '__Host-' : '__Secure-') : '';
    return `${prefix}core_${kind}`;
  }
  assertOrigin(request: FastifyRequest) {
    const origin = request.headers.origin;
    const origins = this.config.get('CORS_ORIGINS', { infer: true });
    if (!origin || !origins.includes(origin)) throw new DomainError('FORBIDDEN', 403);
  }
  transport(request: FastifyRequest, client: string): ClientKind {
    if (client === 'web') { this.assertOrigin(request); return 'WEB'; }
    if (client !== 'mobile') throw new DomainError('NOT_FOUND', 404);
    if (request.headers.origin) throw new DomainError('FORBIDDEN', 403);
    return 'MOBILE';
  }
  private tokens(sessionId: string, expiresAt: Date): SessionTokens {
    return { accessToken: opaque(), refreshToken: opaque(), csrfToken: opaque(), sessionId,
      accessExpiresAt: new Date(Math.min(Date.now() + ACCESS_MS, expiresAt.getTime())), expiresAt };
  }
  async create(tx: AuthTx, userId: string, clientKind: ClientKind, deviceName: string, requestId: string) {
    // Caller holds the user lock, also used by password reset/revoke/refresh.
    const { randomUUID } = await import('node:crypto');
    const tokens = this.tokens(randomUUID(), new Date(Date.now() + SESSION_MS));
    // Bound sessions per account, revoking the oldest under the same user lock.
    const old = await tx.authSession.findMany({ where: { userId, revokedAt: null }, orderBy: { createdAt: 'desc' }, skip: 19, select: { id: true } });
    if (old.length) await tx.authSession.updateMany({ where: { id: { in: old.map((s) => s.id) } }, data: { revokedAt: new Date() } });
    await tx.authSession.create({ data: { id: tokens.sessionId, userId, clientKind, deviceName,
      accessHash: digest(tokens.accessToken), accessExpiresAt: tokens.accessExpiresAt, expiresAt: tokens.expiresAt, csrfHash: digest(tokens.csrfToken),
      refreshTokens: { create: { tokenHash: digest(tokens.refreshToken) } } } });
    await this.store.audit(tx, requestId, 'AUTH_LOGIN_SUCCEEDED', userId, tokens.sessionId);
    return tokens;
  }
  async verify(request: FastifyRequest) {
    const bearer = request.headers.authorization;
    const cookie = request.cookies?.[this.cookieName('access')];
    if (bearer && cookie) return null;
    const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : cookie;
    if (!validToken(token)) return null;
    // Absent DB still denies authentication without exposing readiness details.
    let session;
    try { session = await this.store.db.authSession.findUnique({ where: { accessHash: digest(token) }, include: { user: true } }); }
    catch { return null; }
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.accessExpiresAt <= new Date() || session.user.status !== 'ACTIVE' || session.user.deletedAt) return null;
    if (cookie) {
      if (session.clientKind !== 'WEB') return null;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        this.assertOrigin(request);
        const csrf = request.headers['x-csrf-token'];
        if (!validToken(csrf) || !equalHash(digest(csrf), session.csrfHash)) throw new DomainError('FORBIDDEN', 403);
      }
    } else if (session.clientKind !== 'MOBILE') return null;
    return { userId: session.userId, credentialId: session.id };
  }
  async csrf(request: FastifyRequest) {
    this.assertOrigin(request);
    await this.store.limit('csrf', request.ip);
    const token = request.cookies[this.cookieName('refresh')];
    if (!validToken(token)) throw new DomainError('UNAUTHENTICATED', 401);
    const record = await this.store.db.authRefreshToken.findUnique({ where: { tokenHash: digest(token) }, include: { session: true } });
    if (!record) throw new DomainError('UNAUTHENTICATED', 401);
    const csrfToken = opaque();
    await this.store.db.$transaction(async (tx) => {
      const user = await this.store.lockUser(tx, record.session.userId);
      const session = await tx.authSession.findUnique({ where: { id: record.sessionId } });
      const current = await tx.authRefreshToken.findUnique({ where: { id: record.id } });
      if (!user || !session || !current || current.usedAt || session.revokedAt || session.clientKind !== 'WEB' || session.expiresAt <= new Date()) throw new DomainError('UNAUTHENTICATED', 401);
      await tx.authSession.update({ where: { id: session.id }, data: { csrfHash: digest(csrfToken) } });
    });
    return { csrfToken };
  }
  async refresh(token: string, kind: ClientKind, csrf: unknown, ip: string, requestId: string) {
    await this.store.limit('refresh', ip);
    if (!validToken(token)) throw new DomainError('UNAUTHENTICATED', 401);
    const record = await this.store.db.authRefreshToken.findUnique({ where: { tokenHash: digest(token) }, include: { session: true } });
    if (!record) throw new DomainError('UNAUTHENTICATED', 401);
    const result = await this.store.db.$transaction(async (tx) => {
      const user = await this.store.lockUser(tx, record.session.userId);
      const session = await tx.authSession.findUnique({ where: { id: record.sessionId } });
      const current = await tx.authRefreshToken.findUnique({ where: { id: record.id } });
      if (!user || !session || !current || session.revokedAt || session.expiresAt <= new Date() || session.clientKind !== kind) return null;
      // Reused token revokes the family even when its old CSRF token was rotated.
      if (current.usedAt) {
        await tx.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        await this.store.audit(tx, requestId, 'AUTH_REFRESH_REPLAY', user.id, session.id);
        return null;
      }
      if (kind === 'WEB' && (!validToken(csrf) || !equalHash(digest(csrf), session.csrfHash))) return null;
      const tokens = this.tokens(session.id, session.expiresAt);
      await tx.authRefreshToken.update({ where: { id: current.id }, data: { usedAt: new Date() } });
      await tx.authRefreshToken.create({ data: { sessionId: session.id, tokenHash: digest(tokens.refreshToken) } });
      await tx.authSession.update({ where: { id: session.id }, data: { accessHash: digest(tokens.accessToken), accessExpiresAt: tokens.accessExpiresAt, csrfHash: digest(tokens.csrfToken) } });
      await this.store.audit(tx, requestId, 'AUTH_SESSION_REFRESHED', user.id, session.id);
      return tokens;
    });
    if (!result) throw new DomainError('UNAUTHENTICATED', 401);
    return result;
  }
  async revoke(userId: string, requestId: string, sessionId?: string) {
    await this.store.db.$transaction(async (tx) => {
      if (!await this.store.lockUser(tx, userId)) throw new DomainError('UNAUTHENTICATED', 401);
      await tx.authSession.updateMany({ where: { userId, ...(sessionId ? { id: sessionId } : {}), revokedAt: null }, data: { revokedAt: new Date() } });
      await this.store.audit(tx, requestId, 'AUTH_SESSION_REVOKED', userId, sessionId);
    });
  }
}
