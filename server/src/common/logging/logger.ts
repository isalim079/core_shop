import pino, { DestinationStream, Logger, LoggerOptions } from 'pino';

// Allowlisted serializers are the primary boundary; redaction is defense in depth.
export function createLogger(level: string, destination?: DestinationStream): Logger {
  const options: LoggerOptions = {
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
    hooks: {
      logMethod(args, method) {
        const input = args[0];
        const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};
        const event = ['request_completed', 'request_failed', 'startup_failed'].includes(String(data.event)) ? data.event : 'application_event';
        const safe: Record<string, unknown> = { event };
        if (typeof data.requestId === 'string' && /^[0-9a-f-]{36}$/i.test(data.requestId)) safe.requestId = data.requestId;
        if (typeof data.method === 'string' && /^[A-Z]{1,16}$/.test(data.method)) safe.method = data.method;
        if (typeof data.code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(data.code)) safe.code = data.code;
        if (typeof data.statusCode === 'number' && Number.isInteger(data.statusCode) && data.statusCode >= 100 && data.statusCode <= 599) safe.statusCode = data.statusCode;
        if (typeof data.durationMs === 'number' && Number.isFinite(data.durationMs) && data.durationMs >= 0) safe.durationMs = data.durationMs;
        // Omit free-form message arguments, including Pino's implicit Error.message.
        method.call(this, safe);
      },
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
