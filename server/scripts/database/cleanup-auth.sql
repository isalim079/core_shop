-- Schedule as a maintenance owner/job. Runtime cannot DELETE authentication evidence.
-- Keep used refresh history for the entire active family's lifetime.
BEGIN;
SET LOCAL statement_timeout = '30s';
DELETE FROM auth_challenges WHERE "expiresAt" < now();
DELETE FROM auth_rate_buckets WHERE "expiresAt" < now();
DELETE FROM auth_refresh_tokens WHERE "sessionId" IN (SELECT id FROM auth_sessions WHERE "expiresAt" < now());
DELETE FROM auth_sessions WHERE "expiresAt" < now();
COMMIT;
