import { loadToolEnvironment } from '../src/config/tool-environment';
import { createDatabaseClient } from '../src/database/client';

const permissions = {
  ORG_VIEW: 'View organization settings',
  ORG_UPDATE: 'Update organization settings and branding',
  STAFF_MANAGE: 'Manage organization memberships and roles',
  BRANCH_MANAGE: 'Manage branches and branch access',
  PRODUCT_CREATE: 'Create catalog products',
  PRODUCT_UPDATE: 'Update catalog products and images',
  PRODUCT_DELETE: 'Archive catalog products',
  INVENTORY_VIEW: 'View inventory balances and movements',
  INVENTORY_ADJUST: 'Record inventory adjustments',
  PURCHASE_CREATE: 'Create purchases and their attachments',
  SALE_CREATE: 'Create sales and their attachments',
  SALE_VOID: 'Void eligible sales',
  SALE_REFUND: 'Record eligible sale returns and refunds',
  EXPENSE_CREATE: 'Record expenses',
  REPORT_VIEW: 'View operational reports',
  REPORT_PROFIT: 'View cost and profit reports',
  EXPORT_DATA: 'Export authorized business data',
  BILLING_MANAGE: 'Manage subscription and billing settings',
  FILE_UPLOAD: 'Reserve uploads within an authorized organization',
  FILE_READ: 'Read authorized organization files',
  FILE_DELETE: 'Delete eligible organization files',
  CUSTOMER_VIEW: 'View customer records',
  CUSTOMER_CREATE: 'Create customers',
  CUSTOMER_EDIT: 'Edit customer records',
  CUSTOMER_DELETE: 'Archive eligible customers',
  CUSTOMER_LEDGER_VIEW: 'View customer receivable ledgers and statements',
  CUSTOMER_PAYMENT_CREATE: 'Collect customer payments',
  SUPPLIER_VIEW: 'View supplier records',
  SUPPLIER_CREATE: 'Create suppliers',
  SUPPLIER_EDIT: 'Edit supplier records',
  SUPPLIER_DELETE: 'Archive eligible suppliers',
  SUPPLIER_LEDGER_VIEW: 'View supplier payable ledgers and statements',
  SUPPLIER_PAYMENT_CREATE: 'Record supplier payments',
  REPORT_RECEIVABLE_VIEW: 'View customer receivable reports',
  REPORT_PAYABLE_VIEW: 'View supplier payable reports',
  LEDGER_ADJUSTMENT_CREATE: 'Create approved ledger adjustments',
  LEDGER_REVERSAL_CREATE: 'Reverse eligible ledger events',
  PAYMENT_METHOD_MANAGE: 'Manage organization payment methods',
};

async function seed() {
  const config = loadToolEnvironment();
  const databaseUrl = config.MIGRATION_DATABASE_URL || config.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL or MIGRATION_DATABASE_URL is required.');
  const client = createDatabaseClient({ ...config, DATABASE_URL: databaseUrl });
  try {
    await client.$transaction(Object.entries(permissions).map(([code, description]) =>
      client.permission.upsert({ where: { code }, create: { code, description }, update: { description } })));
    console.log(`Seeded ${Object.keys(permissions).length} permission definitions. No users or credentials created.`);
  } finally {
    await client.$disconnect();
  }
}

void seed().catch(() => {
  console.error('Reference seed failed. Check database access and migration status.');
  process.exitCode = 1;
});
