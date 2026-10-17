import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { SecurityModule } from './common/security.module';
import { CommandsModule } from './common/commands/commands.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    SecurityModule,
    CommandsModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
