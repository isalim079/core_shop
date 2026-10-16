import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentFiles, validateEnvironment } from './common/config/environment';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: environmentFiles(),
      validate: validateEnvironment,
    }),
    HealthModule,
  ],
})
export class AppModule {}
