BEGIN;

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'bn');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'DELIVERED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferredLanguage" "Language" NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN     "finalEtag" VARCHAR(128),
ADD COLUMN     "finalObjectKey" VARCHAR(512),
ADD COLUMN     "sourceEtag" VARCHAR(128);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "branchId" UUID,
    "actorId" UUID,
    "requestId" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(60) NOT NULL,
    "entityId" UUID,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "command_records" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "operation" VARCHAR(160) NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "status" "CommandStatus" NOT NULL DEFAULT 'PROCESSING',
    "responseStatus" SMALLINT,
    "result" JSONB,
    "requestId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "command_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "commandId" UUID NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_organizationId_createdAt_id_idx" ON "audit_events"("organizationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "audit_events_actorId_createdAt_idx" ON "audit_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_requestId_idx" ON "audit_events"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "command_records_organizationId_actorId_operation_key_key" ON "command_records"("organizationId", "actorId", "operation", "key");

-- CreateIndex
CREATE UNIQUE INDEX "command_records_organizationId_id_key" ON "command_records"("organizationId", "id");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_id_idx" ON "outbox_events"("status", "availableAt", "id");

-- CreateIndex
CREATE INDEX "outbox_events_organizationId_createdAt_idx" ON "outbox_events"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_commandId_eventType_key" ON "outbox_events"("commandId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_finalObjectKey_key" ON "stored_files"("finalObjectKey");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organizationId_branchId_fkey" FOREIGN KEY ("organizationId", "branchId") REFERENCES "branches"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command_records" ADD CONSTRAINT "command_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command_records" ADD CONSTRAINT "command_records_organizationId_actorId_fkey" FOREIGN KEY ("organizationId", "actorId") REFERENCES "memberships"("organizationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_organizationId_commandId_fkey" FOREIGN KEY ("organizationId", "commandId") REFERENCES "command_records"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE audit_events ADD CONSTRAINT audit_membership_scope FOREIGN KEY ("organizationId","actorId") REFERENCES memberships("organizationId","userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- R2 does not provide S3 object versions. Finalized objects have separate immutable keys.
ALTER TABLE stored_files DROP CONSTRAINT files_ready_evidence;
ALTER TABLE stored_files ADD CONSTRAINT files_ready_evidence CHECK (status <> 'READY' OR (
  "scanStatus" = 'CLEAN' AND "uploadedBytes" IS NOT NULL AND "actualBytes" IS NOT NULL
  AND "verifiedMimeType" IS NOT NULL AND sha256 IS NOT NULL AND "verifiedAt" IS NOT NULL
  AND "sourceEtag" IS NOT NULL AND "finalObjectKey" IS NOT NULL AND "finalEtag" IS NOT NULL
  AND ("verifiedMimeType" = 'application/pdf' OR (width IS NOT NULL AND height IS NOT NULL))
));
ALTER TABLE stored_files ADD CONSTRAINT files_final_key_scope CHECK (
  "finalObjectKey" IS NULL OR (sha256 IS NOT NULL AND "finalObjectKey" =
    CASE WHEN "ownerUserId" IS NOT NULL THEN 'users/' || "ownerUserId"::text ELSE 'organizations/' || "organizationId"::text END
    || '/' || id::text || '/verified/' || sha256)
);
ALTER TABLE stored_files ADD CONSTRAINT files_etags_valid CHECK (
  ("sourceEtag" IS NULL OR (length("sourceEtag") > 0 AND "sourceEtag" !~ '[[:cntrl:]]')) AND
  ("finalEtag" IS NULL OR (length("finalEtag") > 0 AND "finalEtag" !~ '[[:cntrl:]]'))
);
CREATE FUNCTION protect_verified_r2_object() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."finalObjectKey" IS NOT NULL AND
    (NEW."sourceEtag", NEW."finalObjectKey", NEW."finalEtag", NEW.sha256, NEW."actualBytes", NEW."uploadedBytes", NEW."verifiedMimeType", NEW.width, NEW.height)
      IS DISTINCT FROM
    (OLD."sourceEtag", OLD."finalObjectKey", OLD."finalEtag", OLD.sha256, OLD."actualBytes", OLD."uploadedBytes", OLD."verifiedMimeType", OLD.width, OLD.height) THEN
    RAISE EXCEPTION 'Verified object identity is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER files_r2_integrity BEFORE UPDATE ON stored_files FOR EACH ROW EXECUTE FUNCTION protect_verified_r2_object();

ALTER TABLE audit_events ADD CONSTRAINT audit_shape CHECK (
  action ~ '^[A-Z][A-Z0-9_]{0,79}$' AND "entityType" ~ '^[A-Z][A-Z0-9_]{0,59}$'
  AND jsonb_typeof(metadata) = 'object' AND octet_length(metadata::text) <= 4096
  AND ("branchId" IS NULL OR "organizationId" IS NOT NULL)
);
CREATE FUNCTION reject_evidence_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Evidence is append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();

ALTER TABLE command_records ADD CONSTRAINT command_shape CHECK (
  operation ~ '^[A-Za-z][A-Za-z0-9_:.-]{0,159}$' AND key ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  AND "payloadHash" ~ '^[a-f0-9]{64}$'
  AND ((status = 'PROCESSING' AND "responseStatus" IS NULL AND result IS NULL AND "completedAt" IS NULL)
    OR (status = 'COMPLETED' AND "responseStatus" IS NOT NULL AND "responseStatus" BETWEEN 200 AND 299 AND result IS NOT NULL
      AND jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 65536 AND "completedAt" IS NOT NULL))
);
CREATE FUNCTION protect_command_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Durable command records cannot be deleted' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'PROCESSING' THEN
      RAISE EXCEPTION 'Commands must be claimed before completion' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status <> 'PROCESSING' OR NEW.status <> 'COMPLETED' OR
    (NEW.id,NEW."organizationId",NEW."actorId",NEW.operation,NEW.key,NEW."payloadHash",NEW."requestId",NEW."createdAt")
      IS DISTINCT FROM
    (OLD.id,OLD."organizationId",OLD."actorId",OLD.operation,OLD.key,OLD."payloadHash",OLD."requestId",OLD."createdAt") THEN
    RAISE EXCEPTION 'Command identity and committed results are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER commands_immutable BEFORE INSERT OR UPDATE OR DELETE ON command_records FOR EACH ROW EXECUTE FUNCTION protect_command_record();
CREATE FUNCTION command_must_complete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM command_records WHERE id=NEW.id AND status <> 'COMPLETED') THEN
    RAISE EXCEPTION 'Command result must commit atomically' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER command_atomic_completion AFTER INSERT OR UPDATE ON command_records
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION command_must_complete();

ALTER TABLE outbox_events ADD CONSTRAINT outbox_shape CHECK (
  "eventType" ~ '^[A-Z][A-Z0-9_]{0,79}$' AND jsonb_typeof(payload)='object'
  AND octet_length(payload::text) <= 4096 AND attempts >= 0
  AND ((status='PENDING' AND "deliveredAt" IS NULL) OR (status='DELIVERED' AND "deliveredAt" IS NOT NULL))
);
CREATE FUNCTION protect_outbox_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR (NEW.id,NEW."organizationId",NEW."commandId",NEW."eventType",NEW.payload,NEW."createdAt")
    IS DISTINCT FROM (OLD.id,OLD."organizationId",OLD."commandId",OLD."eventType",OLD.payload,OLD."createdAt") THEN
    RAISE EXCEPTION 'Outbox event identity is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER outbox_immutable BEFORE UPDATE OR DELETE ON outbox_events FOR EACH ROW EXECUTE FUNCTION protect_outbox_event();
CREATE FUNCTION outbox_starts_pending() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> 'PENDING' OR NEW.attempts <> 0 OR NEW."deliveredAt" IS NOT NULL THEN
    RAISE EXCEPTION 'Outbox events must start pending' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER outbox_initial_state BEFORE INSERT ON outbox_events FOR EACH ROW EXECUTE FUNCTION outbox_starts_pending();
COMMIT;
