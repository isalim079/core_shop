import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Environment } from '../config/environment';
import { DomainError } from '../common/errors/domain-error';

@Injectable()
export class GoogleTokens {
  private readonly client = new OAuth2Client({ transporterOptions: { timeout: 5000, retryConfig: { retry: 1 } } });
  private readonly audiences: string[];
  constructor(config: ConfigService<Environment, true>) {
    this.audiences = config.get('GOOGLE_CLIENT_IDS', { infer: true }).split(',').map((s) => s.trim()).filter(Boolean);
  }
  assertAvailable() { if (!this.audiences.length) throw new DomainError('SERVICE_UNAVAILABLE', 503); }
  async verify(idToken: string) {
    this.assertAvailable();
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.audiences });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true || typeof payload.nonce !== 'string') throw new Error();
      // Google is authoritative for Gmail/Workspace. Other addresses require our own contact proof.
      return { subject: payload.sub, email: payload.email, nonce: payload.nonce, authoritative: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd) };
    } catch { throw new DomainError('UNAUTHENTICATED', 401); }
  }
}
