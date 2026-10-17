import type { StaticInvitation, StaticOrganization } from "./scenarioTypes";

export const staticOrganization: StaticOrganization = {
  id: "org-01",
  name: "Core Shop Retail",
  legalName: "Core Shop Enterprises Ltd.",
  currency: "BDT",
  currencySymbol: "৳",
  timezone: "Asia/Dhaka",
  role: "OWNER",
  branches: [
    {
      id: "branch-01",
      name: "Dhanmondi Main Branch",
      code: "DHN-01",
      address: "Road 27, Dhanmondi, Dhaka 1209",
      isMain: true,
    },
    {
      id: "branch-02",
      name: "Gulshan Outlet",
      code: "GLS-02",
      address: "Circle 2, Gulshan, Dhaka 1212",
      isMain: false,
    },
    {
      id: "branch-03",
      name: "Chittagong GEC Hub",
      code: "CTG-01",
      address: "GEC Circle, Chittagong",
      isMain: false,
    },
  ],
};

export const staticOrganizationsList: StaticOrganization[] = [
  staticOrganization,
  {
    id: "org-02",
    name: "Dhaka Mega Supermarket",
    legalName: "Dhaka Mega Retail Ltd.",
    currency: "BDT",
    currencySymbol: "৳",
    timezone: "Asia/Dhaka",
    role: "MANAGER",
    branches: [
      {
        id: "branch-04",
        name: "Mirpur 10 Branch",
        code: "MIR-10",
        address: "Mirpur 10 Roundabout, Dhaka",
        isMain: true,
      },
      {
        id: "branch-05",
        name: "Uttara Sector 3 Outlet",
        code: "UTT-03",
        address: "Road 7, Sector 3, Uttara, Dhaka",
        isMain: false,
      },
    ],
  },
  {
    id: "org-03",
    name: "Chittagong Electronics & Home",
    legalName: "Chittagong Electronics Mart Ltd.",
    currency: "BDT",
    currencySymbol: "৳",
    timezone: "Asia/Dhaka",
    role: "CASHIER",
    branches: [
      {
        id: "branch-06",
        name: "Agrabad Commercial Outlet",
        code: "AGR-01",
        address: "Agrabad C/A, Chittagong",
        isMain: true,
      },
    ],
  },
];

export const staticInvitations: StaticInvitation[] = [
  {
    id: "inv-01",
    organizationName: "Rahim Wholesale & Distribution",
    inviterName: "Rahim Uddin (Owner)",
    role: "CASHIER",
    branchName: "Karwan Bazar Warehouse",
    inviteCode: "CS-8842",
    status: "PENDING",
    expiresAt: "2026-10-24T23:59:59Z",
  },
];
