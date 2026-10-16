BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BranchAccess" AS ENUM ('ALL', 'SELECTED');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('USER_AVATAR', 'ORGANIZATION_LOGO', 'ORGANIZATION_COVER', 'PRODUCT_IMAGE', 'SALE_ATTACHMENT', 'PURCHASE_ATTACHMENT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'QUARANTINED', 'READY', 'REJECTED', 'DELETION_PENDING', 'DELETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPPORT', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "displayName" VARCHAR(120) NOT NULL,
    "passwordHash" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "phoneVerifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" CHAR(3) NOT NULL,
    "currencyScale" SMALLINT NOT NULL DEFAULT 2,
    "timezone" VARCHAR(80) NOT NULL,
    "quantityScale" SMALLINT NOT NULL DEFAULT 3,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "branchAccess" "BranchAccess" NOT NULL DEFAULT 'SELECTED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "code" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionCode" VARCHAR(80) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionCode")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "organizationId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membershipId","roleId")
);

-- CreateTable
CREATE TABLE "branch_grants" (
    "organizationId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "branchId" UUID NOT NULL,

    CONSTRAINT "branch_grants_pkey" PRIMARY KEY ("membershipId","branchId")
);

-- CreateTable
CREATE TABLE "platform_grants" (
    "userId" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_grants_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "ownerUserId" UUID,
    "uploadedByUserId" UUID NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "bucket" VARCHAR(63) NOT NULL,
    "objectKey" VARCHAR(512) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "declaredMimeType" VARCHAR(100) NOT NULL,
    "verifiedMimeType" VARCHAR(100),
    "expectedBytes" BIGINT NOT NULL,
    "uploadedBytes" BIGINT,
    "actualBytes" BIGINT,
    "sourceVersion" VARCHAR(255),
    "sha256" CHAR(64),
    "storageVersion" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_avatars" (
    "userId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_avatars_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "organization_branding" (
    "organizationId" UUID NOT NULL,
    "logoFileId" UUID,
    "coverFileId" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_branding_pkey" PRIMARY KEY ("organizationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "memberships_userId_status_idx" ON "memberships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_id_key" ON "memberships"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_code_key" ON "branches"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organizationId_id_key" ON "branches"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_code_key" ON "roles"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_id_key" ON "roles"("organizationId", "id");

-- CreateIndex
CREATE INDEX "role_permissions_permissionCode_idx" ON "role_permissions"("permissionCode");

-- CreateIndex
CREATE INDEX "membership_roles_organizationId_roleId_idx" ON "membership_roles"("organizationId", "roleId");

-- CreateIndex
CREATE INDEX "branch_grants_organizationId_branchId_idx" ON "branch_grants"("organizationId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_objectKey_key" ON "stored_files"("objectKey");

-- CreateIndex
CREATE INDEX "stored_files_organizationId_purpose_status_createdAt_idx" ON "stored_files"("organizationId", "purpose", "status", "createdAt");

-- CreateIndex
CREATE INDEX "stored_files_ownerUserId_purpose_status_idx" ON "stored_files"("ownerUserId", "purpose", "status");

-- CreateIndex
CREATE INDEX "stored_files_status_expiresAt_idx" ON "stored_files"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "stored_files_uploadedByUserId_idx" ON "stored_files"("uploadedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_ownerUserId_id_key" ON "stored_files"("ownerUserId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_organizationId_id_key" ON "stored_files"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "user_avatars_fileId_key" ON "user_avatars"("fileId");

-- CreateIndex
CREATE INDEX "organization_branding_logoFileId_idx" ON "organization_branding"("logoFileId");

-- CreateIndex
CREATE INDEX "organization_branding_coverFileId_idx" ON "organization_branding"("coverFileId");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_organizationId_membershipId_fkey" FOREIGN KEY ("organizationId", "membershipId") REFERENCES "memberships"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_organizationId_roleId_fkey" FOREIGN KEY ("organizationId", "roleId") REFERENCES "roles"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_grants" ADD CONSTRAINT "branch_grants_organizationId_membershipId_fkey" FOREIGN KEY ("organizationId", "membershipId") REFERENCES "memberships"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_grants" ADD CONSTRAINT "branch_grants_organizationId_branchId_fkey" FOREIGN KEY ("organizationId", "branchId") REFERENCES "branches"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_grants" ADD CONSTRAINT "platform_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_userId_fileId_fkey" FOREIGN KEY ("userId", "fileId") REFERENCES "stored_files"("ownerUserId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organizationId_logoFileId_fkey" FOREIGN KEY ("organizationId", "logoFileId") REFERENCES "stored_files"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organizationId_coverFileId_fkey" FOREIGN KEY ("organizationId", "coverFileId") REFERENCES "stored_files"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business invariants not expressible in Prisma's schema language.
ALTER TABLE users ADD CONSTRAINT users_identity_required CHECK (email IS NOT NULL OR phone IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_email_normalized CHECK (email IS NULL OR (email = lower(btrim(email)) AND length(email) > 3));
ALTER TABLE users ADD CONSTRAINT users_phone_normalized CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$');
ALTER TABLE users ADD CONSTRAINT users_name_not_empty CHECK (length(btrim("displayName")) > 0);
ALTER TABLE users ADD CONSTRAINT users_deleted_state CHECK ((status = 'DELETED') = ("deletedAt" IS NOT NULL));
ALTER TABLE organizations ADD CONSTRAINT organizations_settings_valid CHECK (
  currency ~ '^[A-Z]{3}$' AND "currencyScale" BETWEEN 0 AND 4
  AND "quantityScale" BETWEEN 0 AND 6 AND length(btrim(name)) > 0
  AND length(btrim(timezone)) > 0
);
ALTER TABLE organizations ADD CONSTRAINT organizations_archived_state CHECK ((status = 'ARCHIVED') = ("archivedAt" IS NOT NULL));
ALTER TABLE memberships ADD CONSTRAINT memberships_owner_branch_access CHECK (NOT "isOwner" OR "branchAccess" = 'ALL');
ALTER TABLE branches ADD CONSTRAINT branches_code_valid CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$' AND length(btrim(name)) > 0);

ALTER TABLE stored_files ADD CONSTRAINT files_owner_scope CHECK (
  ("ownerUserId" IS NOT NULL AND "organizationId" IS NULL AND purpose = 'USER_AVATAR' AND "uploadedByUserId" = "ownerUserId")
  OR ("organizationId" IS NOT NULL AND "ownerUserId" IS NULL AND purpose <> 'USER_AVATAR')
);
ALTER TABLE stored_files ADD CONSTRAINT files_size_limits CHECK (
  "expectedBytes" > 0 AND "expectedBytes" <= CASE
    WHEN purpose IN ('USER_AVATAR', 'ORGANIZATION_LOGO') THEN 5242880
    WHEN purpose IN ('ORGANIZATION_COVER', 'PRODUCT_IMAGE') THEN 10485760
    ELSE 20971520 END
  AND ("uploadedBytes" IS NULL OR "uploadedBytes" = "expectedBytes")
  AND ("actualBytes" IS NULL OR ("actualBytes" > 0 AND "actualBytes" <= CASE WHEN purpose IN ('USER_AVATAR', 'ORGANIZATION_LOGO') THEN 5242880 WHEN purpose IN ('ORGANIZATION_COVER', 'PRODUCT_IMAGE') THEN 10485760 ELSE 20971520 END))
);
ALTER TABLE stored_files ADD CONSTRAINT files_declared_type CHECK (
  "declaredMimeType" IN ('image/jpeg', 'image/png', 'image/webp')
  OR (purpose IN ('SALE_ATTACHMENT', 'PURCHASE_ATTACHMENT', 'DOCUMENT') AND "declaredMimeType" = 'application/pdf')
);
ALTER TABLE stored_files ADD CONSTRAINT files_verified_type CHECK (
  "verifiedMimeType" IS NULL OR "verifiedMimeType" IN ('image/jpeg', 'image/png', 'image/webp')
  OR (purpose IN ('SALE_ATTACHMENT', 'PURCHASE_ATTACHMENT', 'DOCUMENT') AND "verifiedMimeType" = 'application/pdf')
);
ALTER TABLE stored_files ADD CONSTRAINT files_checksum CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$');
ALTER TABLE stored_files ADD CONSTRAINT files_dimensions CHECK (
  (width IS NULL AND height IS NULL) OR (width IS NOT NULL AND height IS NOT NULL AND width > 0 AND height > 0 AND width::bigint * height::bigint <= 40000000)
);
ALTER TABLE stored_files ADD CONSTRAINT files_key_scope CHECK (
  bucket ~ '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$'
  AND "objectKey" ~ ('^' || CASE WHEN "ownerUserId" IS NOT NULL THEN 'users/' || "ownerUserId"::text ELSE 'organizations/' || "organizationId"::text END || '/[0-9a-f-]{36}/original$')
);
ALTER TABLE stored_files ADD CONSTRAINT files_ready_evidence CHECK (status <> 'READY' OR (
  "scanStatus" = 'CLEAN' AND "uploadedBytes" IS NOT NULL AND "sourceVersion" IS NOT NULL AND "actualBytes" IS NOT NULL AND "verifiedMimeType" IS NOT NULL
  AND sha256 IS NOT NULL AND "verifiedAt" IS NOT NULL AND "storageVersion" IS NOT NULL
  AND ("verifiedMimeType" = 'application/pdf' OR (width IS NOT NULL AND height IS NOT NULL))
));
ALTER TABLE stored_files ADD CONSTRAINT files_deleted_state CHECK ((status = 'DELETED') = ("deletedAt" IS NOT NULL));

-- Serialize owner changes on the organization row. Deferred checks permit atomic onboarding and ownership transfer.
CREATE FUNCTION lock_membership_organization() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW."organizationId" <> OLD."organizationId" OR NEW."userId" <> OLD."userId") THEN
    RAISE EXCEPTION 'Membership identity is immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM 1 FROM organizations WHERE id = OLD."organizationId" FOR UPDATE;
    RETURN OLD;
  END IF;
  PERFORM 1 FROM organizations WHERE id = NEW."organizationId" FOR UPDATE;
  RETURN NEW;
END;
$$;
CREATE TRIGGER memberships_lock_organization BEFORE INSERT OR UPDATE OR DELETE ON memberships
FOR EACH ROW EXECUTE FUNCTION lock_membership_organization();

CREATE FUNCTION enforce_organization_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'organizations' THEN
    org_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    org_id := OLD."organizationId";
  ELSE
    org_id := NEW."organizationId";
  END IF;
  IF EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND status <> 'ARCHIVED')
     AND NOT EXISTS (SELECT 1 FROM memberships WHERE "organizationId" = org_id AND "isOwner" AND status = 'ACTIVE') THEN
    RAISE EXCEPTION 'Organization requires an active owner membership' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER organizations_require_owner AFTER INSERT OR UPDATE ON organizations
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_organization_owner();
CREATE CONSTRAINT TRIGGER memberships_retain_owner AFTER INSERT OR UPDATE OR DELETE ON memberships
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_organization_owner();

CREATE FUNCTION enforce_timezone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'Unsupported organization timezone' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER organizations_timezone BEFORE INSERT OR UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION enforce_timezone();

-- Binding locks the file so attachment and deletion cannot race.
CREATE FUNCTION enforce_ready_file_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f stored_files%ROWTYPE; file_id uuid; expected_purpose "FilePurpose";
BEGIN
  IF TG_TABLE_NAME = 'user_avatars' THEN
    file_id := NEW."fileId"; expected_purpose := 'USER_AVATAR';
    SELECT * INTO f FROM stored_files WHERE id = file_id FOR UPDATE;
    IF NOT FOUND OR f."ownerUserId" IS DISTINCT FROM NEW."userId" OR f.status <> 'READY' OR f.purpose <> expected_purpose THEN
      RAISE EXCEPTION 'Avatar requires a ready user-owned image' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW."logoFileId" IS NOT NULL THEN
      SELECT * INTO f FROM stored_files WHERE id = NEW."logoFileId" FOR UPDATE;
      IF NOT FOUND OR f."organizationId" IS DISTINCT FROM NEW."organizationId" OR f.status <> 'READY' OR f.purpose <> 'ORGANIZATION_LOGO' THEN
        RAISE EXCEPTION 'Logo requires a ready organization-owned image' USING ERRCODE = '23514';
      END IF;
    END IF;
    IF NEW."coverFileId" IS NOT NULL THEN
      SELECT * INTO f FROM stored_files WHERE id = NEW."coverFileId" FOR UPDATE;
      IF NOT FOUND OR f."organizationId" IS DISTINCT FROM NEW."organizationId" OR f.status <> 'READY' OR f.purpose <> 'ORGANIZATION_COVER' THEN
        RAISE EXCEPTION 'Cover requires a ready organization-owned image' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER avatars_ready_file BEFORE INSERT OR UPDATE ON user_avatars
FOR EACH ROW EXECUTE FUNCTION enforce_ready_file_binding();
CREATE TRIGGER branding_ready_files BEFORE INSERT OR UPDATE ON organization_branding
FOR EACH ROW EXECUTE FUNCTION enforce_ready_file_binding();

CREATE FUNCTION protect_file_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."organizationId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM memberships m JOIN organizations o ON o.id = m."organizationId"
      JOIN users u ON u.id = m."userId"
      WHERE m."organizationId" = NEW."organizationId" AND m."userId" = NEW."uploadedByUserId"
        AND m.status = 'ACTIVE' AND o.status IN ('DRAFT', 'ACTIVE') AND u.status NOT IN ('SUSPENDED', 'DELETED')
    ) THEN
      RAISE EXCEPTION 'Uploader must hold an active organization membership' USING ERRCODE = '23514';
    END IF;
    IF NEW."ownerUserId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM users WHERE id = NEW."ownerUserId" AND status NOT IN ('SUSPENDED', 'DELETED')
    ) THEN
      RAISE EXCEPTION 'Uploader account is unavailable' USING ERRCODE = '23514';
    END IF;
    IF NEW.status <> 'PENDING' OR NEW."scanStatus" <> 'PENDING' THEN
      RAISE EXCEPTION 'Files must start pending verification' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW."organizationId", NEW."ownerUserId", NEW.purpose, NEW.bucket, NEW."objectKey", NEW."uploadedByUserId", NEW."expectedBytes", NEW."declaredMimeType", NEW."expiresAt")
      IS DISTINCT FROM (OLD."organizationId", OLD."ownerUserId", OLD.purpose, OLD.bucket, OLD."objectKey", OLD."uploadedByUserId", OLD."expectedBytes", OLD."declaredMimeType", OLD."expiresAt") THEN
    RAISE EXCEPTION 'File ownership and reservation are immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'PENDING' AND NEW.status IN ('UPLOADED', 'EXPIRED', 'REJECTED')) OR
    (OLD.status = 'UPLOADED' AND NEW.status IN ('QUARANTINED', 'REJECTED', 'EXPIRED')) OR
    (OLD.status = 'QUARANTINED' AND NEW.status IN ('READY', 'REJECTED', 'EXPIRED')) OR
    (OLD.status IN ('READY', 'REJECTED', 'EXPIRED') AND NEW.status = 'DELETION_PENDING') OR
    (OLD.status = 'DELETION_PENDING' AND NEW.status = 'DELETED')
  ) THEN
    RAISE EXCEPTION 'Invalid file lifecycle transition' USING ERRCODE = '23514';
  END IF;
  IF NEW.status IN ('UPLOADED', 'QUARANTINED', 'READY') AND NEW.status <> OLD.status AND OLD."expiresAt" <= now() THEN
    RAISE EXCEPTION 'File reservation expired' USING ERRCODE = '23514';
  END IF;
  IF OLD.status = 'READY' AND (NEW.status <> 'READY' OR
      (NEW."scanStatus", NEW."actualBytes", NEW."verifiedMimeType", NEW.sha256, NEW."storageVersion", NEW.width, NEW.height, NEW."verifiedAt")
       IS DISTINCT FROM (OLD."scanStatus", OLD."actualBytes", OLD."verifiedMimeType", OLD.sha256, OLD."storageVersion", OLD.width, OLD.height, OLD."verifiedAt")) THEN
    IF EXISTS (SELECT 1 FROM user_avatars WHERE "fileId" = OLD.id)
       OR EXISTS (SELECT 1 FROM organization_branding WHERE "logoFileId" = OLD.id OR "coverFileId" = OLD.id) THEN
      RAISE EXCEPTION 'Detach file before changing verified content or status' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER files_lifecycle BEFORE INSERT OR UPDATE ON stored_files
FOR EACH ROW EXECUTE FUNCTION protect_file_lifecycle();

COMMIT;
