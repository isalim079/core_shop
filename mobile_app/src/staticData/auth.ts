import type { StaticUser } from "./scenarioTypes";

export const staticUsers: Record<string, StaticUser> = {
  owner: {
    id: "user-owner-01",
    name: "Salim Reza",
    email: "salim@coreshop.dev",
    phone: "+880 1711 000111",
    role: "OWNER",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  manager: {
    id: "user-mgr-02",
    name: "Tanvir Ahmed",
    email: "tanvir@coreshop.dev",
    phone: "+880 1812 334455",
    role: "MANAGER",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  cashier: {
    id: "user-cashier-03",
    name: "Sadia Sultana",
    email: "sadia@coreshop.dev",
    phone: "+880 1913 778899",
    role: "CASHIER",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  stockkeeper: {
    id: "user-stock-04",
    name: "Rashedul Islam",
    email: "rashed@coreshop.dev",
    phone: "+880 1614 223344",
    role: "STOCKKEEPER",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  },
};
