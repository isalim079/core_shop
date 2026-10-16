import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Environment } from './config/environment';
import { configureSwagger } from './config/swagger';

export async function createApp() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1024 * 1024 }),
    { abortOnError: false },
  );
  const config = app.get(ConfigService<Environment, true>);
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'ready', method: RequestMethod.GET },
    ],
  });
  const origins = config.get('CORS_ORIGINS', { infer: true });
  app.enableCors({ origin: origins.length ? origins : false, credentials: false });
  await configureSwagger(app, config.get('NODE_ENV', { infer: true }));
  app.enableShutdownHooks();
  return app;
}
