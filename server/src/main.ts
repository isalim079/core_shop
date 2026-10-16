import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './app';
import { Environment } from './config/environment';

async function bootstrap() {
  const app = await createApp();
  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('PORT', { infer: true }), config.get('HOST', { infer: true }));
}

void bootstrap().catch(() => {
  Logger.error('Server startup failed. Check environment configuration and port availability.', 'Bootstrap');
  process.exitCode = 1;
});
