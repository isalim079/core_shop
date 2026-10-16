export type ScenarioPreset =
  | "happy"
  | "empty"
  | "error"
  | "low_stock"
  | "offline";

export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "STOCKKEEPER";

export type StaticUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
};

export type StaticBranch = {
  id: string;
  name: string;
  code: string;
  address: string;
  isMain: boolean;
};

export type StaticOrganization = {
  id: string;
  name: string;
  legalName: string;
  currency: "BDT" | "USD";
  currencySymbol: string;
  timezone: string;
  branches: StaticBranch[];
};

export type StaticCategory = {
  id: string;
  name: string;
  nameBn?: string;
  productCount: number;
  icon?: string;
};

export type StaticBrand = {
  id: string;
  name: string;
};

export type StaticUnit = {
  id: string;
  name: string;
  abbreviation: string;
};

export type StaticVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
};

export type StaticProduct = {
  id: string;
  name: string;
  nameBn?: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  sku: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  reorderLevel: number;
  imageUrl?: string;
  variants: StaticVariant[];
};

export type StaticStockMovementType =
  | "SALE"
  | "PURCHASE"
  | "ADJUSTMENT"
  | "RETURN_CUSTOMER"
  | "RETURN_SUPPLIER";

export type StaticStockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: StaticStockMovementType;
  quantity: number;
  resultingStock: number;
  referenceId: string;
  reason?: string;
  createdAt: string;
  createdByName: string;
};

export type StaticCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  dueAmount: number; // Customer Baki
  totalSalesCount: number;
  lastSaleDate?: string;
};

export type StaticSupplier = {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  payableAmount: number; // Supplier Dena
  totalPurchasesCount: number;
  lastPurchaseDate?: string;
};

export type PaymentMethod = "CASH" | "CARD" | "BKASH" | "BAKI";

export type StaticSaleLine = {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type StaticSale = {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  lines: StaticSaleLine[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "PAID" | "DUE" | "PARTIAL";
  createdAt: string;
  cashierName: string;
};

export type StaticPurchase = {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  payableAmount: number;
  status: "RECEIVED" | "ORDERED" | "RETURNED";
  createdAt: string;
};

export type StaticExpense = {
  id: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  payee: string;
  note: string;
  createdAt: string;
  createdByName: string;
};

export type StaticReportSummary = {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  totalCustomerDue: number; // Total Baki
  totalSupplierPayable: number; // Total Dena
  lowStockCount: number;
};

export type StaticSettings = {
  storeName: string;
  currency: string;
  currencySymbol: string;
  language: "en" | "bn";
  allowNegativeStock: boolean;
  defaultTaxRate: number;
  receiptFooterMessage: string;
};
