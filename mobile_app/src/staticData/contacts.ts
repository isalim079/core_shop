import type { StaticCustomer, StaticSupplier } from "./scenarioTypes";

export const staticCustomers: StaticCustomer[] = [
  {
    id: "cust-01",
    name: "Rahim General Store",
    phone: "+880 1712 345678",
    address: "Block C, Dhanmondi, Dhaka",
    creditLimit: 25000,
    dueAmount: 8400, // Customer Baki
    totalSalesCount: 14,
    lastSaleDate: "2026-10-15T16:20:00Z",
  },
  {
    id: "cust-02",
    name: "Karim Traders",
    phone: "+880 1823 456789",
    address: "Lalmatia Main Road, Dhaka",
    creditLimit: 15000,
    dueAmount: 4200, // Customer Baki
    totalSalesCount: 8,
    lastSaleDate: "2026-10-14T11:45:00Z",
  },
  {
    id: "cust-03",
    name: "Bismillah Sweet & Bakery",
    phone: "+880 1934 567890",
    address: "Green Road, Dhaka",
    creditLimit: 30000,
    dueAmount: 5600, // Customer Baki
    totalSalesCount: 22,
    lastSaleDate: "2026-10-16T10:10:00Z",
  },
  {
    id: "cust-04",
    name: "Walk-in Cash Customer",
    phone: "N/A",
    address: "Counter Sale",
    creditLimit: 0,
    dueAmount: 0,
    totalSalesCount: 142,
    lastSaleDate: "2026-10-16T15:30:00Z",
  },
];

export const staticSuppliers: StaticSupplier[] = [
  {
    id: "supp-01",
    companyName: "Pran-RFL Distribution Ltd.",
    contactPerson: "Kamal Hossain",
    phone: "+880 1711 223344",
    address: "Pran Centre, Badda, Dhaka",
    payableAmount: 18500, // Supplier Dena
    totalPurchasesCount: 6,
    lastPurchaseDate: "2026-10-16T11:00:00Z",
  },
  {
    id: "supp-02",
    companyName: "Square Consumer Goods",
    contactPerson: "Mahmud Hasan",
    phone: "+880 1812 556677",
    address: "Square Centre, Mohakhali, Dhaka",
    payableAmount: 12000, // Supplier Dena
    totalPurchasesCount: 4,
    lastPurchaseDate: "2026-10-12T14:00:00Z",
  },
  {
    id: "supp-03",
    companyName: "Adani Wilmar (Fortune Oil)",
    contactPerson: "Shabbir Ahmed",
    phone: "+880 1913 889900",
    address: "Kawran Bazar C/A, Dhaka",
    payableAmount: 0, // Fully paid
    totalPurchasesCount: 9,
    lastPurchaseDate: "2026-10-10T09:30:00Z",
  },
];
