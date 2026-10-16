import type { StaticPurchase } from "./scenarioTypes";

export const staticPurchases: StaticPurchase[] = [
  {
    id: "po-088",
    purchaseNumber: "PO-2026-088",
    supplierId: "supp-01",
    supplierName: "Pran-RFL Distribution Ltd.",
    totalAmount: 14500,
    paidAmount: 5000,
    payableAmount: 9500, // Remaining payable to supplier
    status: "RECEIVED",
    createdAt: "2026-10-16T11:00:00Z",
  },
  {
    id: "po-087",
    purchaseNumber: "PO-2026-087",
    supplierId: "supp-02",
    supplierName: "Square Consumer Goods",
    totalAmount: 22000,
    paidAmount: 22000,
    payableAmount: 0,
    status: "RECEIVED",
    createdAt: "2026-10-12T14:00:00Z",
  },
];
