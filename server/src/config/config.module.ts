import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentFiles, validateRuntimeEnvironment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: environmentFiles(),
      validate: validateRuntimeEnvironment,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
