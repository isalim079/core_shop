import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard, IdentityVerifier, RequestAccess, TenantGuard } from './guards/access';
import { TenantAuthorization } from './guards/tenant-authorization';

@Global()
@Module({
  providers: [IdentityVerifier, RequestAccess, TenantAuthorization,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: TenantGuard }],
  exports: [IdentityVerifier, RequestAccess, TenantAuthorization],
})
export class SecurityModule {}
