# LocalShop SaaS - Full Project Documentation

**Version:** 0.2  
**Status:** Architecture specification; implementation progress is tracked separately  
**Scope:** Product, Server, Web, App, Workflow, Security, Data, Operations

This updates the existing architecture baseline, preserving the modular monolith, tenant model, inventory ledger, costing, security and operational requirements. English/Bangla localization and receivable/payable Baki ledgers are core V1 scope. This specification is not evidence of implementation, audit or certification. See [server progress](../server/readme/serverProgress.md) and [mobile progress](../mobile_app/readme/mobileProgress.md) for verified status.

Navigation: [Server](#1-server) · [Web](#2-web) · [App](#3-app) · [Workflow](#4-workflow).

# 1. Server

## Document Control

| Field | Value |
| --- | --- |
| Project | LocalShop SaaS |
| Document | Full Product, Architecture, Security and Engineering Specification |
| Version | 0.2 (Bilingual UI and credit-ledger requirements) |
| Status | Proposed / Pre-implementation |
| Primary clients | Web application + React Native mobile application |
| Backend | Node.js + NestJS + Fastify/Express adapter |
| Primary database | PostgreSQL |
| ORM | Prisma |
| Caching / jobs | Redis + BullMQ |
| Tenant model | Multi-tenant SaaS with organization and branch isolation |

Purpose: establish the technical and business baseline before implementation. This document intentionally separates product rules from implementation details so the system can evolve without corrupting business data.

This is a design specification, not evidence that any component has already been implemented, audited, or certified.

## Product Vision

LocalShop is a multi-tenant SaaS platform for small and medium local businesses to manage sales, purchasing, products, stock, customers, suppliers, expenses, profit and operational reporting from web and mobile applications.

The product must support very different retail categories without creating a separate application for each category. The platform should provide a generic commerce core plus configurable capabilities such as variants, serial numbers, expiry tracking, batch tracking, barcode support and customer credit.

```text
Core idea

                    LocalShop SaaS
                           |
            +--------------+--------------+
            |                             |
     Commerce Core                 Shop Configuration
            |                             |
     sales / purchases          variants / expiry / serials
     inventory / payments       barcode / credit / branches
            |                             |
            +--------------+--------------+
                           |
                     Shop-specific UX
```

## Product Principles

- Tenant isolation is a first-class security boundary, not a frontend convention.
- Business events are modeled explicitly; inventory is based on a ledger rather than a single mutable quantity field.
- Profit is computed from auditable transaction and cost data, not hard-coded in screens.
- The same backend serves web and mobile clients.
- Mobile is offline-capable for the workflows where connectivity is unreliable.
- Free, Premium and future plans are controlled through entitlements instead of hard-coded plan checks.
- The platform operator does not have routine access to customer business data.
- Security is defense-in-depth: authentication, authorization, validation, network isolation, encryption, rate limiting, audit logs, monitoring and recovery.
- Start as a modular monolith; split components only when scaling or isolation requirements justify it.

- English and Bangla (বাংলা) are required in V1 across Web and App, including validation, financial screens and documents.
- Baki Hisab uses general receivable/payable ledger concepts. Translations never change business rules or stored enum codes.
- Customer Receivable means money customers owe the shop; Supplier Payable means money the shop owes suppliers. They are separate accounts, never implicitly netted.

## Scope and Non-Goals

| Area | V1 Scope | Explicit non-goal / later scope |
| --- | --- | --- |
| Identity | Registration, login, verification, password reset, sessions, roles | Enterprise SSO, advanced identity federation |
| Organization | One owner can manage one or more businesses/branches | Complex franchise network management |
| Catalog | Products, categories, brands, units, SKUs, barcodes, variants | AI catalog generation |
| Inventory | Ledger, stock balance, adjustments, transfers, low stock | Advanced warehouse optimization |
| Sales | Invoices, discounts, payments, credit, returns | Full accounting ERP |
| Purchasing | Suppliers, purchase receipts, purchase returns | Procurement marketplace |
| Finance | Gross profit, expenses, auditable customer receivables/supplier payables, aging and statements | Double-entry accounting / statutory tax filing |
| SaaS | Plans, entitlements, subscription state, ads flag | Full global billing platform at launch |
| Mobile | Offline sales/inventory flows, credit ledger, practical payment collection and sync | Full offline parity for every feature |
| Analytics | Operational dashboards and reports | Big-data warehouse at V1 |

## Users and Roles

| Role | Typical capabilities |
| --- | --- |
| Owner | Full organization control, reports, billing, staff, branches, settings |
| Admin | Operational administration without ownership/billing actions unless granted |
| Manager | Sales, inventory, purchases, staff operations, selected reports |
| Cashier | Create sales, accept payments, view required product/customer information |
| Inventory Manager | Products, stock, purchases, adjustments and transfers |
| Accountant / Finance | Expenses, payments, receivables/payables and financial reports |
| Platform Support | Account/support metadata and controlled break-glass actions; no routine business-data access |

Authorization should be permission-based underneath these role presets. Roles are bundles of permissions, not the authorization model itself.

```text
Example permissions

ORG_VIEW
ORG_UPDATE
STAFF_MANAGE
BRANCH_MANAGE
PRODUCT_CREATE
PRODUCT_UPDATE
PRODUCT_DELETE
INVENTORY_VIEW
INVENTORY_ADJUST
PURCHASE_CREATE
SALE_CREATE
SALE_VOID
SALE_REFUND
EXPENSE_CREATE
REPORT_VIEW
REPORT_PROFIT
EXPORT_DATA
BILLING_MANAGE
```

Extend the existing permission catalog and role bundles with these codes; do not introduce a second authorization system:

```text
CUSTOMER_VIEW CUSTOMER_CREATE CUSTOMER_EDIT CUSTOMER_DELETE
CUSTOMER_LEDGER_VIEW CUSTOMER_PAYMENT_CREATE
SUPPLIER_VIEW SUPPLIER_CREATE SUPPLIER_EDIT SUPPLIER_DELETE
SUPPLIER_LEDGER_VIEW SUPPLIER_PAYMENT_CREATE
REPORT_RECEIVABLE_VIEW REPORT_PAYABLE_VIEW
LEDGER_ADJUSTMENT_CREATE LEDGER_REVERSAL_CREATE PAYMENT_METHOD_MANAGE
```

`*_DELETE` permits the approved archive/deletion lifecycle only; referenced parties and posted financial records cannot be hard-deleted. Ledger viewing, payment creation, adjustment/reversal and financial exports require their own server-side checks. `EXPORT_DATA` supplements the report/ledger permission; it never replaces it. Branch grants narrow organization permissions. Owners/admins cannot bypass tenant boundaries.

## Multi-Tenant Architecture

The unit of isolation is the Organization (business account). A User can belong to multiple Organizations with different roles. An Organization can own multiple Branches. Business records should carry organization_id, and branch_id where branch-level scope applies.

```text
User
  |
  +---- Membership ----> Organization
                              |
                              +---- Branch
                              |
                              +---- Products
                              +---- Sales
                              +---- Purchases
                              +---- Inventory
                              +---- Customers
                              +---- Suppliers
                              +---- Expenses
                              +---- Settings
                              +---- Subscription
```

- Never trust organization_id from the request body or query string as proof of authorization.
- Resolve active organization and permissions from the authenticated session/token context.
- Every repository/service query must apply tenant scope unless the query is explicitly platform-scoped.
- Cross-tenant identifiers must not reveal whether another tenant has a record. Prefer consistent not-found/forbidden behavior.
- Database-level protections such as PostgreSQL Row-Level Security may be evaluated as a defense-in-depth layer for high-risk tables, but application authorization remains mandatory.

## Technology Architecture

| Layer | Technology | Reason |
| --- | --- | --- |
| Web | React + TypeScript | Mature component ecosystem and strong developer productivity |
| Web state | Redux Toolkit + RTK Query | Server cache + predictable client state |
| Mobile | React Native + TypeScript | Shared language and backend contracts with web |
| Mobile local storage | SQLite | Offline-first transactional local data |
| Backend | Node.js + NestJS | Modular architecture, dependency injection, structured modules |
| HTTP adapter | Fastify preferred; Express acceptable | Performance and ecosystem compatibility |
| Database | PostgreSQL | Transactions, constraints, relational reporting and strong data integrity |
| ORM | Prisma | Typed database access and migration workflow |
| Cache / queue | Redis + BullMQ | Caching, rate limiting support, background jobs |
| Storage | S3-compatible object storage | Private product images, exports and documents |
| Reverse proxy | Nginx | TLS termination, routing, rate limiting and security headers |
| Runtime | Docker | Repeatable deployment and resource control |

The architecture should avoid unnecessary microservices. The initial production system should be a modular monolith with background workers. PDF generation, notifications or analytics can be separated later without redesigning the domain model.

## High-Level System Architecture

```text
                         INTERNET
                            |
                    CDN / WAF / DDoS
                            |
                        Nginx / TLS
                            |
                 +----------+----------+
                 |                     |
              React Web          React Native App
                 |                     |
                 +----------+----------+
                            |
                       NestJS API
                            |
         +------------------+------------------+
         |                  |                  |
    PostgreSQL            Redis             Storage
         |                  |                  |
         |              BullMQ Workers         |
         |                  |                  |
         +------------------+------------------+
                            |
                    Observability / Audit

Key boundary: PostgreSQL is private. Customer business data is tenant-scoped.

```

## Backend Module Architecture

```text
src/
  common/
    config/
    errors/
    guards/
    interceptors/
    pipes/
    decorators/
    logging/
    crypto/
    pagination/

  auth/
  users/
  organizations/
  memberships/
  branches/

  catalog/
    products/
    variants/
    categories/
    brands/
    units/

  inventory/
  sales/
  purchases/
  returns/
  payments/                  # methods, collections/disbursements, allocations
  ledger/                    # receivable/payable posting, projections, reversals
  localization/              # locale negotiation, error/document catalogs
  customers/
  suppliers/
  expenses/

  reports/
  analytics/

  subscriptions/
  entitlements/
  billing/
  ads/

  notifications/
  audit/
  exports/
  files/
  sync/

  health/
  admin/

```

Controllers should be thin. Business rules belong in domain/application services. Data access should be isolated behind repositories or query services. Cross-module actions should be explicit transactions or application-level commands rather than hidden side effects.

## Core Domain Model

| Entity | Core purpose | Important fields |
| --- | --- | --- |
| User | Human identity | id, email/phone, password_hash, status, preferred_language (en/bn) |
| Organization | Tenant/business | id, name, owner_id, status, settings |
| Membership | User-to-organization access | user_id, organization_id, role_id, status |
| Branch | Physical/virtual shop location | organization_id, name, code, address, status |
| Role / Permission | Authorization | role_id, permission_code |
| Product | Catalog item family | organization_id, name, category_id, brand_id, base settings |
| ProductVariant | Sellable SKU/variation | product_id, sku, barcode, attributes, price, cost policy |
| Category | Product grouping | organization_id, parent_id, name |
| Brand | Brand grouping | organization_id, name |
| Unit | Measurement/sale unit | organization_id, name, symbol, precision |
| Customer | Buyer profile | organization_id, contact fields, credit settings |
| Supplier | Seller/source | organization_id, contact fields, credit terms; payable is derived |
| Sale | Commercial sale header | organization_id, branch_id, invoice_no, totals, status |
| SaleItem | Sale line | sale_id, variant_id, quantity, unit_price, discount, cost_snapshot |
| Purchase | Inventory acquisition header | organization_id, branch_id, supplier_id, status |
| PurchaseItem | Purchase line | purchase_id, variant_id, quantity, unit_cost |
| LedgerAccount | One customer receivable or supplier payable account per currency | organization_id, customer_id XOR supplier_id, account_kind, currency |
| LedgerEntry | Immutable signed financial event | account_id, sequence, amount_delta, kind, effective_at, posted_at, actor_id, source FK, reversal_of, reason, note |
| LedgerBalance | Rebuildable projection, never customer/supplier truth | account_id, balance, last_sequence, version |
| OpenItem | Invoice/opening/adjustment obligation for allocation and aging | account_id, debit_entry_id, due_date, original_amount; remaining derived from settlements |
| PaymentMethod | Organization-configured method | organization_id, code, category, display_name, active |
| Payment | Immutable money movement | organization_id, branch_id, account_id where credit-related, method_id, amount, currency, direction, reference, occurred_at, actor_id, command_id |
| PaymentAllocation | Explicit payment-to-obligation settlement | payment_id, open_item_id, amount, reversal_of, actor_id, timestamp |
| LedgerSettlement | Non-cash credit-to-obligation settlement | credit_entry_id, open_item_id, amount, reversal_of, actor_id |
| Expense | Operating expense | category, amount, branch, date |
| InventoryTransaction | Immutable stock movement | type, quantity, unit_cost, reference |
| InventoryBalance | Materialized/current stock view | branch_id, variant_id, quantity, reserved |
| Subscription | Organization plan state | plan_id, status, start/end, provider_reference |
| Entitlement | Resolved feature/limit | organization_id, feature_code, value |
| AuditEvent | Security/business audit trail | actor, action, target, metadata, timestamp |

## Product and Variant Model

A Product represents a conceptual catalog item; a ProductVariant represents a sellable SKU. A product may have one default variant or multiple variants.

```text
Product
  name: "T-Shirt"
  category: "Clothing"
      |
      +-- Variant A: SKU=TS-BLK-M, color=Black, size=M
      +-- Variant B: SKU=TS-BLK-L, color=Black, size=L
      +-- Variant C: SKU=TS-WHT-M, color=White, size=M

Pet example
  Product: Dog Food
      +-- Variant: 1kg
      +-- Variant: 5kg
      +-- Variant: 10kg

Electronics example
  Product: USB Cable
      +-- Variant: USB-C, 1m
      +-- Variant: USB-C, 2m
```

Do not create dozens of nullable columns for industry-specific properties. Use normalized fields for high-value operational attributes and a controlled flexible attributes object for long-tail attributes. Important fields that affect stock identity must be represented explicitly in the SKU/variant model.

## Inventory Architecture

Inventory is ledger-driven. The current stock balance is a derived/materialized state that is updated inside a transaction whenever an inventory-affecting event occurs.

```text
InventoryTransaction

OPENING_STOCK       + quantity
PURCHASE            + quantity
SALE                - quantity
SALE_RETURN         + quantity
PURCHASE_RETURN     - quantity
ADJUSTMENT_IN       + quantity
ADJUSTMENT_OUT      - quantity
DAMAGE              - quantity
TRANSFER_OUT        - quantity
TRANSFER_IN         + quantity

InventoryBalance
  quantity = sum(all applicable movements)

Invariant:
  A sale must not reduce stock without an inventory transaction.
  A stock adjustment must always carry an actor/reason/reference.

```

- Use an immutable inventory transaction record for auditability.
- Do not let clients directly update inventory_balance.quantity.
- Use database transactions when changing sale/purchase/payment records together with inventory.
- Support branch-level stock and branch transfers.
- Allow negative stock only if the organization setting explicitly enables it; default should be disabled.
- Low-stock alerts should be based on reorder level and available quantity, not only physical quantity.

## Costing and Profit Rules

Recommended default costing method: weighted average cost. This gives a practical balance between accuracy and implementation complexity for small retail businesses. FIFO can be introduced later if there is a validated business need.

```text
Example

Purchase 1: 10 units @ 100 = 1,000
Purchase 2: 10 units @ 130 = 1,300

Total units = 20
Total cost  = 2,300
Average cost = 115

Sell 5 units @ 200
Revenue = 1,000
COGS    = 575
Gross profit = 425
Gross margin = 42.5%
```

A SaleItem should store a cost snapshot or a stable reference to the cost used for that sale. Historical profit must not change merely because a later purchase changes the current average cost.

```text
Gross Revenue
  - Sales discounts
  - Returns / refunds
  = Net Sales

Net Sales
  - COGS
  = Gross Profit

Gross Profit
  - Operating Expenses
  = Operating/Net Profit (management view)
```

Tax treatment must be configurable and should not be hard-coded to one country. Local regulatory accounting/tax compliance should be added as a separate workstream if the product enters a regulated market.

## Accounts, Credit Ledger and Payments (Baki Hisab)

Customer Receivable is money customers owe the shop. Supplier Payable is money the shop owes suppliers. Both are core V1 subledgers, alongside the existing inventory ledger; this does not expand scope into a full general-ledger ERP. Never model Baki as a mutable `customer.due_amount` or `supplier.due_amount`.

### Relationships and storage

```text
Organization → Customer → LedgerAccount (RECEIVABLE, currency)
Organization → Supplier → LedgerAccount (PAYABLE, currency)
LedgerAccount → LedgerEntry → OpenItem (when creating an obligation)
LedgerAccount → LedgerBalance (rebuildable projection)
Payment → PaymentAllocation → OpenItem
Credit LedgerEntry → LedgerSettlement → OpenItem
Sale/Purchase/Return → explicitly constrained source LedgerEntry
```

Use one ledger engine with account kinds, shared posting rules and separate customer/supplier query views. `CustomerLedgerEntry` and `SupplierLedgerEntry` may be views of `LedgerEntry`; they must not duplicate business logic. Account ownership uses exactly one scoped customer or supplier FK and a matching account-kind CHECK. Unique `(organization_id, party_id, account_kind, currency)` prevents duplicate accounts. All tenant relationships use composite tenant FKs. An account aggregates across branches; each event retains its branch so authorized branch reports can be derived. A branch subtotal must be labeled as such rather than advertised as the organization's full account balance.

Each entry has an opaque ID, tenant/account, account-local monotonic sequence, stable event kind, exact signed amount, currency, business/effective time, server posting time, actor, originating command, reference/invoice number, optional note, and explicit source/reversal relationships. Use constrained sale/purchase/return/payment/opening/adjustment source FKs with a CHECK for permitted combinations, rather than an unchecked polymorphic ID. Unique source-event constraints prevent posting a source twice. Payments link to their source entry, method and allocations; anonymous fully paid sales can keep direct sale-payment bindings without creating a fictitious customer.

Posted amounts use exact decimal arithmetic and API decimal strings. Currency is organization-configured; examples use BDT/৳. Never sum accounts in different currencies without an explicit FX/reporting policy. User-entered names and notes stay in their original Unicode language. `SALE`, `PURCHASE`, `PAYMENT`, `CUSTOMER`, `RECEIVABLE`, `PAYABLE` and event codes remain language-independent.

### Signs, balances and event coverage

For either account kind, a positive delta increases what is owed in that account's direction; a negative delta decreases it. This sign convention is a subledger convention, not general-ledger debit/credit accounting terminology.

| Event | Customer receivable | Supplier payable |
| --- | --- | --- |
| Opening amount owed | Positive | Positive |
| Full posted sale / purchase | Positive sale total | Positive purchase total |
| Payment received / payment to supplier | Negative | Negative |
| Sales return / purchase return | Negative eligible return | Negative eligible return |
| Extra charge / debit-credit adjustment | Explicit signed effect, reason and approval | Explicit signed effect, reason and approval |
| Discount / write-off / concession | Negative approved amount | Negative approved amount |
| Reversal | Exact opposite of linked original | Exact opposite of linked original |

Forms must say “increase receivable/payable” or “decrease receivable/payable” even when displaying debit/credit terminology. Opening balances are dated, audited entries with due dates or an explicit unknown-due-date designation. Discounts included in an invoice total are not posted again. Later concessions are adjustment entries with non-cash settlements. Every event records notes where supplied, timestamps, actor and reference.

Post the **full document amount plus the full payment separately**, avoiding net-due double counting:

```text
Customer: sale +2,500; payment received -1,000 → due 1,500
Later payment -500 → due 1,000
Supplier: purchase +50,000; payment to supplier -20,000 → payable 30,000
Later supplier payment -10,000 → payable 20,000

Rahim:
Opening balance                 +2,000 → 2,000
Oct 10 sale                     +1,500 → 3,500
Oct 10 payment                    -500 → 3,000
Oct 12 sale                     +2,000 → 5,000
Oct 15 payment                  -1,000 → 4,000
```

Current signed balance = sum of all posted `amount_delta`, including reversals. Outstanding = max(balance, 0); a negative balance is a separately shown customer advance/supplier credit, never silently clamped away or netted across unrelated parties. Default V1 payment validation rejects amounts beyond outstanding unless explicit advance/refund policy is enabled. Returns may produce credits even when advances are otherwise disabled; show unapplied credit and require an authorized later settlement/refund.

Running posting balance is the prefix sum ordered by server account sequence. A statement sorted by effective date uses `(effective_at, sequence)` and derives its opening balance from entries before the period. Backdating requires permission, records both timestamps, and causes affected historical reports to be recalculated. Never present a stored posting-order balance as an effective-date running balance. Statements show opening balance, each entry, reference/notes, increases/decreases, running balance, period totals and closing/current balance with scope and as-of timestamp.

### Atomic posting and concurrency

One database transaction must validate authorized tenant/branch/party and policy; claim the idempotency key; lock affected accounts, source documents/open items, payment and stock rows in deterministic order; validate remaining eligible quantities/amounts; write document/items, inventory/cost effects, ledger entries, payments, allocations, projections, audit, outbox and command result; then commit. Any failure rolls back every effect. Use serializable transactions or explicit locks plus uniqueness constraints and bounded serialization/deadlock retries. Concurrent collections must not both consume the same outstanding amount. Create accounts safely under a unique constraint before locking them.

Invoice/payment receipts and reminder jobs are generated after commit from outbox events, never sent inside the transaction. A sale, payment or return cannot succeed with only part of its stock/financial effect. Online and offline submissions use the same server command handler.

`LedgerBalance` is a projection updated atomically with sequence/version. It cannot be edited directly. Reconciliation periodically compares it to immutable entries and open-item net position; drift alerts operators and repairs only the derived projection through an audited process. Do not change historical entries to reconcile a cache.

### Payments, allocations and corrections

Payment methods are configurable per organization. Seed categories `CASH`, `BANK`, `CARD`, `MOBILE_FINANCIAL_SERVICES`, `OTHER`, allowing multiple named methods within categories (including Bangladesh mobile financial services). Archive methods instead of breaking historical references. This records a cash/money movement; it does not imply an online payment-provider charge.

A customer collection of 2,000 against due 5,000 posts one incoming Payment, one -2,000 entry and allocations, leaving 3,000. Supplier payments mirror this with outgoing direction. Validate positive amount, currency, active method, party, date and optional external reference. Never log account credentials or unnecessary payment references.

Allocate explicitly to selected open invoices, or deterministically oldest due date then effective date and ID; unknown due dates sort last. Opening balances and positive adjustments can also form open items. Allocations cannot exceed either the payment's available amount or the obligation's remaining amount. Lock both sides. Allocations explain settlement and aging; they do **not** create an additional balance reduction after the payment entry. Unallocated payment credit remains visible; cash totals count the Payment once, regardless of allocation count. Use explicit scoped links compatible with existing sale-payment/purchase-payment relationships.

A return posts a negative ledger event and non-cash settlement against its original eligible obligation, releasing/reallocating prior settlements with append-only reversal records where necessary. A refund posts the opposite cash direction and a positive ledger effect against available credit, so returning an already-paid item and refunding cash does not leave a false negative balance. Purchase returns/refunds mirror this. Validate original quantity/value and prevent duplicate/excess return or refund. Financial posting is atomic with any inventory reversal.

Posted entries, payments and settlements are immutable. Corrections create linked reversals plus replacement/adjustment entries, reason, actor and timestamp; reversing a payment reverses its allocations and reopens the eligible obligations in the same transaction. Never silently edit/delete a posted entry or allocation. Drafts may be edited before posting. Use restricted runtime privileges or database protections for append-only tables, and audited dedicated reversal commands.

### Aging and reminders

Store invoice terms/due date at posting, separate from transaction time. Payment/non-cash settlement allocation determines remaining open-item debt. At an organization-local as-of date, derive not-yet-due, due today, overdue and configurable aging buckets (initially 1–30, 31–60, 61–90, 90+ days); “due for X days” uses that due date, not customer creation time. Unknown due dates appear in a separate bucket. Long-overdue thresholds are organization settings. Historical aging uses only events/settlements effective by the as-of cutoff, including reversals effective by then. Show gross unpaid items and unapplied credits separately, reconciling their net to the ledger balance.

V1 includes in-app due lists/filtering and reminder eligibility: Rahim 5,000 / 18 days overdue; Karim 2,500 / 7 days overdue; Jamal 1,200 / due today. Future channels use provider-neutral adapters for WhatsApp, SMS, email, shareable statements and payment links. External delivery/provider integrations are optional until selected. Preserve existing account-verification/notification scope. Jobs must recheck current due and access, respect contact consent/preferences and quiet hours, and deduplicate by tenant/account/open item/channel/reminder window. Avoid placing financial details in push previews or logs. Future share/payment links must be scoped, expiring, revocable and expose only authorized data.

## Expenses and Financial Reporting

- Keep inventory purchases separate from operating expenses.
- Expense categories should be configurable per organization.
- Reports should provide daily, weekly, monthly and custom periods.
- Profit reports should explain the inputs: sales, discounts, returns, COGS and expenses.
- Reports should carry the selected branch and date scope so users can reconcile numbers.

Receivable/payable reports must reconcile with the credit subledger and distinguish cash collections from credit sales. Collecting debt is not new sale revenue; supplier payment is not a second purchase expense.

## SaaS Plans, Entitlements and Ads

The pricing system should not be coded as scattered if/else checks. Plans resolve into entitlements and limits.

```text
Plan
  FREE
    MAX_BRANCHES = 1
    MAX_PRODUCTS = 500
    MAX_STAFF = 2
    ADVANCED_REPORTS = false
    ADS_ENABLED = true

  PREMIUM
    MAX_BRANCHES = configurable
    MAX_PRODUCTS = configurable
    MAX_STAFF = configurable
    ADVANCED_REPORTS = true
    ADS_ENABLED = false

Entitlement resolver
  organization -> current subscription -> plan -> features/limits
```

The exact limits should be business decisions and should be configurable without a database migration whenever practical.

## Authentication and Authorization Security

- Password storage: Argon2id or another modern password hashing scheme; never reversible encryption.
- Short-lived access credentials plus refresh-token rotation/revocation strategy.
- Web session secrets should use secure, HttpOnly, appropriately SameSite cookies where the chosen architecture uses cookie-based sessions.
- Mobile secrets should use platform secure storage.
- Email/phone verification before sensitive account actions.
- Password reset tokens should be random, single-use, short-lived and stored as hashes where feasible.
- MFA should be part of the security roadmap, especially for organization owners and platform operators.
- Authorization should be permission-based and tenant-aware.
- Critical operations should require elevated permission and generate audit events.

## Data Protection and Encryption

| Data | Protection |
| --- | --- |
| Passwords | Argon2id hash + unique salt; never decryptable |
| TLS traffic | HTTPS/TLS for all external traffic; disable plaintext production endpoints |
| Database at rest | Encrypted storage/volume plus protected backups |
| Sensitive personal/business fields | Application-level authenticated encryption where justified |
| Encryption keys | Managed separately from application data; rotate according to policy |
| Backups | Encrypted, access-controlled, retention policy, restore testing |
| Logs | Redact tokens, passwords, secrets and unnecessary sensitive business values |

Important boundary: full end-to-end encryption is not recommended for the entire business dataset because the server must calculate inventory, sales and reports. Instead, use least-privilege access, strong tenant isolation and field-level encryption for data that deserves additional protection.

A stronger option is per-organization data-encryption keys. The service can retrieve/decrypt only when a server-side business operation requires it, while key-management permissions remain separate from ordinary application access.

## SQL Injection and Input Security

- Use Prisma parameterized access for normal queries.
- For raw SQL, require parameter binding; never interpolate untrusted strings.
- Allowlist sort fields, filter fields and query operators.
- Validate every request DTO, including pagination and batch endpoints.
- Apply length limits and reasonable numeric ranges.
- Do not rely on frontend validation for security.
- Use database constraints as a final integrity layer.

## Brute Force, Abuse and Rate Limiting

| Endpoint class | Controls |
| --- | --- |
| Login | IP + account throttling, progressive delay, suspicious-attempt detection |
| OTP / verification | Strict per-destination and per-IP limits |
| Password reset | Strict limits, generic response messages |
| Exports/reports | Permission checks, queueing, concurrency limits |
| Public/search endpoints | IP/user rate limits and caching where applicable |
| Write-heavy APIs | Authenticated user + organization limits |

Rate limiting is not a replacement for DDoS protection. Volumetric attacks should be filtered upstream of the VPS using an edge provider/WAF when scale or risk justifies it.

## Error Handling

```text
Client-facing error shape

{
  "success": false,
  "error": {
    "code": "SALE_STOCK_INSUFFICIENT",
    "message": "Insufficient stock for one or more items.",
    "requestId": "..."
  }
}

Never expose:
- database connection strings
- SQL statements
- stack traces
- file paths
- internal service names
- access tokens
- encryption keys
- raw exception objects
```

A global exception filter should convert known domain errors into stable error codes and unknown errors into a generic response. The requestId should allow support/observability systems to correlate the failure without exposing internals.

Return stable error and field codes with safe parameters, e.g. `PAYMENT_EXCEEDS_OUTSTANDING`, `LEDGER_ALREADY_REVERSED`, `IDEMPOTENCY_PAYLOAD_MISMATCH`. Clients map these codes to English/Bangla translation keys; optional server messages negotiate `en`/`bn` and fall back to English. Never use localized prose as a machine-readable contract. Validate and translate currency/date values at the presentation boundary.

## Audit Logging

- Authentication events: login success/failure, password change, session revoke, MFA change.
- Authorization/admin events: role change, membership change, branch access change.
- Business events: sale void, sale refund, stock adjustment, purchase return, expense deletion.
- Data export events: who requested the export, what scope, whether it completed.
- Security events: suspicious rate limit activity, blocked requests, permission failures.

Audit logs should be append-oriented and protected from ordinary users. Retention should follow the product policy and legal requirements applicable to the market.

Audit ledger opening/posting, collection/disbursement, allocation/reversal, adjustments, backdating, payment-method changes, statement exports and language-preference changes where relevant. Keep actor, tenant/branch, source IDs, reason, command and timestamps. Redact diagnostic logs; controlled audit records retain only necessary evidence under the existing retention/access policy.

## Platform Operator Privacy Model

Normal platform staff should not have direct customer transaction-data access. The administrative console should expose account-level operational information rather than unrestricted tenant data.

```text
Platform Admin Console

Allowed by default:
  account status
  subscription state
  plan
  billing status
  health
  aggregate product metrics
  support tickets
  security events

Restricted / unavailable by default:
  full sales history
  customer contact list
  supplier list
  detailed profit reports
  employee data
  raw database browsing

Break-glass support path (exceptional):
  explicit reason
  elevated authentication
  time-limited access
  narrow tenant scope
  complete audit event
```

The platform operator must also adopt an internal access policy. Application architecture alone cannot prevent a privileged infrastructure administrator from reading a production database if the operating environment itself is compromised.

## API Conventions

| Topic | Standard |
| --- | --- |
| Versioning | /api/v1/... |
| Authentication | Access token/session + refresh strategy |
| Identifiers | Opaque UUIDs or equivalent non-sequential public IDs |
| Pagination | Cursor preferred for large datasets; offset acceptable for small admin lists |
| Sorting | Allowlisted fields only |
| Filtering | Explicit DTO/query schema |
| Idempotency | Required for payment-sensitive or retry-prone commands where appropriate |
| Errors | Stable application error codes + requestId |
| Dates | ISO 8601 over API; store UTC; render in user/business timezone |
| Money | Decimal/numeric semantics; never floating-point for financial totals |
| API docs | OpenAPI generated from NestJS contracts |

## Example API Surface

```text
Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

Organizations
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id

Products
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id
POST   /api/v1/products/:id/archive

Sales
GET    /api/v1/sales
POST   /api/v1/sales
GET    /api/v1/sales/:id
POST   /api/v1/sales/:id/void
POST   /api/v1/sales/:id/refund

Purchases
GET    /api/v1/purchases
POST   /api/v1/purchases
GET    /api/v1/purchases/:id
POST   /api/v1/purchases/:id/return

Inventory
GET    /api/v1/inventory/balances
GET    /api/v1/inventory/ledger
POST   /api/v1/inventory/adjustments
POST   /api/v1/inventory/transfers

Reports
GET    /api/v1/reports/sales
GET    /api/v1/reports/profit
GET    /api/v1/reports/inventory
GET    /api/v1/reports/expenses
```

The exact API should be contract-first and generated into shared TypeScript types or a client package where practical. Breaking changes should require an API versioning decision.

Extend the same versioned contract (planned endpoints, not implemented claims):

```text
GET/PATCH /api/v1/users/me/preferences                # preferredLanguage: en | bn
GET/POST  /api/v1/customers
GET/PATCH /api/v1/customers/:id
POST      /api/v1/customers/:id/archive
GET       /api/v1/customers/:id/ledger
GET       /api/v1/customers/:id/statement
POST      /api/v1/customers/:id/payments
GET/POST  /api/v1/suppliers
GET/PATCH /api/v1/suppliers/:id
POST      /api/v1/suppliers/:id/archive
GET       /api/v1/suppliers/:id/ledger
GET       /api/v1/suppliers/:id/statement
POST      /api/v1/suppliers/:id/payments
GET/POST  /api/v1/payment-methods
PATCH     /api/v1/payment-methods/:id
POST      /api/v1/ledger/accounts/:id/opening-balance
POST      /api/v1/ledger/accounts/:id/adjustments
POST      /api/v1/ledger/entries/:id/reverse
POST      /api/v1/payments/:id/reverse
POST      /api/v1/payments/:id/allocations
GET       /api/v1/reports/receivables
GET       /api/v1/reports/payables
GET       /api/v1/reports/aging
GET       /api/v1/reports/payment-collections
GET       /api/v1/reports/credit-sales
GET       /api/v1/reports/purchase-payables
GET       /api/v1/reminders/due
POST      /api/v1/exports                           # statement/report/receipt jobs
POST      /api/v1/sync/commands
GET       /api/v1/sync/commands/:commandId
GET       /api/v1/sync/changes
```

Ledger/statement reads accept bounded date range, authorized branch, cursor and as-of filters; include opening/closing balance, totals, exact decimal entries, source references and snapshot watermark. Payment commands carry stable command/idempotency IDs, amount decimal string, method ID, event time and optional selected obligation allocations; derive tenant and actor from authentication. Responses include payment/entry/allocation IDs, authoritative balance, account version and receipt reference. Do not accept arbitrary client-created ledger rows or balance updates. Archive/delete rules apply from the permission section. Schema/OpenAPI must describe required permissions, 409 conflicts, 422 business validation, language and safe error parameters.

## Idempotency and Duplicate Prevention

Mobile applications can retry requests because of intermittent connectivity. Payment and sale commands therefore need duplicate-prevention semantics.

```text
Client
  POST /sales
  Idempotency-Key: 0d7...
        |
        v
Server stores command result by key + tenant + actor
        |
        +-- first request -> execute
        +-- retry        -> return original result

Use similar semantics for payment capture and other high-risk commands.
```

Financial keys are unique within tenant + actor + operation (including the target account) and map to a canonical payload hash and durable command result. Reusing a key with a different payload returns a conflict. Two concurrent first requests serialize via database uniqueness/locking. Completed retries return the original authorized result even after timeout/restart; in-flight retries return a documented pending/retry response. Persist result and financial writes in the same transaction. Recheck current membership/permission before revealing stored results.

Offline command IDs and source-event uniqueness provide durable duplicate protection beyond any short-lived HTTP response cache. Do not expire the only deduplication record while a retained device command can replay. A changed retry requires an explicit new command after the original is known rejected/corrected. Apply the same rules to reversals, allocations and return/refund commands; never deduplicate solely by amount/time/name.

## Reporting Model

| Report | Key dimensions / measures |
| --- | --- |
| Daily Sales | date, branch, cashier, revenue, discounts, returns, net sales |
| Product Performance | SKU, units sold, revenue, COGS, gross profit, margin |
| Inventory | SKU, on hand, reserved, reorder level, stock value |
| Purchasing | supplier, products, quantity, purchase value |
| Expenses | category, branch, amount, date |
| Receivables | customer, original due, paid, outstanding, aging |
| Profit | net sales, COGS, gross profit, expenses, management profit |

Reports should be built from transactionally correct source data. Performance optimizations can use materialized summaries or reporting tables later, but they must be reproducible from source records.

The following are required baseline finance reports, in addition to existing sales/profit/inventory/purchasing/expense reports:

| Report | Content |
| --- | --- |
| Total customer receivables | As-of net position, gross debt and customer advances separately |
| Total supplier payables | As-of net position, gross debt and supplier credits separately |
| Customer-wise outstanding | Customer, opening, increases, settlements, closing outstanding |
| Supplier-wise outstanding | Supplier, opening, increases, settlements, closing payable |
| Aging | Unpaid open items, due today, overdue buckets, unknown due date, credits, as-of date |
| Payment collection | Customer receipts by date, branch, collector, method; reversals/refunds explicit |
| Credit sales | Posted sales with unpaid amount at posting, current outstanding separately |
| Purchase payable | Purchases, upfront payments, remaining payable and later settlements |
| Customer statement | Opening + ordered ledger entries + closing with references and running balances |
| Supplier statement | Opening + ordered ledger entries + closing with references and running balances |

Support date/as-of ranges, customer/supplier, authorized branch, method and applicable status filters. Use consistent business timezone, currency and snapshot watermark for pagination/exports; include prior-period opening balances rather than treating range totals as current debt. Show historical as-of debt separately from current outstanding. All reports support English/Bangla headings, dates/numbers and print/export selection; UGC stays unchanged. Reconcile collections, allocations, returns and adjustments without counting the same payment per allocation. Large jobs follow the existing BullMQ export architecture and reauthorize access when downloading.

## Search and Performance

- Use PostgreSQL indexes for organization_id, branch_id, SKU, barcode, date and common foreign keys.
- Avoid unbounded queries; every list endpoint needs pagination.
- Search should use indexed patterns and dedicated full-text/trigram techniques when required.
- Cache read-heavy, low-volatility reference data in Redis where measurement shows benefit.
- Large report generation should move to BullMQ jobs and return a job status.
- Use database query analysis and slow-query monitoring before adding infrastructure complexity.

Bangla input/search is mandatory across names, categories, brands, addresses, notes and financial references where applicable. Use UTF-8 end to end (PostgreSQL, JSON, SQLite, exports). Preserve original display text; normalized NFC shadow search values may be indexed consistently in both server and SQLite. Do not strip Bangla vowel signs, conjuncts or combining marks as “punctuation.” Validate by character/grapheme-aware UX and bounded storage sizes, not ASCII-only regexes. Start with bounded Unicode substring/prefix matching and measured indexes/trigrams; do not assume an English text-search stemmer handles Bangla. Parameterize queries, escape wildcard patterns where needed and test মোঃ রহিম, ঢাকা ট্রেডার্স and রুপচাঁদা মাছ on both clients and offline caches.

## File and Image Storage

```text
Private object storage
  /organizations/{orgId}/products/{productId}/...
  /organizations/{orgId}/exports/...

Database stores metadata only:
  objectKey
  size
  contentType
  checksum
  owner/tenant
  createdBy

Access:
  short-lived signed URLs after authorization
```

### Bilingual receipts, invoices and statements

Document mode is `en`, `bn` or `en-bn`, separate from the UI language. Use translation keys for all template headings, totals, paid, due, notes labels, return/reversal status and ledger columns; retain user-entered store/product/party names and address exactly as entered. Bilingual mode pairs both labels and uses one set of financial values. Do not fabricate translated customer/product names. Persist document language/template version and original financial snapshots for reproducible regeneration; include scope, currency, business timezone, invoice/payment number and issued/as-of times.

```text
ABC GENERAL STORE
ঢাকা, বাংলাদেশ
Invoice / চালান: INV-1024        Date / তারিখ: 16 Oct 2026
Product / পণ্য       Qty / পরিমাণ       Amount / মূল্য
Rice                       2                    ৳160
Oil                        1                    ৳180
Total / মোট                                     ৳340
Paid / পরিশোধিত                                 ৳200
Due / বাকি                                      ৳140
```

Support English receipt, Bangla receipt and English + Bangla receipt, plus customer/supplier statement print and export. This is core scope; richer export customization can remain later. PDF/thermal/HTML rendering must embed or select licensed Bangla-capable fonts with shaping/conjunct support; test clipping/wrapping and ৳ on printers and Android/iOS share previews. Spreadsheet exports must preserve Unicode and prevent formula injection from UGC. Store private generated files with tenant scope and reauthorize signed downloads. Retrying an export must not post any financial transaction.

## Background Jobs

| Queue | Examples |
| --- | --- |
| reports | Large PDF/CSV report generation |
| notifications | Low-stock alerts, subscription messages |
| files | Image processing, antivirus scan, cleanup |
| billing | Subscription synchronization and retries |
| maintenance | Data cleanup and scheduled aggregation |

Receivable/payable aging refresh and in-app due reminder eligibility use the maintenance/notifications queues. Document jobs receive explicit `en`/`bn`/`en-bn` mode and immutable snapshot/version references; user preference changes after enqueue do not unpredictably change an already requested export. Optional external reminder adapters use outbox delivery keys, current balance checks and bounded retry; they do not become mandatory V1 integrations.

## Observability

- Structured application logs with correlation/request IDs.
- Metrics for request rate, error rate, latency, queue depth, database health and worker failures.
- Health endpoint for process/dependency liveness; readiness endpoint for ability to serve traffic safely.
- Centralized error tracking with sensitive-data scrubbing.
- Audit events kept separate from noisy diagnostic logs.

```text
/health
  process alive

/ready
  database reachable
  required dependencies available
  migrations/schema compatible

A container that is alive but cannot talk to the database should not be treated as ready.
```

## Infrastructure and Deployment

```text
Production

Internet
  -> Edge/WAF
  -> Nginx
  -> app container(s)
  -> worker container(s)
  -> Redis
  -> PostgreSQL (private)
  -> object storage

Container limits should be explicit.
Application should scale horizontally once load justifies it.
Database and storage scaling should be planned independently.
```

- Separate staging and production environments.
- Never copy production secrets into source control.
- Use GitHub Actions or equivalent CI for test/build/security checks.
- Use immutable image tags for production deployments rather than deploying arbitrary latest tags.
- Keep infrastructure configuration version controlled, excluding secrets.
- Use automated backups and verify restoration.

## Environment and Secrets Management

| Secret/config | Rule |
| --- | --- |
| JWT/session secret | Generated randomly; never committed; rotate safely |
| Database credentials | Environment/secret manager; separate per environment |
| Encryption keys | Managed separately from ordinary app config |
| Storage credentials | Least privilege; private bucket |
| Payment provider keys | Secret manager; scoped permissions |
| Third-party API keys | Separate staging/prod keys |

## Database Backup and Recovery

1. Automated backups on a defined schedule.
2. Encrypted backup storage with restricted access.
3. Retention policy covering accidental deletion and operational recovery.
4. Point-in-time recovery where the chosen PostgreSQL deployment supports it and the business requires it.
5. Periodic restore test into an isolated environment.
6. Documented recovery procedures and responsible roles.

Recovery objectives should be expressed as RPO (maximum acceptable data loss window) and RTO (maximum acceptable recovery time). These values are business decisions and should be finalized before a production SLA is promised.

## Security Testing Strategy

- Unit tests for critical business rules: inventory, pricing, profit, permissions and subscription entitlements.
- Integration tests for database transactions and tenant isolation.
- API tests for authentication, authorization and validation failures.
- Negative tests deliberately attempting cross-tenant access.
- Dependency vulnerability scanning in CI.
- Static analysis and secret scanning.
- Container/image scanning before production deployment.
- Periodic dynamic security testing and, as the product matures, independent penetration testing.

Security baseline should align with a recognized application-security standard such as OWASP ASVS. The project should maintain a security checklist and treat high-risk findings as release blockers.

Release verification includes translation-key/placeholder parity, missing-key checks, English/Bangla validation errors, Bangla input/search round trips, date/number/currency formatting and bilingual invoice/PDF/statement rendering. Finance integration tests cover partial/full/opening/return/adjustment/credit/refund flows, concurrent collections, allocation bounds, reversals, as-of aging, projection reconciliation, payload-mismatch idempotency, rollback and cross-tenant/branch exports. Mobile tests include offline credit sale and collection, kill/restart, replay and acknowledgement loss; posted plus pending effects must never double-count.

## Critical Security Test Cases

| Scenario | Expected result |
| --- | --- |
| User A requests User B organization product | Denied / not found; no data leak |
| Cashier tries to view profit report | Denied by permission |
| User sends malformed SQL-like filter | Validation failure; no query injection |
| Repeated failed login attempts | Throttled / blocked according to policy |
| Expired access token used | Rejected |
| Refresh token reused after rotation | Rejected / session risk event |
| Sale request repeated with same idempotency key | Original result returned, no duplicate sale |
| Refund of already refunded sale | Rejected by business rule |
| Stock adjustment without permission | Rejected and audited |
| Large export requested repeatedly | Queued/rate limited |

| Additional scenario | Expected result |
| --- | --- |
| Foreign-tenant account/payment/allocation/statement ID | Consistent denied/not found, including worker/export access |
| Unauthorized customer/supplier collection or ledger access | Server permission failure; no side effects or hidden KPI leakage |
| Two collectors pay the same final debt concurrently | Serialized validation; no excess allocation/payment without advance policy |
| Same payment key, different payload | Conflict, no new money movement |
| Crash after commit before mobile acknowledgement | Replay returns original IDs; client reconciles once |
| Return after full payment then cash refund | Linked entries settle credit correctly; no false debt/credit |
| Bangla text and locale switch during draft | Text preserved; only labels/format change; no financial recomputation drift |

## Business Invariants

```text
1. A record must never belong to more than one organization.
2. A sale item must reference a variant owned by the same organization.
3. A purchase item must reference a variant owned by the same organization.
4. Inventory movements must be attributable to an event.
5. Historical profit must remain reproducible.
6. Voids/refunds must preserve audit history.
7. Financial amounts use exact decimal semantics.
8. Subscription entitlements are resolved from a trusted server-side source.
9. A user cannot grant themselves permissions.
10. Organization membership changes are auditable.
```

11. A posted customer/supplier balance equals its immutable ledger sum; projections are rebuildable.
12. Each financial source/command posts at most once; payment allocation does not reduce balance twice.
13. Settlements are same-tenant, same-account, same-currency and within eligible remaining amounts.
14. Reversal/correction preserves original evidence and transactionally updates settlements/projections.
15. Language switching cannot change enum values, monetary values, tenant context or business rules.
16. Offline synchronization never silently overwrites, loses or duplicates financial events.

## Database Indexing Baseline

| Table/domain | Baseline indexes |
| --- | --- |
| Membership | user_id + organization_id unique, organization_id |
| Product/Variant | organization_id, SKU unique within org, barcode unique within org where required |
| Sales | organization_id + branch_id + created_at, invoice_no unique within org |
| SaleItem | sale_id, variant_id |
| Purchase | organization_id + branch_id + created_at |
| Inventory | organization_id + branch_id + variant_id unique for balance |
| InventoryTransaction | organization_id + branch_id + variant_id + created_at |
| AuditEvent | organization_id + created_at, actor_id + created_at |

Index design must be validated with actual query plans and production-like data. Do not add an index for every column simply because it is searchable; write-heavy workloads pay a cost for every index.

Additional financial indexes:

| Table/domain | Baseline indexes |
| --- | --- |
| LedgerAccount | Unique organization + customer/supplier + kind + currency; scoped party FKs |
| LedgerEntry | Unique account + sequence; organization + account + effective_at + sequence; unique source-event; reversal references |
| OpenItem | Organization + account + due_date; source-entry uniqueness |
| Payment | Organization + branch + occurred_at; unique command/source movement |
| PaymentAllocation / LedgerSettlement | Scoped payment/credit + open item; reversal links; bounded allocation access |
| Idempotency / sync | Unique organization + actor + operation + key; durable command ID and payload hash |
| PaymentMethod | Organization + method code unique; historical references retained |

## Database Migration Rules

- All schema changes go through versioned migrations.
- Production migration execution should be automated and reviewable.
- Destructive changes should use expand-and-contract migrations where necessary.
- Application rollout must remain compatible during rolling deployment windows.
- Seed data and reference data should be deterministic and environment-aware.

## Versioning and Release Policy

- Use semantic application/API versioning principles.
- Database migrations must be backwards-compatible during rolling deployments where applicable.
- Feature flags should control risky or incomplete features.
- Release notes should identify user-visible business changes and security changes.
- Keep a rollback plan for every production release.

## Web Security Headers and Browser Controls

- Enforce HTTPS in production.
- Configure HSTS when deployment is ready and all required domains are HTTPS-safe.
- Use a restrictive Content Security Policy appropriate to the frontend architecture.
- Set secure clickjacking, MIME sniffing and referrer policies as appropriate.
- Review CORS explicitly; do not allow arbitrary origins with credentials.

## Privacy and Data Governance

- Collect only fields required for the service or explicit user features.
- Provide organization-level data export and deletion flows subject to legal/financial retention needs.
- Document what data is processed, why, where it is stored and how long it is retained.
- Separate operational telemetry from customer business data where possible.
- Minimize access to production data internally.

Legal/privacy requirements vary by jurisdiction. A production launch should include a formal privacy policy, terms of service and data-retention policy reviewed for the markets where the product is offered.

## Support and Break-Glass Access

Support access should be exceptional rather than normal. A break-glass flow should require strong authentication, a reason, a narrow scope, an expiration time and an immutable audit record. The system should make it technically difficult to browse unrelated organizations.

## Administrative Platform Architecture

```text
Platform Admin
  |
  +-- Organizations (metadata/status)
  +-- Subscriptions
  +-- Plan configuration
  +-- System health
  +-- Security events
  +-- Support tickets
  +-- Aggregate metrics
  +-- Break-glass access

Platform admin is a separate authorization domain from customer organization roles.
```

## Localization and Market Readiness

English and Bangla (বাংলা) are core V1 requirements on Web and React Native. Use general `Localization`, `Accounts`, `Ledger`, `Receivable`, `Payable`, `Payment` and `Transaction` concepts internally, allowing later markets without Bangladesh-specific business hacks. Bangladesh examples and mobile financial services are configurable presentation/payment options.

### i18n architecture and translation files

Use i18next with react-i18next on both React clients. Share versioned translation catalogs/keys through a future shared package or synchronized build resource, without requiring an immediate workspace migration. Namespace catalogs by feature; add validation/errors, purchases, suppliers, payments and document namespaces as needed:

```text
i18n/
  en/
    common.json
    sales.json
    inventory.json
    customers.json
    reports.json
    settings.json
  bn/
    common.json
    sales.json
    inventory.json
    customers.json
    reports.json
    settings.json
```

```json
// en/customers.json
{ "customer_due": "Customer Due" }
// bn/customers.json
{ "customer_due": "কাস্টমারের বাকি" }
```

Call `t('customers:customer_due')`; do not branch component/business logic by language. Translate labels, navigation, form hints, empty/error/success states, accessibility text, notifications and document headings. Support interpolation/plurals without concatenating translated fragments. Escape untrusted text and keep key/placeholder parity checked in CI; English fallback must not conceal missing required Bangla strings at release.

### Selection and persistence

Allow English / বাংলা during onboarding/registration and in Settings. Store `User.preferred_language` (`en` or `bn`) via an authenticated preferences endpoint; it is a locale code, not translated business data. Before login use an explicit saved local preference, otherwise a supported device language, otherwise English. After login load the user's saved preference; explicit changes save locally immediately and sync to that user's profile, visibly retrying if offline. Persist a pending preference change so a stale profile response cannot overwrite it. On account switch use that user's preference, never another user's cache. Financial data and drafts survive language switches.

Web caches only the non-secret locale; App persists it in local preference storage/SQLite and bundles catalogs for offline use. Server exports/reminders accept an explicit supported document locale or resolve the intended recipient preference. The server database/domain remains language-independent; optional localized error messages are boundary output alongside stable machine codes. Do not store translated `SALE`, `PURCHASE`, `PAYMENT`, `CUSTOMER` or status enums, or duplicate ledger/business logic per locale.

### Text, formatting and documents

UTF-8/Unicode is required through API, PostgreSQL, SQLite, search, reports, receipts and statements. Accept Bangla product names (রুপচাঁদা মাছ), customers (মোঃ রহিম), suppliers (ঢাকা ট্রেডার্স), categories, brands, addresses, notes, invoice notes and expense descriptions. Preserve user text; changing UI language never translates or transliterates it automatically.

Use Intl locale formatting (`en`/`bn`, with region-specific display locales as appropriate) and organization-configured ISO currency/timezone, not fixed dollar signs or a globally assumed Dhaka timezone. Numeric input may accept Bangla digits and normalize to canonical decimal values before validation; API serialization stays decimal strings, dates ISO 8601 UTC and currency codes canonical. Date-only due dates are business-local dates. Number/date display choices never alter stored amounts, rounding or historical costs. Quantity/unit precision remains configurable. Phone numbers retain normalized country information; tax stays optional and generic.

Support readable Bangla fonts/shaping, conjuncts, wrapping and accessibility on Web, Android/iOS and PDF/thermal output. Receipts and statements offer `en`, `bn`, `en-bn` modes under File and Image Storage; all reports render English/Bangla headings and preserve Unicode UGC. No parallel per-language tables for business events are needed.

## Performance Targets (Initial Engineering Targets)

| Metric | Initial target |
| --- | --- |
| Normal API p95 | < 500 ms for common CRUD/read operations under expected load |
| Simple transaction p95 | < 800 ms for a normal sale/purchase transaction |
| Health endpoint | < 200 ms when healthy |
| Mobile sync | Retry-safe and eventually consistent within normal connectivity conditions |
| Large report | Asynchronous job; no long-running client request |

These are engineering targets, not user-facing SLAs. They must be validated with load tests against realistic data volumes.

## Capacity Planning

The VPS should be sized for expected workload, not assumed to be secure because it has more RAM/CPU. The first scaling bottleneck is likely to be database I/O, connection management, report generation or concurrent write traffic rather than raw CPU alone.

```text
Measure
  requests/sec
  concurrent users
  database connections
  CPU
  RAM
  disk IOPS / latency
  Redis memory
  queue depth
  report jobs
  error rate

Then scale the specific bottleneck.
```

## Observability Dashboard Baseline

- API request rate / error rate / latency.
- Database connection count and slow queries.
- Redis health and memory usage.
- Worker queue depth and failed jobs.
- Authentication failure spikes.
- Rate-limit blocks.
- Storage usage.
- Backup success/failure.

# 2. Web

## Web Application Architecture

```text
src/
  app/
  routes/
  features/
    auth/
    dashboard/
    products/
    sales/
    purchases/
    inventory/
    customers/
    suppliers/
    expenses/
    reports/
    settings/
    subscription/
  components/
  services/
  store/
  hooks/
  permissions/
  utils/

```

The web app should derive feature visibility from entitlements and permissions, but frontend gating is only a UX optimization. The server remains the enforcement point.

Add `features/ledger/`, `features/payments/` and `i18n/` within the established React/TypeScript structure. Use Redux Toolkit for user preferences/active context and RTK Query for scoped server ledger/report data. Cache keys include tenant, branch, party, filters, as-of scope and locale for translated server documents; raw ledger data remains language-independent. A successful collection/reversal invalidates the party ledger/profile, sale/purchase open items, dashboard and affected reports. Unknown-result retries reconcile by command ID before creating another payment.

### Customer and supplier screens (Web and App contract)

| Screen | Customer | Supplier |
| --- | --- | --- |
| List | Search/filter, current due, outstanding status | Search/filter, current payable, outstanding status |
| Profile | Contact, current due, total purchases (customer's shop sales), total paid | Contact, current payable, total purchases (shop's supplier purchases), total paid |
| Ledger | Opening, sale, payment, return, signed adjustment, notes, reference, date/time, running/current balance | Opening, purchase, payment, return, signed adjustment, notes, reference, date/time, running/current payable |
| Payment | Collect, amount, configurable method, allocation review, receipt | Pay, amount, configurable method, allocation review, receipt |
| History/returns | Sale/invoice history, eligible returns, linked source | Purchase history, eligible returns, linked source |
| Statement | Date-range opening/closing totals, print/export/share in selected language | Date-range opening/closing totals, print/export/share in selected language |

All lists/history/ledgers support pagination, English/Bangla search, date ranges, authorized branch filters and loading/empty/error/forbidden states. Define profile totals' date scope and show net purchases, returns, gross paid/refunded separately so credit adjustments do not distort “total paid.” Show due dates, overdue days, unapplied credits and pending local events where applicable. Permission-gate payment buttons and direct routes independently from profile viewing. Search and filter state survives detail navigation.

### Web language switching

Use i18next/react-i18next with the namespace/file contract in Server. Settings and preferably registration/onboarding expose English / বাংলা, immediately rerender UI, validation and accessibility labels, and persist the user's choice. Use document `lang`, Bangla-capable font fallback and locale-aware dates/numbers/currency. Load namespaces with an English fallback and detect missing keys in CI. Do not reload or discard checkout drafts when switching language. Browser storage may cache the non-secret signed-in preference keyed by user; the authenticated profile is the cross-device preference source. Never treat UI locale as a tenant/currency selector.

## Dashboard and UX Requirements

- Dashboard should show today’s sales, gross profit, expenses, outstanding receivables and low-stock items.
- Users should be able to switch branch and date scope where their permissions allow.
- Every financial KPI should have a drill-down path to the underlying transactions.
- The product list should support barcode search, SKU search and category filtering.
- The sale screen should be optimized for speed and keyboard/barcode-scanner usage.
- Mobile should prioritize one-hand operation for common cashier workflows.

Required dashboard labels and example values (illustrative fixtures, not live metrics):

| Translation key | English | Bangla | Example BDT |
| --- | --- | --- | --- |
| todays_sales | Today's Sales | আজকের বিক্রয় | ৳24,500 |
| todays_profit | Today's Profit | আজকের লাভ | ৳6,200 |
| customer_due | Customer Due | কাস্টমারের বাকি | ৳87,500 |
| supplier_payable | Supplier Payable | সাপ্লায়ারের পাওনা | ৳42,000 |
| stock_value | Stock Value | স্টকের মূল্য | ৳345,000 |
| todays_expenses | Today's Expenses | আজকের খরচ | ৳2,100 |

“Today's Profit” defaults to gross profit under the existing costing rules and must disclose that definition; operating profit is separately labeled. Sales/profit/expenses use business-day scope; receivable/payable/stock figures are as-of snapshots, not today's transaction sums. Respect specific ledger/report/profit permissions and avoid leaking totals through dashboard endpoints. Add due-today/overdue/long-overdue lists with authorized drill-downs.

# 3. App

## Mobile Application Architecture

```text
React Native
   |
   +-- UI / Navigation
   |
   +-- Redux Toolkit
   |      +-- auth
   |      +-- organization
   |      +-- cart/sale draft
   |      +-- sync status
   |
   +-- RTK Query / API client
   |
   +-- Local SQLite
          +-- product cache
          +-- inventory cache
          +-- sale drafts
          +-- sync_queue
          +-- sync_conflicts

```

Offline scope should be deliberately limited. Start with product browsing, stock visibility and sales creation. Do not attempt offline editing of every administrative screen during the first release.

Add `ledger/`, `payments/`, `localization/` feature adapters; SQLite stores scoped accounts, immutable accepted entries, open items, settlements, payments/allocations, local pending events, methods, projections and preference cache. Redux coordinates current language/context and sync UI; SQLite owns durable local financial events, and RTK Query owns online server responses. Do not copy server truth into competing mutable `due_amount` fields.

### App localization and financial screens

Use the shared localization contract under Server and the customer/supplier screen matrix under Web as mandatory App behavior. Expo Router screens include customer/supplier list, profile, ledger, payment, history, returns and statement routes; reports include receivables, payables, aging, collection, credit-sales and purchase-payables. Lists support Bangla/English search, balance filters and date ranges. Keep route files thin and use the existing Redux Toolkit/RTK Query architecture.

Onboarding/registration and Settings offer English / বাংলা. Persist non-secret preference locally for cold/offline starts and to the user profile when authenticated; one-time device detection is a default only. Bundle both translation catalogs for offline screens/errors; financial rendering and print/share templates work without downloading translations. Keep Bangla-capable font fallback (the existing Poppins setup alone is not evidence of coverage), wrapping, screen-reader labels and keyboard entry usable on Android/iOS.

Show posted balance and pending local change separately. Payment review shows party, amount, configurable method, remaining estimate and sync status; provisional receipts carry a local reference and pending label. After acceptance, show the server invoice/payment reference and authoritative balance. Do not present provisional receipts as final or promise provider processing offline. Dashboard includes both receivable/payable KPIs with links, selected scope, freshness and permission gating.

## Offline Sync Protocol

```text
Local change
    |
    v
sync_queue
    |
    v
API
    |
    +---- accepted ----> server version / event id
    |
    +---- conflict ----> conflict record + client resolution path
    |
    v
local state updated

Each command should carry:
  clientId
  idempotencyKey
  localTimestamp
  entityVersion / serverVersion when applicable
  commandType
  payload

```

- Server remains authoritative for business truth.
- Use idempotency keys to prevent duplicate sales after retries.
- Prefer append-only commands/events for offline operations over arbitrary last-write-wins mutation.
- Conflicts must be observable and recoverable rather than silently overwritten.
- The client should expose sync status and failed actions to the user.

### Offline credit sale and collection contract

```text
Offline Sale → select cached customer → partial/no payment → local sale + items
  → SQLite transaction: stock estimate + full receivable + payment + allocations
    + local projections + durable sync_queue command
  → server command handler → PostgreSQL transaction → accepted event IDs
  → SQLite transaction: reconcile provisional events, projection and queue acknowledgement
```

SQLite migrations use foreign keys, exact minor units or canonical decimal strings with decimal arithmetic, tenant/user/branch/currency scope and unique command/event IDs. Local financial effect and queue enqueue commit together. Never enqueue partial financial bundles or store SQLite REAL money. Keep accepted server entries separate from provisional effects so replay/acknowledgement cannot count both. Render last-synced authoritative balance plus pending net effect; cross-device balances may be stale.

Practical offline customer collection is part of the supported scope for cached accounts and methods: local payment + negative ledger event + selected/provisional allocation + queue commit atomically. Supplier payment follows the same mechanism where cached obligations and authorization policy permit. Only record a reported money movement offline; provider authorization, refunds/voids and privileged adjustments remain online. Missing required cached data forces online completion rather than inventing an account or balance. A rejected collection remains visible as a reconciliation case because physical money may already have changed hands.

Process dependent commands in account order; payment against a local sale waits for its sale acknowledgement, mapping stable client IDs to server IDs. Use stable command IDs on retries and account sequence/cursor watermarks for pulls. Merge immutable accepted events by ID and apply acknowledgements once in a SQLite transaction. Server validates current permissions, tenant membership, stock, price/credit policy, method and allocation availability; client offline permissions are only a UX hint.

A concurrent collection/return on another device may invalidate stale allocations or exceed outstanding: return a structured conflict, preserve local evidence and require explicit review/reallocation or reversal. No financial last-write-wins and no silent dropping/repricing/reallocation of a recorded payment. Failed dependencies block their dependents visibly. Process kills, interrupted acknowledgement, expired credentials, long offline gaps and pagination must not lose or duplicate events. Cache clear/logout/tenant switch must preserve or explicitly resolve pending writes; never replay another tenant's queue. Bound retry/backoff and show pending/retryable/conflict/rejected status and safe manual recovery.

## Mobile Security Controls

- Use HTTPS only for API traffic.
- Keep refresh/session secrets in platform secure storage.
- Do not log tokens, passwords or sensitive business data in production builds.
- Consider certificate/public-key pinning only after weighing operational complexity and rotation risk.
- Obfuscation is not a substitute for server-side authorization.

# 4. Workflow

## End-to-End Business Workflows

Arrows describe logical steps; the marked posting block is a single transaction, never separate client writes. Server authorization applies to every financial command. Financial examples use configurable BDT currency.

### Credit Sale

```text
Create sale draft → Select customer → Calculate server-validated total
  → Customer pays partial/none → Validate permission/credit/stock/idempotency
  → ATOMIC: create Sale/items + stock/cost movements
    + full Customer Receivable LedgerEntry + optional Payment/negative entry
    + allocations/open items + outstanding projection + audit/outbox/result
  → Commit → Invoice/receipt in English / বাংলা / both
```

Sale 2,500 and paid 1,000 leaves customer due 1,500. Customer selection is mandatory for unpaid sales. A cash sale with no customer must be fully settled under the configured policy.

### Customer Payment

```text
Customer due → Receive payment → Validate permission/context and method
  → ATOMIC: claim idempotency key + lock account/open items
    → Create Payment → Create negative LedgerEntry → Allocate payment
    → Update balance/open items → Audit/outbox/result
  → Commit → Generate receipt
```

Due 5,000; collect 2,000 by Cash (or any active configured method); remaining due 3,000. Timeout retries reconcile the same command; they never create another collection.

### Supplier Purchase on Credit

```text
Create purchase draft → Select supplier → Receive stock / verify quantities
  → Validate permission and source ownership
  → ATOMIC: record Purchase/items + inventory receipt/cost
    → Full Supplier Payable LedgerEntry → Record Payment/negative entry if any
    → Allocate settlement → Remaining payable projection + audit/outbox/result
  → Commit → Purchase receipt/statement
```

Purchase 50,000 and paid 20,000 leaves payable 30,000.

### Supplier Payment

```text
Supplier payable → Make payment → Validate permission/method/idempotency
  → ATOMIC: lock account/open items → Create outgoing Payment
    → Create negative LedgerEntry → Allocate payment
    → Update payable + audit/outbox/result
  → Commit → Payment receipt
```

Later payment 10,000 reduces payable 30,000 to 20,000.

### Return, Correction and Statement

```text
Select original event → Validate eligible return/reversal and permission
  → ATOMIC: linked return/reversal + stock effect where applicable
    + ledger/settlement reversals + optional refund + projections/audit
  → Commit → Revised position with original history preserved

Select party → Authorized date/branch/as-of filters → Snapshot ledger
  → Opening + entries + running/closing balance → Select en / bn / en-bn
  → Print/export privately → Authorized download/share
```

### Offline Credit Sale / Payment

```text
Offline sale → Cached customer → Partial payment → Baki created locally
  → SQLite ledger/payment/stock estimate + sync queue (one local transaction)
  → Reconnect → Server revalidates → PostgreSQL atomic posting
  → Stable accepted IDs → SQLite atomic reconciliation → Final receipt

Offline collection → Cached customer/obligations/method
  → SQLite payment + ledger + allocation + queue → Same sync pipeline
  → Conflict/rejection: retain evidence and show explicit recovery
```

### Language Switching

```text
User opens Settings (or onboarding) → Select Language → English / বাংলা
  → Persist local preference + authenticated user preference (queue if offline)
  → Web/App UI, validation and formatting change without losing drafts
  → Future sessions/devices load saved user preference
```

Document language remains a separate explicit choice; switching language never changes money, enum codes or tenant context.

### Due Reminder

```text
Business-local as-of date → Remaining open items → Due today/overdue/X days
  → Authorized in-app list → Optional reminder job
  → Recheck due/consent → Deduplicated provider adapter or shareable statement
```

External WhatsApp/SMS/email/payment-link integrations remain future-ready optional delivery channels.

## Sales Workflow

1. Select branch and cashier context.
2. Add products/variants with quantity, price and discount rules.
3. Validate product ownership, price rules, availability and stock policy.
4. Calculate subtotal, discount, tax (if enabled), total and due amount.
5. Create Sale + SaleItems + Payment records and customer receivable/settlement entries in one transaction where applicable (see Accounts, Credit Ledger and Payments).
6. Create inventory ledger movements and update materialized stock balance.
7. Commit audit, idempotency result and transactional outbox records with all financial and stock effects.
8. Return a stable invoice/receipt representation to the client.

Voiding and refunding are separate operations. Do not silently mutate or delete the original sale to make it disappear. Reversal records should preserve historical truth.

## Purchase Workflow

1. Create or select supplier.
2. Capture purchase items, quantity, unit cost, discount and tax where applicable.
3. Validate SKU ownership and branch scope.
4. Commit purchase and inventory receipt transactionally.
5. Update weighted-average cost / inventory valuation as configured.
6. Post the full supplier payable and any payment/allocations in the same transaction; update ledger projection and open items.
7. Audit the operation.

## CI/CD Pipeline

```text
Pull Request
  -> format/lint
  -> typecheck
  -> unit tests
  -> integration tests
  -> dependency/security scan
  -> build
  -> container build

Main / release
  -> build immutable image
  -> push registry
  -> deploy staging
  -> smoke tests
  -> approval/gate
  -> deploy production
  -> health/readiness check
  -> rollback if failed
```

## MVP Scope

The MVP should prove that a local shop can register, configure its business, add products, record purchases, sell products, see stock, understand daily revenue/profit and manage customers/suppliers, Baki ledgers, collections, payable payments, statements and aging in English and Bangla.

```text
MVP modules

Auth
Organization + branch
Products + categories
Customers + suppliers + receivable/payable ledgers
Purchases
Sales + payments
Inventory ledger
Expenses
Basic reports + outstanding/aging/collection/credit reports
English/Bangla UI + bilingual receipts/statements
Roles/permissions
Plan/entitlement engine
Audit log
Web app
Mobile sale + inventory flows
Basic offline sync
Security baseline
Backups + monitoring
```

## Post-MVP Roadmap

| Phase | Capabilities |
| --- | --- |
| V1.1 | Better barcode/scanner flows, CSV import/export enhancements, invoice customization beyond core bilingual receipts/statements, low-stock notifications |
| V1.2 | Multi-branch transfer UX, advanced analytics beyond core reports, richer aging visualization |
| V1.3 | Subscriptions/payment provider integration, premium feature gating, ad platform |
| V1.4 | Advanced offline sync, richer conflict handling, device management |
| V2 | Industry packs, serials/batches/expiry, API access, integrations |
| Scale phase | Read replicas/reporting layer, separated workers/services only where justified |

## Development Order

1. Finalize business requirements and terminology, with English/Bangla catalogs and credit-ledger invariants as core requirements.
2. Finalize tenant, role and authorization model.
3. Finalize core database schema and invariants.
4. Implement authentication/session foundation.
5. Implement organization/membership/branch boundaries.
6. Implement products/categories/variants.
7. Implement inventory ledger and balance rules.
8. Implement purchases with supplier payable accounts, payments and settlements.
9. Implement sales/customer receivables/payments/allocations/returns and reversals.
10. Implement profit/expense, outstanding/aging/collection reporting and bilingual statements.
11. Implement entitlement/subscription foundation.
12. Implement web application workflows.
13. Implement mobile offline workflows and sync.
14. Harden security, observability, backups and CI/CD.
15. Run load/security testing and prepare launch.

## Recommended Repository Structure

```text
localshop/
  apps/
    web/
    mobile/
    api/
    worker/
    admin/

  packages/
    api-client/
    contracts/
    validation/
    shared-types/
    config/

  infrastructure/
    docker/
    nginx/
    ci/
    scripts/

  docs/
    product/
    architecture/
    security/
    api/
    operations/

  prisma/
    schema.prisma
    migrations/

  .github/
    workflows/
```

A monorepo is recommended so web, mobile and server contracts can share TypeScript models safely without copying business definitions. The final workspace tooling can be pnpm workspaces, Turborepo or another maintainable choice.

The tree above is a future workspace recommendation, not a request to move current application directories. The current repository remains:

```text
core_shop/
  README.md
  readme/
    project_structure.md       # Canonical four-section source of truth (this file)
  server/
    README.md
    readme/serverProgress.md
    docs/                      # Implementation design/evidence, where present
    prisma/
    src/
  mobile_app/
    AGENTS.md
    README.md
    readme/
      mobilePlan.md
      mobileProgress.md
      globalCssGuide.md
    src/
  web/                         # Reserved, no implementation claim
```

Documentation folders are versionable and must not be gitignored. The former `mobile_app/readme/project_structure.md` is moved here; consumers link to this single canonical specification. Shared contracts/catalog packages can be introduced incrementally without replacing current app tooling.

## Definition of Done for a Feature

- Business rule documented.
- Authorization rules defined.
- Database migration reviewed.
- API contract documented.
- Unit/integration tests added.
- Tenant-isolation test added where relevant.
- Audit event added for sensitive actions.
- Error codes defined.
- Web/mobile UX completed where in scope.
- Observability added for important failures.
- Rollback/migration implications reviewed.

- English/Bangla keys, validation and Unicode UGC behavior verified for affected surfaces.
- Financial sources, allocations, reversals, atomicity and idempotency documented/tested where applicable.
- Offline pending/posted distinction and replay recovery verified for supported mobile commands.
- Receivable/payable reports and statements reconcile to immutable entries and preserve selected language.

## Launch Checklist

- Production secrets are not in Git.
- Database is private and backed up.
- HTTPS is enforced.
- Rate limiting is enabled.
- Authentication and password-reset flows tested.
- Tenant isolation tests pass.
- Error responses do not leak internals.
- Audit logs are working.
- Health/readiness checks are working.
- Monitoring and alerting are active.
- Backup restore has been tested.
- Security dependency scan is clean or accepted findings documented.
- Load test completed for expected launch traffic.
- Privacy policy and terms are ready for launch.

- English/Bangla onboarding/settings persistence, missing-key coverage and Bangla fonts verified.
- Bilingual receipts/statements and required finance reports reconcile with posted events.
- Duplicate/concurrent payments, allocation reversal, as-of aging and cross-shop ledger denial tested.
- Offline credit sale/collection survives restart and acknowledgement loss without duplicate effects.

## Open Decisions Before Coding

| Decision | Why it matters | Suggested default |
| --- | --- | --- |
| Exact free-plan limits | Defines acquisition economics | Configurable limits with generous but bounded MVP values |
| Payment provider | Defines subscription lifecycle | Abstract provider interface; integrate one provider first |
| SMS/email provider | Account verification and notifications | Provider abstraction |
| Tax model | Changes invoice/profit calculations | Generic optional tax components |
| Negative stock policy | Changes sale validation | Disabled by default |
| Cost method | Changes profit | Weighted average |
| Branch rules | Changes inventory/report scoping | Branch-aware from day one |
| Data deletion/retention | Privacy/compliance impact | Document policy before launch |
| KMS/key management | Changes encryption operations | Abstract crypto/key provider; deploy managed KMS when available |

## Final Architectural Position

The recommended baseline is a secure, multi-tenant modular monolith with PostgreSQL as the source of business truth, Redis/BullMQ for asynchronous work, React for web, React Native for mobile, and a shared NestJS API. Inventory is ledger-based, profit is auditable, authorization is tenant-aware, customer data is protected through least privilege and selective encryption, and the platform operator does not receive routine access to customer business data.

The most important engineering investment before UI polish is the domain model: tenant boundaries, inventory movements, cost snapshots, financial invariants, permissions, subscription entitlements and offline command semantics. Once those are correct, web and mobile become clients of a stable business engine rather than separate systems that can drift apart.

## Reference Security Standards

- OWASP Application Security Verification Standard (ASVS) - use Level 2 as the practical baseline for the application and explicitly track any accepted gaps.
- OWASP Top 10 - use as a threat-awareness reference, not as a complete security program.
- OWASP Cheat Sheets - especially Authentication, Password Storage, Cryptographic Storage, SQL Injection Prevention, Logging and Secure Headers.

Standards are guidance, not a substitute for a threat model, secure implementation, code review, testing, monitoring and incident response.
