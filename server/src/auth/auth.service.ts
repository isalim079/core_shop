import { Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { DomainError } from '../common/errors/domain-error';
import { AuthStore, AuthTx } from './auth-store.service';
import { AuthSecrets, Channel, CHALLENGE_MS, ClientKind, contact, digest, equalHash, opaque, Passwords, Purpose } from './auth-primitives';
import { VerificationDeliveryService } from './delivery.service';
import { Sessions } from './sessions.service';
import { GoogleTokens } from './google.service';

@Injectable()
export class Authentication {
  constructor(private readonly store: AuthStore, private readonly secrets: AuthSecrets, private readonly passwords: Passwords,
    private readonly delivery: VerificationDeliveryService, private readonly sessions: Sessions, private readonly google: GoogleTokens) {}

  async requestCode(channel: Channel, raw: string, purpose: Purpose, ip: string, requestId: string, userId?: string, sessionId?: string) {
    const destination = contact(channel, raw);
    await this.store.limit('verification', ip, `${channel}:${destination}`);
    this.delivery.assertAvailable(channel); // Fail uniformly, before account lookup.
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const id = randomUUID();
    const user = await this.store.db.user.findUnique({ where: channel === 'EMAIL' ? { email: destination } : { phone: destination } });
    const targetId = purpose === 'LINK' ? userId : user?.id;
    await this.store.db.$transaction(async (tx) => {
      if (purpose === 'LINK' && (!targetId || !await this.store.lockUser(tx, targetId))) throw new DomainError('UNAUTHENTICATED', 401);
      if (purpose === 'LINK') await this.store.requireSession(tx, targetId!, sessionId!, true);
      await tx.authChallenge.create({ data: { id, userId: targetId, channel, destination, purpose,
        secretHash: this.secrets.hmac(`code:${id}:${code}`), expiresAt: new Date(Date.now() + CHALLENGE_MS) } });
      await this.store.audit(tx, requestId, 'AUTH_VERIFICATION_REQUESTED');
    });
    try { await this.delivery.send({ channel, destination, code, purpose }); }
    catch {
      await this.store.db.authChallenge.update({ where: { id }, data: { consumedAt: new Date() } });
      throw new DomainError('SERVICE_UNAVAILABLE', 503);
    }
    // Same response and delivery path for existing/unknown contacts. No credentials are returned.
    return { accepted: true, challengeId: id, expiresIn: CHALLENGE_MS / 1000 };
  }

  private async consume(tx: AuthTx, id: string, secretHash: string, purpose: string, userId?: string) {
    await tx.$queryRaw`SELECT id FROM auth_challenges WHERE id = ${id}::uuid FOR UPDATE`;
    const challenge = await tx.authChallenge.findUnique({ where: { id } });
    if (!challenge || challenge.purpose !== purpose || (userId && challenge.userId !== userId) || challenge.consumedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return null;
    const valid = equalHash(challenge.secretHash, secretHash);
    await tx.authChallenge.update({ where: { id }, data: { attempts: challenge.attempts + 1, ...(valid || challenge.attempts === 4 ? { consumedAt: new Date() } : {}) } });
    return valid ? challenge : null;
  }

  async completeCode(input: { challengeId: string; code: string; password: string; displayName?: string; preferredLanguage?: 'en' | 'bn' }, purpose: 'REGISTER' | 'RESET', ip: string, requestId: string) {
    await this.store.limit('verify', ip, input.challengeId);
    const hash = await this.passwords.hash(input.password);
    const before = await this.store.db.authChallenge.findUnique({ where: { id: input.challengeId } });
    let result: boolean;
    try {
      result = await this.store.db.$transaction(async (tx) => {
        const user = before?.userId ? await this.store.lockUser(tx, before.userId) : null;
        const challenge = await this.consume(tx, input.challengeId, this.secrets.hmac(`code:${input.challengeId}:${input.code}`), purpose);
        if (!challenge || !['EMAIL', 'PHONE'].includes(challenge.channel)) {
          await this.store.audit(tx, requestId, 'AUTH_VERIFICATION_FAILED');
          return false;
        }
        if (purpose === 'REGISTER') {
          // Password is chosen only AFTER contact proof; pre-registration cannot plant a credential.
          if (challenge.userId || !input.displayName) return false;
          const created = await tx.user.create({ data: { displayName: input.displayName, preferredLanguage: input.preferredLanguage ?? 'en', passwordHash: hash, status: 'ACTIVE',
            ...(challenge.channel === 'EMAIL' ? { email: challenge.destination, emailVerifiedAt: new Date() } : { phone: challenge.destination, phoneVerifiedAt: new Date() }) } });
          await this.store.audit(tx, requestId, 'AUTH_REGISTERED', created.id);
        } else {
          if (!user || user.id !== challenge.userId) return false;
          const verified = challenge.channel === 'EMAIL' ? user.emailVerifiedAt && user.email === challenge.destination : user.phoneVerifiedAt && user.phone === challenge.destination;
          if (!verified) return false;
          await tx.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
          await tx.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
          await tx.authChallenge.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });
          await this.store.audit(tx, requestId, 'AUTH_PASSWORD_RESET', user.id);
        }
        return true;
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new DomainError('UNAUTHENTICATED', 401);
      throw error;
    }
    if (!result) throw new DomainError('UNAUTHENTICATED', 401);
    return { success: true };
  }

  async login(channel: Channel, raw: string, password: string, kind: ClientKind, deviceName: string, ip: string, requestId: string) {
    const destination = contact(channel, raw);
    await this.store.limit('login', ip, `${channel}:${destination}`);
    const before = await this.store.db.user.findUnique({ where: channel === 'EMAIL' ? { email: destination } : { phone: destination } });
    const valid = await this.passwords.verify(before?.passwordHash ?? null, password);
    const result = await this.store.db.$transaction(async (tx) => {
      const user = before ? await this.store.lockUser(tx, before.id) : null;
      const verified = user && (channel === 'EMAIL' ? user.emailVerifiedAt && user.email === destination : user.phoneVerifiedAt && user.phone === destination);
      if (!valid || !user || !verified || user.passwordHash !== before?.passwordHash) {
        await this.store.audit(tx, requestId, 'AUTH_LOGIN_FAILED');
        return null;
      }
      return this.sessions.create(tx, user.id, kind, deviceName, requestId);
    });
    if (!result) throw new DomainError('UNAUTHENTICATED', 401);
    return result;
  }

  async linkContact(userId: string, challengeId: string, code: string, ip: string, requestId: string, sessionId: string) {
    await this.store.limit('verify', ip, challengeId);
    try {
      const success = await this.store.db.$transaction(async (tx) => {
        const user = await this.store.lockUser(tx, userId);
        if (!user) return false;
        await this.store.requireSession(tx, userId, sessionId, true);
        const challenge = await this.consume(tx, challengeId, this.secrets.hmac(`code:${challengeId}:${code}`), 'LINK', userId);
        if (!user || !challenge || !['EMAIL', 'PHONE'].includes(challenge.channel)) return false;
        // Add a missing login method. Replacing a verified recovery contact is a separate lifecycle.
        if (challenge.channel === 'EMAIL' ? user.email !== null : user.phone !== null) return false;
        await tx.user.update({ where: { id: userId }, data: challenge.channel === 'EMAIL' ? { email: challenge.destination, emailVerifiedAt: new Date() } : { phone: challenge.destination, phoneVerifiedAt: new Date() } });
        await this.store.audit(tx, requestId, 'AUTH_CONTACT_LINKED', userId);
        return true;
      });
      if (!success) throw new DomainError('UNAUTHENTICATED', 401);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new DomainError('UNAUTHENTICATED', 401);
      throw error;
    }
    return { success: true };
  }

  async googleChallenge(ip: string) {
    this.google.assertAvailable();
    await this.store.limit('google', ip);
    const nonce = opaque();
    const challenge = await this.store.db.authChallenge.create({ data: { purpose: 'GOOGLE', channel: 'GOOGLE', destination: '', secretHash: digest(nonce), expiresAt: new Date(Date.now() + 5 * 60_000) } });
    return { challengeId: challenge.id, nonce, expiresIn: 300 };
  }

  async googleSignIn(challengeId: string, idToken: string, kind: ClientKind, deviceName: string, ip: string, requestId: string, linkUserId?: string, linkSessionId?: string) {
    await this.store.limit('google-login', ip);
    let proof: Awaited<ReturnType<GoogleTokens['verify']>>;
    try { proof = await this.google.verify(idToken); }
    catch (error) {
      await this.store.db.$transaction((tx) => this.store.audit(tx, requestId, 'AUTH_GOOGLE_FAILED'));
      throw error;
    }
    const email = contact('EMAIL', proof.email);
    const identity = await this.store.db.googleIdentity.findUnique({ where: { subject: proof.subject } });
    try {
      const result = await this.store.db.$transaction(async (tx) => {
        let user = (linkUserId || identity?.userId) ? await this.store.lockUser(tx, (linkUserId || identity!.userId)) : null;
        if (linkUserId) {
          if (!user) return null;
          await this.store.requireSession(tx, linkUserId, linkSessionId!, true);
        }
        const challenge = await this.consume(tx, challengeId, digest(proof.nonce), 'GOOGLE');
        if (!challenge) return null;
        if (linkUserId) {
          if (!user || (identity && identity.userId !== user.id)) return null;
          const linked = await tx.googleIdentity.findUnique({ where: { userId: user.id } });
          if (linked && linked.subject !== proof.subject) return null;
          if (!linked) await tx.googleIdentity.create({ data: { userId: user.id, subject: proof.subject } });
          await this.store.audit(tx, requestId, 'AUTH_GOOGLE_LINKED', user.id);
        } else if (identity) {
          if (!user) return null;
        } else {
          // Never merge accounts on email equality, even with email_verified from Google.
          if (!proof.authoritative || await tx.user.findUnique({ where: { email } })) return null;
          user = await tx.user.create({ data: { email, emailVerifiedAt: new Date(), status: 'ACTIVE', displayName: 'Core Shop user', googleIdentity: { create: { subject: proof.subject } } } });
          await this.store.audit(tx, requestId, 'AUTH_REGISTERED', user.id);
        }
        return user ? this.sessions.create(tx, user.id, kind, deviceName, requestId) : null;
      });
      if (!result) {
        await this.store.db.$transaction((tx) => this.store.audit(tx, requestId, 'AUTH_GOOGLE_FAILED'));
        throw new DomainError('UNAUTHENTICATED', 401);
      }
      return result;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new DomainError('UNAUTHENTICATED', 401);
      throw error;
    }
  }

  async requireRecent(userId: string, sessionId: string) {
    const session = await this.store.db.authSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId || session.revokedAt || session.createdAt.getTime() < Date.now() - 10 * 60_000) throw new DomainError('UNAUTHENTICATED', 401);
  }
}
