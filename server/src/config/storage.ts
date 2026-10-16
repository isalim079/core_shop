import { Environment } from './environment';

export function r2Configuration(config: Environment) {
  if (!config.R2_ACCOUNT_ID) return null;
  return {
    provider: 'cloudflare-r2' as const,
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto', bucket: config.R2_BUCKET_NAME,
    credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY },
  };
}
