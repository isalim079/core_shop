-- Run as the schema/migration owner after every migration.
-- Provision core_shop_runtime separately with a secret password; never use it for migrations.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO core_shop_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO core_shop_runtime;
GRANT INSERT, UPDATE, DELETE ON users, organizations, memberships, branches, roles,
  role_permissions, membership_roles, branch_grants, stored_files, user_avatars,
  organization_branding TO core_shop_runtime;
-- Reference permissions, migration history, and platform elevation stay read-only.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON permissions, platform_grants, _prisma_migrations FROM core_shop_runtime;
GRANT INSERT ON audit_events, command_records, outbox_events TO core_shop_runtime;
GRANT UPDATE ON command_records TO core_shop_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events, outbox_events FROM core_shop_runtime;
REVOKE DELETE, TRUNCATE ON command_records FROM core_shop_runtime;
-- Outbox dispatch state will be writable only by a separately scoped worker role.
