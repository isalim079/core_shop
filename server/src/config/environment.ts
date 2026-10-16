import { z } from 'zod';

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
  REDIS_URL: connectionUrl(['redis:', 'rediss:']),
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
  return { ...config, CORS_ORIGINS: origins };
}

export type Environment = ReturnType<typeof validateEnvironment>;
