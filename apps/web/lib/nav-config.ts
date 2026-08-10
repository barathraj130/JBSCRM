import type { Role } from "@indiamart-crm/shared";
import {
  LayoutDashboard,
  Users,
  Contact,
  BookImage,
  FileText,
  BarChart3,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Leads", href: "/leads", icon: Users, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Customers", href: "/customers", icon: Contact, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Catalog", href: "/catalog", icon: BookImage, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Quotations", href: "/quotations", icon: FileText, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Productivity", href: "/productivity", icon: TrendingUp, roles: ["ADMIN", "SALES_MANAGER", "EMPLOYEE"], enabled: true },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "SALES_MANAGER"], enabled: true },
  { label: "Admin Panel", href: "/admin", icon: Settings, roles: ["ADMIN"], enabled: true },
];
