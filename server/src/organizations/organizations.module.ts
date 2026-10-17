import { Module } from '@nestjs/common';
import { AuthCoreModule } from '../auth/auth-core.module';
import { OrganizationPolicy } from './organization-policy.service';
import { Organizations } from './organizations.service';
import { Invitations } from './invitations.service';
import { OrganizationsController } from './organizations.controller';
@Module({ imports: [AuthCoreModule], providers: [OrganizationPolicy, Organizations, Invitations], controllers: [OrganizationsController] })
export class OrganizationsModule {}
