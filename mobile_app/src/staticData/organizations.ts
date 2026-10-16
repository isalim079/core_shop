import type { StaticOrganization } from "./scenarioTypes";

export const staticOrganization: StaticOrganization = {
  id: "org-01",
  name: "Core Shop Retail",
  legalName: "Core Shop Enterprises Ltd.",
  currency: "BDT",
  currencySymbol: "৳",
  timezone: "Asia/Dhaka",
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
