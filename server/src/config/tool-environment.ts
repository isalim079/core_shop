import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { environmentFiles, validateEnvironment } from './environment';

// Prisma CLI and seed use the same file selection and process precedence as Nest.
export function loadToolEnvironment() {
  for (const path of environmentFiles()) {
    if (existsSync(path)) loadEnvFile(path);
  }
  return validateEnvironment(process.env);
}
