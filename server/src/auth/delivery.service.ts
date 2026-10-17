import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { Environment } from '../config/environment';
import { DomainError } from '../common/errors/domain-error';
import { Channel, Purpose } from './auth-primitives';

export interface VerificationDelivery { channel: Channel; destination: string; code: string; purpose: Purpose }

// Replace this provider when the owner selects an SMS vendor. No plaintext-code queue or logs.
@Injectable()
export class SmsDelivery {
  available() { return false; }
  async send(_message: VerificationDelivery): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new DomainError('SERVICE_UNAVAILABLE', 503);
  }
}

@Injectable()
export class VerificationDeliveryService implements OnModuleDestroy {
  private readonly transport;
  private readonly from: string;
  constructor(config: ConfigService<Environment, true>, private readonly sms: SmsDelivery) {
    const host = config.get('SMTP_HOST', { infer: true });
    this.from = config.get('SMTP_FROM', { infer: true });
    this.transport = host ? nodemailer.createTransport({
      host, port: config.get('SMTP_PORT', { infer: true }), secure: config.get('SMTP_SECURE', { infer: true }) === 'true',
      requireTLS: true, tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      auth: config.get('SMTP_USER', { infer: true }) ? { user: config.get('SMTP_USER', { infer: true }), pass: config.get('SMTP_PASSWORD', { infer: true }) } : undefined,
      connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10_000, logger: false, debug: false,
    }) : null;
  }
  assertAvailable(channel: Channel) {
    if (channel === 'EMAIL' ? !this.transport : !this.sms.available()) throw new DomainError('SERVICE_UNAVAILABLE', 503);
  }
  async send(message: VerificationDelivery) {
    if (message.channel === 'PHONE') return this.sms.send(message);
    if (!this.transport) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    await this.transport.sendMail({ from: this.from, to: message.destination, subject: 'Core Shop verification code',
      text: `Your Core Shop verification code is ${message.code}. It expires in 10 minutes. If you did not request this code, ignore this message.` });
  }
  onModuleDestroy() { this.transport?.close(); }
}
