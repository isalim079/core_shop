import { z } from 'zod';
import { isIP } from 'node:net';

const runtimeMode = z.enum(['development', 'test', 'production']);
const connectionUrl = (protocols: string[]) => z.union([
  z.literal(''),
  z.string().url().refine((value) => URL.canParse(value) && protocols.includes(new URL(value).protocol)),
]).default('');
const schema = z.object({
  NODE_ENV: runtimeMode.default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGINS: z.string().default(''),
  DATABASE_URL: connectionUrl(['postgres:', 'postgresql:']),
  MIGRATION_DATABASE_URL: connectionUrl(['postgres:', 'postgresql:']),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(3000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5000),
  REDIS_URL: connectionUrl(['redis:', 'rediss:']),
  LOG_LEVEL: z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug']).default('info'),
  TRUST_PROXY_CIDRS: z.string().default(''),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3_600_000).default(60_000),
  AUTH_SECRET: z.union([z.literal(''), z.string().min(43).max(256)]).default(''),
  GOOGLE_CLIENT_IDS: z.string().max(4096).default(''),
  SMTP_HOST: z.string().max(253).default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().max(254).default(''),
  SMTP_PASSWORD: z.string().max(512).default(''),
  SMTP_FROM: z.union([z.literal(''), z.email()]).default(''),
  STORAGE_PROVIDER: z.literal('cloudflare-r2').default('cloudflare-r2'),
  R2_ACCOUNT_ID: z.union([z.literal(''), z.string().regex(/^[a-f0-9]{32}$/)]).default(''),
  R2_BUCKET_NAME: z.union([z.literal(''), z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)]).default(''),
  R2_ACCESS_KEY_ID: z.string().max(128).default(''),
  R2_SECRET_ACCESS_KEY: z.string().max(256).default(''),
});

export function environmentFiles(mode = process.env.NODE_ENV ?? 'development'): string[] {
  const result = runtimeMode.safeParse(mode);
  if (!result.success) throw new Error('Invalid NODE_ENV; use development, test, or production.');
  if (mode === 'test') return []; // Tests never read local credentials.
  return [mode === 'production' ? '.env.production' : '.env.local'];
}

export function validateEnvironment(input: Record<string, unknown>) {
  const result = schema.safeParse(input);
  if (!result.success) {
    // Report field names only; configuration values may contain credentials.
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  const config = result.data;
  if (config.SMTP_HOST && !config.SMTP_FROM) throw new Error('Invalid environment configuration: SMTP_FROM');
  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) throw new Error('Invalid environment configuration: SMTP credentials');
  if (config.GOOGLE_CLIENT_IDS && !config.GOOGLE_CLIENT_IDS.split(',').every((id) => /^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id.trim()))) throw new Error('Invalid environment configuration: GOOGLE_CLIENT_IDS');
  const proxies = config.TRUST_PROXY_CIDRS.split(',').map((value) => value.trim()).filter(Boolean);
  for (const proxy of proxies) {
    const [address, prefix, extra] = proxy.split('/');
    const version = isIP(address);
    if (!version || extra !== undefined || (prefix !== undefined && (!/^\d{1,3}$/.test(prefix) || Number(prefix) > (version === 4 ? 32 : 128)))) {
      throw new Error('Invalid environment configuration: TRUST_PROXY_CIDRS');
    }
  }
  const r2 = [config.R2_ACCOUNT_ID, config.R2_BUCKET_NAME, config.R2_ACCESS_KEY_ID, config.R2_SECRET_ACCESS_KEY];
  if (r2.some(Boolean) && !r2.every(Boolean)) throw new Error('Invalid environment configuration: R2 settings must be provided together');
  const origins = config.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
  for (const origin of origins) {
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins without paths or credentials.');
    }
    if (config.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('Production CORS_ORIGINS must use HTTPS.');
    }
  }
  return { ...config, CORS_ORIGINS: origins, TRUST_PROXY_CIDRS: proxies };
}

export type Environment = ReturnType<typeof validateEnvironment>;

export function validateRuntimeEnvironment(input: Record<string, unknown>) {
  const config = validateEnvironment(input);
  if (config.NODE_ENV !== 'test' && !config.DATABASE_URL) {
    throw new Error('Invalid environment configuration: DATABASE_URL');
  }
  return config;
}
