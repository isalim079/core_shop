import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import { Environment } from '../config/environment';
import { DomainError } from '../common/errors/domain-error';

export const opaque = () => randomBytes(32).toString('base64url');
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const equalHash = (a: string, b: string) => /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
export const validToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const ACCESS_MS = 15 * 60_000;
export const SESSION_MS = 30 * 24 * 60 * 60_000;
export const CHALLENGE_MS = 10 * 60_000;
export type Channel = 'EMAIL' | 'PHONE';
export type ClientKind = 'WEB' | 'MOBILE';
export type Purpose = 'REGISTER' | 'RESET' | 'LINK';

export function contact(channel: Channel, value: string): string {
  const normalized = value.trim();
  if (channel === 'EMAIL') {
    const email = normalized.toLowerCase();
    if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) throw new DomainError('BAD_REQUEST', 400);
    return email;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new DomainError('BAD_REQUEST', 400);
  return normalized;
}

@Injectable()
export class AuthSecrets {
  private readonly secret: string;
  constructor(config: ConfigService<Environment, true>) {
    this.secret = config.get('AUTH_SECRET', { infer: true });
  }
  hmac(value: string) {
    if (!this.secret) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    return createHmac('sha256', this.secret).update(value).digest('hex');
  }
}

@Injectable()
export class Passwords {
  private running = 0;
  // Same work for unknown accounts; no real user's hash is used as the dummy.
  private dummy?: Promise<string>;
  validate(value: string) {
    if ([...value].length < 15 || [...value].length > 128 || Buffer.byteLength(value) > 512 || /\0/.test(value)) throw new DomainError('VALIDATION_FAILED', 400, [{ field: 'password', code: 'passwordLength' }]);
  }
  private async bounded<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= 4) throw new DomainError('RATE_LIMITED', 429);
    this.running++;
    try { return await fn(); } finally { this.running--; }
  }
  hash(value: string) {
    this.validate(value);
    return this.bounded(() => argon2.hash(value, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }));
  }
  async verify(hash: string | null, value: string) {
    if (!this.dummy) this.dummy = this.bounded(() => argon2.hash(opaque(), { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }));
    const candidate = hash || await this.dummy;
    return this.bounded(async () => {
      try { const matches = await argon2.verify(candidate, value); return Boolean(hash) && matches; } catch { return false; }
    });
  }
}
