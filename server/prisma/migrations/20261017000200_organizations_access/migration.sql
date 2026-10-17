BEGIN;
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" VARCHAR(500),
ADD COLUMN     "documentLanguage" VARCHAR(5) NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "address" VARCHAR(500);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "organization_creations" (
    "userId" UUID NOT NULL,
    "key" UUID NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "organizationId" UUID NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_creations_pkey" PRIMARY KEY ("userId","key")
);

-- CreateTable
CREATE TABLE "membership_invitations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "channel" VARCHAR(5) NOT NULL,
    "destination" VARCHAR(254) NOT NULL,
    "status" VARCHAR(8) NOT NULL DEFAULT 'PENDING',
    "branchAccess" "BranchAccess" NOT NULL,
    "roleIds" UUID[],
    "branchIds" UUID[],
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "acceptedByUserId" UUID,
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_creations_organizationId_key" ON "organization_creations"("organizationId");

-- CreateIndex
CREATE INDEX "membership_invitations_channel_destination_status_expiresAt_idx" ON "membership_invitations"("channel", "destination", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "membership_invitations_organizationId_createdAt_id_idx" ON "membership_invitations"("organizationId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "organization_creations" ADD CONSTRAINT "organization_creations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_creations" ADD CONSTRAINT "organization_creations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invitations" ADD CONSTRAINT "membership_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invitations" ADD CONSTRAINT "membership_invitations_organizationId_invitedByUserId_fkey" FOREIGN KEY ("organizationId", "invitedByUserId") REFERENCES "memberships"("organizationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invitations" ADD CONSTRAINT "membership_invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE organizations ADD CONSTRAINT organization_document_language CHECK ("documentLanguage" IN ('en','bn','en-bn'));
ALTER TABLE organization_creations ADD CONSTRAINT organization_creation_hash CHECK ("payloadHash" ~ '^[a-f0-9]{64}$' AND jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 1024);
ALTER TABLE membership_invitations ALTER COLUMN "roleIds" SET NOT NULL, ALTER COLUMN "branchIds" SET NOT NULL;
ALTER TABLE membership_invitations ADD CONSTRAINT invitation_contact CHECK (
  (channel = 'EMAIL' AND destination = lower(btrim(destination)) AND destination ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
  OR (channel = 'PHONE' AND destination ~ '^\+[1-9][0-9]{7,14}$'));
ALTER TABLE membership_invitations ADD CONSTRAINT invitation_state CHECK (
  status IN ('PENDING','ACCEPTED','REVOKED') AND
  ((status = 'ACCEPTED' AND "acceptedByUserId" IS NOT NULL AND "acceptedAt" IS NOT NULL AND "acceptedAt" <= "expiresAt") OR
   (status <> 'ACCEPTED' AND "acceptedByUserId" IS NULL AND "acceptedAt" IS NULL))
  AND "expiresAt" > "createdAt" AND cardinality("roleIds") <= 10 AND cardinality("branchIds") <= 100
  AND ("branchAccess" <> 'ALL' OR cardinality("branchIds") = 0));
CREATE UNIQUE INDEX invitation_pending_contact ON membership_invitations ("organizationId",channel,destination) WHERE status = 'PENDING';
CREATE FUNCTION protect_membership_invitation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE found_roles int; found_branches int;
BEGIN
  PERFORM 1 FROM organizations WHERE id = NEW."organizationId" FOR UPDATE;
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - ARRAY['status','acceptedByUserId','acceptedAt']) IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status','acceptedByUserId','acceptedAt']) OR
       (OLD.status <> 'PENDING' AND NEW IS DISTINCT FROM OLD) THEN
      RAISE EXCEPTION 'Invitation identity and terminal state are immutable' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW.status <> 'PENDING' THEN
      RAISE EXCEPTION 'Invitation must start pending' USING ERRCODE = '23514';
    END IF;
    SELECT count(*) INTO found_roles FROM roles WHERE id = ANY(NEW."roleIds") AND "organizationId" = NEW."organizationId" AND "archivedAt" IS NULL;
    SELECT count(*) INTO found_branches FROM branches WHERE id = ANY(NEW."branchIds") AND "organizationId" = NEW."organizationId" AND "archivedAt" IS NULL;
    IF found_roles <> cardinality(NEW."roleIds") OR found_branches <> cardinality(NEW."branchIds") THEN
      RAISE EXCEPTION 'Invalid invitation references' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.status = 'ACCEPTED' AND NOT EXISTS (
    SELECT 1 FROM users u JOIN memberships m ON m."userId"=u.id AND m."organizationId"=NEW."organizationId" AND m.status='ACTIVE'
    WHERE u.id=NEW."acceptedByUserId" AND u.status='ACTIVE' AND u."deletedAt" IS NULL AND
      ((NEW.channel='EMAIL' AND u.email=NEW.destination AND u."emailVerifiedAt" IS NOT NULL) OR
       (NEW.channel='PHONE' AND u.phone=NEW.destination AND u."phoneVerifiedAt" IS NOT NULL))) THEN
    RAISE EXCEPTION 'Invitation acceptance requires verified recipient membership' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER invitation_state BEFORE INSERT OR UPDATE ON membership_invitations FOR EACH ROW EXECUTE FUNCTION protect_membership_invitation();
CREATE FUNCTION lock_organization_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW."organizationId" <> OLD."organizationId" OR NEW.code <> OLD.code) THEN
    RAISE EXCEPTION 'Organization reference and code are immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM 1 FROM organizations WHERE id=OLD."organizationId" FOR UPDATE;
    RETURN OLD;
  END IF;
  PERFORM 1 FROM organizations WHERE id=NEW."organizationId" FOR UPDATE;
  RETURN NEW;
END;
$$;
CREATE TRIGGER branches_lock_organization BEFORE UPDATE OR DELETE ON branches FOR EACH ROW EXECUTE FUNCTION lock_organization_metadata();
CREATE TRIGGER roles_lock_organization BEFORE UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION lock_organization_metadata();
CREATE FUNCTION retain_active_branch() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN org_id := OLD."organizationId"; ELSE org_id := NEW."organizationId"; END IF;
  IF EXISTS (SELECT 1 FROM organizations WHERE id=org_id AND status='ACTIVE') AND
     NOT EXISTS (SELECT 1 FROM branches WHERE "organizationId"=org_id AND "archivedAt" IS NULL) THEN
    RAISE EXCEPTION 'Active organization requires an active branch' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER branches_retain_active AFTER UPDATE OR DELETE ON branches DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION retain_active_branch();
CREATE FUNCTION protect_organization_financial_settings() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.currency,NEW."currencyScale",NEW."quantityScale",NEW.timezone) IS DISTINCT FROM
     (OLD.currency,OLD."currencyScale",OLD."quantityScale",OLD.timezone) THEN
    RAISE EXCEPTION 'Financial identity settings require a separate migration workflow' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER organization_financial_identity BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION protect_organization_financial_settings();

COMMIT;
