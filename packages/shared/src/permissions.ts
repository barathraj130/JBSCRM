import { Role } from "./enums";

export const PERMISSION_KEYS = [
  "leads.view_all",
  "leads.assign",
  "customers.view_all",
  "productivity.view_all",
  "evidence.view_all",
  "audit.view",
  "reports.export",
  "catalogs.manage",
  "categories.manage",
  "products.manage",
  "templates.manage",
  "employees.manage",
  "permissions.manage",
  "score_config.manage",
  "calls.log",
  "followups.manage_own",
  "quotations.create",
  "customers.create",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "leads.view_all": "View all leads (not just assigned)",
  "leads.assign": "Assign / reassign leads",
  "customers.view_all": "View all customers",
  "productivity.view_all": "View productivity for all employees",
  "evidence.view_all": "View evidence for all employees",
  "audit.view": "View audit logs",
  "reports.export": "Export reports",
  "catalogs.manage": "Manage catalogs",
  "categories.manage": "Manage product categories",
  "products.manage": "Manage products",
  "templates.manage": "Manage WhatsApp templates",
  "employees.manage": "Manage employees",
  "permissions.manage": "Manage permissions",
  "score_config.manage": "Manage productivity score config",
  "calls.log": "Log calls",
  "followups.manage_own": "Manage own follow-ups",
  "quotations.create": "Create quotations",
  "customers.create": "Create customers",
};

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, PermissionKey[]> = {
  ADMIN: [...PERMISSION_KEYS],
  SALES_MANAGER: [
    "leads.view_all",
    "leads.assign",
    "customers.view_all",
    "productivity.view_all",
    "evidence.view_all",
    "audit.view",
    "reports.export",
    "calls.log",
    "followups.manage_own",
    "quotations.create",
    "customers.create",
  ],
  EMPLOYEE: ["calls.log", "followups.manage_own", "quotations.create", "customers.create"],
};
