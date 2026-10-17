import { Module } from '@nestjs/common';
import { AuthSecrets, Passwords } from './auth-primitives';
import { AuthStore } from './auth-store.service';
import { SmsDelivery, VerificationDeliveryService } from './delivery.service';
import { Sessions } from './sessions.service';
import { GoogleTokens } from './google.service';
import { Authentication } from './auth.service';

@Module({
  providers: [AuthSecrets, Passwords, AuthStore, SmsDelivery, VerificationDeliveryService, Sessions, GoogleTokens, Authentication],
  exports: [Sessions, Authentication, AuthStore],
})
export class AuthCoreModule {}
