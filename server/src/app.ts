import { RequestMethod, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Environment } from './config/environment';
import { loadToolEnvironment } from './config/tool-environment';
import { configureSwagger } from './config/swagger';
import { randomUUID } from 'node:crypto';
import rateLimit from '@fastify/rate-limit';
import { createLogger } from './common/logging/logger';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { createValidationPipe } from './common/pipes/validation';
import { negotiateLocale } from './localization/errors';
import { FastifyInstance, LogController } from 'fastify';

export async function createApp(rootModule: Type<unknown> = AppModule) {
  const settings = loadToolEnvironment();
  const logger = createLogger(settings.LOG_LEVEL);
  const app = await NestFactory.create<NestFastifyApplication>(
    rootModule,
    new FastifyAdapter({
      bodyLimit: 1024 * 1024, requestIdHeader: false, genReqId: () => randomUUID(),
      trustProxy: settings.TRUST_PROXY_CIDRS.length ? settings.TRUST_PROXY_CIDRS : false,
      loggerInstance: logger, logController: new LogController({ disableRequestLogging: true }),
    }),
    { abortOnError: false, logger: false },
  );
  app.useSecurityHeaders({
    strictTransportSecurity: settings.NODE_ENV === 'production',
    contentSecurityPolicy: settings.NODE_ENV === 'development' ? {
      directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], objectSrc: ["'none'"], frameAncestors: ["'none'"], upgradeInsecureRequests: null },
    } : undefined,
  });
  const fastify: FastifyInstance = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    reply.header('content-language', negotiateLocale(request.headers['accept-language']));
    reply.header('vary', 'Accept-Language');
    reply.header('cache-control', 'no-store');
  });
  fastify.addHook('onResponse', async (request, reply) => {
    // Never log raw URLs, route parameters, query strings, bodies, headers, or IPs.
    logger.info({ event: 'request_completed', requestId: request.id, method: request.method,
      statusCode: reply.statusCode, durationMs: Math.round(reply.elapsedTime) });
  });
  await app.register(rateLimit, { global: false, max: settings.RATE_LIMIT_MAX, timeWindow: settings.RATE_LIMIT_WINDOW_MS, cache: 10_000, skipOnError: false });
  let limiter: ReturnType<FastifyInstance['rateLimit']> | undefined;
  fastify.addHook('onReady', async () => { limiter = fastify.rateLimit(); });
  fastify.addHook('onRequest', async (request, reply) => {
    if (!limiter) throw new Error('Rate limiter unavailable');
    await limiter.call(fastify, request, reply);
  });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = app.get(ConfigService<Environment, true>);
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'ready', method: RequestMethod.GET },
    ],
  });
  const origins = config.get('CORS_ORIGINS', { infer: true });
  app.enableCors({
    origin: origins.length ? origins : false, credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'Idempotency-Key', 'X-Organization-Id', 'X-Branch-Id'],
    exposedHeaders: ['X-Request-Id', 'Retry-After'],
  });
  await configureSwagger(app, config.get('NODE_ENV', { infer: true }));
  app.enableShutdownHooks();
  return app;
}
