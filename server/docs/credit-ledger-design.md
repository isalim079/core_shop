# Receivables, payables and Baki: implementation baseline

This records the version 0.2 root specification for future finance phases. The ledger/payment tables and business endpoints below are not implemented by Phase 3. Its durable command, audit and outbox infrastructure provides the transaction boundary they will use.

## Model

- One `LedgerAccount` per organization, party, account kind and currency. A scoped customer FK XOR supplier FK must match RECEIVABLE/PAYABLE.
- An immutable `LedgerEntry` records signed amount, currency, account sequence, effective time, posting time, actor, originating command, reason and constrained source/reversal references.
- `LedgerBalance` is a rebuildable sequence/version projection, never an editable party due field.
- `OpenItem` represents an invoice, dated opening balance or approved positive adjustment, including its due-date snapshot or explicit unknown due date.
- `Payment` records one positive actual movement with incoming/outgoing direction, configured method, event time and command/source uniqueness. Anonymous fully paid sales may use direct sale-payment links without inventing a customer.
- `PaymentAllocation` settles an obligation using payment credit; `LedgerSettlement` settles it using a non-cash credit entry. Both are append-only with explicit reversal links and scoped FKs.
- `PaymentMethod` belongs to an organization, with configurable names and categories CASH/BANK/CARD/MOBILE_FINANCIAL_SERVICES/OTHER. Historical methods are archived rather than deleted.

Every tenant relationship uses composite foreign keys. An account spans an organization; entries preserve their authorized branch. Branch-only views show branch subtotals, not the organization's whole balance. Cross-currency accounts and unrelated customer/supplier positions are never implicitly netted.

## Posting and allocation invariants

For either account kind, positive delta increases the amount owed in that account's direction; negative delta decreases it. Store exact decimals, and serialize financial API values as canonical decimal strings.

A sale of 2,500 with payment of 1,000 posts +2,500 and -1,000, leaving 1,500. A later collection of 500 leaves 1,000. A purchase of 50,000 with payment of 20,000 posts +50,000 and -20,000, leaving 30,000 payable. Allocating those payments does not create another balance reduction.

Signed balance is the immutable entry sum. Show outstanding=max(balance,0) and credit/advance separately. Default payment validation prevents overpayment unless explicit advance policy is enabled. Returns can still create credit; an authorized refund reverses cash direction and adds the matching positive ledger effect, preventing false residual credit.

Lock accounts, source/open items, payments and stock rows in deterministic order. Claim the durable command and commit document/items, inventory/cost changes, entries, allocations, projections, audit, outbox and result together. Concurrent collectors must not consume the same remaining debt. Domain source-event uniqueness protects retries even if clients submit an inappropriate new HTTP key.

Allocate to explicitly selected eligible obligations or deterministic oldest due date, then effective date and ID, with unknown due dates last. Validate same tenant/account/currency, remaining payment credit and remaining obligation amount. Reversals restore all affected allocation/projection state in the same transaction. Never edit/delete a posted financial event to correct it.

## Statements, aging and documents

Posting-order running balances follow account sequence. Effective-date statements order `(effectiveAt,sequence)` and derive opening balances from events before the selected period; never reuse a posting-order cache as an effective-date balance. Backdating is permission-gated, audited and reflected in historical recalculation.

Aging uses captured due dates and effective as-of settlements/reversals in the organization timezone. Include not-yet-due, due today, 1–30/31–60/61–90/90+ overdue buckets and a separate unknown-date bucket. Gross debt and unapplied credit reconcile to the net account position.

Snapshots/exports include selected tenant/branch/date/currency and a stable watermark. Cash collection is not new revenue; supplier payment is not another purchase expense. Receipts/statements explicitly choose `en`, `bn` or `en-bn`; preserve original Unicode business text and monetary snapshots. Future generated objects use private R2 verified keys and reauthorized downloads.

Offline credit sales/collections use the same server command handler, retain durable client command IDs and expose explicit conflicts. Posted and provisional events remain separate, so acknowledgement loss cannot double-count a payment. Physical money already collected is never silently discarded when synchronization rejects a command.

## Implementation sequence

Finalize constrained sources, allocation/reversal SQL rules, numerical precision and invoice/tax policies with the relevant domain migrations. Introduce catalog/parties before inventory and purchase/sale/payment posting. Add reconciliations, concurrent collection tests, historical as-of reports and bilingual document rendering in their assigned phases.

Source: [canonical product specification](../../readme/project_structure.md).
