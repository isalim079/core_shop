import pino, { DestinationStream, Logger } from 'pino';

// Allowlisted serializers are the primary boundary; redaction is defense in depth.
export function createLogger(level: string, destination?: DestinationStream): Logger {
  const options = {
    level, base: { service: 'core-shop-server' },
    redact: {
      paths: ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'authorization',
        'cookie', 'DATABASE_URL', 'MIGRATION_DATABASE_URL', 'R2_SECRET_ACCESS_KEY',
        '*.password', '*.token', '*.authorization', '*.cookie', '*.secret', '*.signedUrl'],
      censor: '[REDACTED]',
    },
    serializers: {
      req: () => undefined, res: () => undefined,
      err: () => ({ type: 'InternalError' }),
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
