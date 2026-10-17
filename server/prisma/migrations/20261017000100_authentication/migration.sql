BEGIN;
-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientKind" VARCHAR(10) NOT NULL,
    "deviceName" VARCHAR(80) NOT NULL,
    "accessHash" CHAR(64) NOT NULL,
    "accessExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "csrfHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_tokens" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "channel" VARCHAR(10) NOT NULL,
    "purpose" VARCHAR(12) NOT NULL,
    "destination" VARCHAR(254) NOT NULL,
    "secretHash" CHAR(64) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_identities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_rate_buckets" (
    "key" CHAR(64) NOT NULL,
    "hits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_rate_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_accessHash_key" ON "auth_sessions"("accessHash");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_createdAt_idx" ON "auth_sessions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_tokenHash_key" ON "auth_refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_sessionId_idx" ON "auth_refresh_tokens"("sessionId");

-- CreateIndex
CREATE INDEX "auth_challenges_expiresAt_idx" ON "auth_challenges"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_challenges_userId_purpose_idx" ON "auth_challenges"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "google_identities_userId_key" ON "google_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "google_identities_subject_key" ON "google_identities"("subject");

-- CreateIndex
CREATE INDEX "auth_rate_buckets_expiresAt_idx" ON "auth_rate_buckets"("expiresAt");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "auth_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_identities" ADD CONSTRAINT "google_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE auth_sessions ADD CONSTRAINT auth_session_kind CHECK ("clientKind" IN ('WEB','MOBILE'));
ALTER TABLE auth_sessions ADD CONSTRAINT auth_session_lifetime CHECK ("accessExpiresAt" <= "expiresAt" AND "expiresAt" > "createdAt");
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenge_channel CHECK (channel IN ('EMAIL','PHONE','GOOGLE'));
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenge_purpose CHECK (purpose IN ('REGISTER','RESET','LINK','GOOGLE'));
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenge_attempts CHECK (attempts BETWEEN 0 AND 5);
ALTER TABLE auth_rate_buckets ADD CONSTRAINT auth_bucket_hits CHECK (hits > 0);
ALTER TABLE auth_sessions ADD CONSTRAINT auth_session_hashes CHECK ("accessHash" ~ '^[a-f0-9]{64}$' AND "csrfHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE auth_refresh_tokens ADD CONSTRAINT auth_refresh_hash CHECK ("tokenHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenge_hash CHECK ("secretHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE auth_rate_buckets ADD CONSTRAINT auth_rate_key CHECK (key ~ '^[a-f0-9]{64}$');
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenge_kind CHECK ((channel = 'GOOGLE') = (purpose = 'GOOGLE'));
CREATE FUNCTION protect_auth_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'auth_sessions' THEN
    IF (to_jsonb(NEW) - ARRAY['accessHash','accessExpiresAt','csrfHash','revokedAt']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['accessHash','accessExpiresAt','csrfHash','revokedAt']) OR
       (OLD."revokedAt" IS NOT NULL AND NEW IS DISTINCT FROM OLD) THEN
      RAISE EXCEPTION 'invalid authentication state transition' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'auth_refresh_tokens' THEN
    IF (to_jsonb(NEW) - 'usedAt') IS DISTINCT FROM (to_jsonb(OLD) - 'usedAt') OR
       (OLD."usedAt" IS NOT NULL AND NEW."usedAt" IS DISTINCT FROM OLD."usedAt") THEN
      RAISE EXCEPTION 'invalid authentication state transition' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'auth_challenges' THEN
    IF (to_jsonb(NEW) - ARRAY['attempts','consumedAt','expiresAt']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['attempts','consumedAt','expiresAt']) OR NEW."expiresAt" > OLD."expiresAt" OR
       NEW.attempts < OLD.attempts OR NEW.attempts > OLD.attempts + 1 OR
       (OLD."consumedAt" IS NOT NULL AND NEW."consumedAt" IS DISTINCT FROM OLD."consumedAt") THEN
      RAISE EXCEPTION 'invalid authentication state transition' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER auth_session_state BEFORE UPDATE ON auth_sessions FOR EACH ROW EXECUTE FUNCTION protect_auth_state();
CREATE TRIGGER auth_refresh_state BEFORE UPDATE ON auth_refresh_tokens FOR EACH ROW EXECUTE FUNCTION protect_auth_state();
CREATE TRIGGER auth_challenge_state BEFORE UPDATE ON auth_challenges FOR EACH ROW EXECUTE FUNCTION protect_auth_state();
COMMIT;
