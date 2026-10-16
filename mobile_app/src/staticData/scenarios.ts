import type {
  ScenarioPreset,
  StaticBrand,
  StaticCategory,
  StaticCustomer,
  StaticExpense,
  StaticOrganization,
  StaticProduct,
  StaticPurchase,
  StaticReportSummary,
  StaticSale,
  StaticSettings,
  StaticStockMovement,
  StaticSupplier,
  StaticUnit,
  StaticUser,
} from "./scenarioTypes";
import { staticUsers } from "./auth";
import { staticOrganization } from "./organizations";
import {
  staticBrands,
  staticCategories,
  staticProducts,
  staticUnits,
} from "./catalog";
import { staticStockMovements } from "./inventory";
import { staticCustomers, staticSuppliers } from "./contacts";
import { staticSales } from "./sales";
import { staticPurchases } from "./purchases";
import { staticExpenses } from "./expenses";
import { staticReportSummary } from "./reports";
import { staticSettings } from "./settings";

export type ScenarioData = {
  preset: ScenarioPreset;
  currentUser: StaticUser;
  organization: StaticOrganization;
  categories: StaticCategory[];
  brands: StaticBrand[];
  units: StaticUnit[];
  products: StaticProduct[];
  stockMovements: StaticStockMovement[];
  customers: StaticCustomer[];
  suppliers: StaticSupplier[];
  sales: StaticSale[];
  purchases: StaticPurchase[];
  expenses: StaticExpense[];
  summary: StaticReportSummary;
  settings: StaticSettings;
  isOffline: boolean;
  errorMessage?: string;
};

export const scenarioPresets: Record<ScenarioPreset, ScenarioData> = {
  happy: {
    preset: "happy",
    currentUser: staticUsers.owner,
    organization: staticOrganization,
    categories: staticCategories,
    brands: staticBrands,
    units: staticUnits,
    products: staticProducts,
    stockMovements: staticStockMovements,
    customers: staticCustomers,
    suppliers: staticSuppliers,
    sales: staticSales,
    purchases: staticPurchases,
    expenses: staticExpenses,
    summary: staticReportSummary,
    settings: staticSettings,
    isOffline: false,
  },
  empty: {
    preset: "empty",
    currentUser: staticUsers.owner,
    organization: staticOrganization,
    categories: [staticCategories[0]], // Only "All Products"
    brands: staticBrands,
    units: staticUnits,
    products: [],
    stockMovements: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    summary: {
      todaySales: 0,
      todayProfit: 0,
      todayTransactions: 0,
      totalCustomerDue: 0,
      totalSupplierPayable: 0,
      lowStockCount: 0,
    },
    settings: staticSettings,
    isOffline: false,
  },
  low_stock: {
    preset: "low_stock",
    currentUser: staticUsers.stockkeeper,
    organization: staticOrganization,
    categories: staticCategories,
    brands: staticBrands,
    units: staticUnits,
    products: staticProducts.map((p) => ({
      ...p,
      currentStock: Math.min(p.currentStock, 2), // Force all to critically low
    })),
    stockMovements: staticStockMovements,
    customers: staticCustomers,
    suppliers: staticSuppliers,
    sales: staticSales,
    purchases: staticPurchases,
    expenses: staticExpenses,
    summary: {
      ...staticReportSummary,
      lowStockCount: staticProducts.length,
    },
    settings: staticSettings,
    isOffline: false,
  },
  error: {
    preset: "error",
    currentUser: staticUsers.cashier,
    organization: staticOrganization,
    categories: [],
    brands: [],
    units: [],
    products: [],
    stockMovements: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    summary: {
      todaySales: 0,
      todayProfit: 0,
      todayTransactions: 0,
      totalCustomerDue: 0,
      totalSupplierPayable: 0,
      lowStockCount: 0,
    },
    settings: staticSettings,
    isOffline: false,
    errorMessage: "Unable to load data. Network timeout or connection interrupted.",
  },
  offline: {
    preset: "offline",
    currentUser: staticUsers.cashier,
    organization: staticOrganization,
    categories: staticCategories,
    brands: staticBrands,
    units: staticUnits,
    products: staticProducts,
    stockMovements: staticStockMovements,
    customers: staticCustomers,
    suppliers: staticSuppliers,
    sales: staticSales,
    purchases: staticPurchases,
    expenses: staticExpenses,
    summary: staticReportSummary,
    settings: staticSettings,
    isOffline: true,
  },
};
