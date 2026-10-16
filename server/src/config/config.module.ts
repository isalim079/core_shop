import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentFiles, validateEnvironment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: environmentFiles(),
      validate: validateEnvironment,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
