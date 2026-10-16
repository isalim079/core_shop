import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { createApp } from './app';
import { Environment } from './config/environment';
import { createLogger } from './common/logging/logger';

async function bootstrap() {
  const app = await createApp();
  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('PORT', { infer: true }), config.get('HOST', { infer: true }));
}

void bootstrap().catch(() => {
  createLogger('error').error({ event: 'startup_failed' });
  process.exitCode = 1;
});
