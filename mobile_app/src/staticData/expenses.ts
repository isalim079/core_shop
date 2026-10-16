import type { StaticExpense } from "./scenarioTypes";

export const staticExpenses: StaticExpense[] = [
  {
    id: "exp-01",
    category: "Store Utilities & Electricity",
    amount: 3200,
    paymentMethod: "BKASH",
    payee: "DESCO Pre-paid Meter",
    note: "Shop meter recharge for October",
    createdAt: "2026-10-16T09:30:00Z",
    createdByName: "Tanvir Ahmed",
  },
  {
    id: "exp-02",
    category: "Tea & Refreshments",
    amount: 250,
    paymentMethod: "CASH",
    payee: "Local Tea Stall",
    note: "Customer & staff evening snacks",
    createdAt: "2026-10-16T16:00:00Z",
    createdByName: "Sadia Sultana",
  },
  {
    id: "exp-03",
    category: "Store Maintenance",
    amount: 600,
    paymentMethod: "CASH",
    payee: "Hardware Shop",
    note: "Replaced 2 fluorescent light tubes",
    createdAt: "2026-10-15T11:00:00Z",
    createdByName: "Rashedul Islam",
  },
];
