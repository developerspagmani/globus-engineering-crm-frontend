export type UserRole = 'super_admin' | 'company_admin' | 'manager' | 'staff' | 'sales_agent' | 'sales';

export interface NavItem {
  name: string;
  icon: string;
  path: string;
  moduleId: string; // The primary key used to check against user.allowedModules
  children?: NavItem[]; // Optional child items for dropdowns like Reports
}

/**
 * Navigation configuration.
 * Roles are no longer hardcoded here. Instead, each item is tied to a moduleId.
 * The User object returned by the API will specify which moduleIds that user can access.
 */
export const navigationConfig: NavItem[] = [
  { name: 'Dashboard', icon: 'bi-grid-1x2', path: '/dashboard', moduleId: 'default' },
  { name: 'Customer', icon: 'bi-people', path: '/customers', moduleId: 'mod_customer' },
  { name: 'Item', icon: 'bi-box-seam', path: '/master/items', moduleId: 'mod_items' },
  { name: 'Process', icon: 'bi-gear-wide-connected', path: '/master/processes', moduleId: 'mod_processes' },
  
  { name: 'Inward', icon: 'bi-box-arrow-in-right', path: '/inward', moduleId: 'mod_inward' },
  { name: 'Outward', icon: 'bi-box-arrow-up-right', path: '/outward', moduleId: 'mod_outward' },
  { name: 'Challan', icon: 'bi-file-earmark-check', path: '/challan', moduleId: 'mod_challan' },
  { name: 'Vouchers', icon: 'bi-receipt', path: '/vouchers', moduleId: 'mod_voucher' },
  { name: 'Invoice', icon: 'bi-file-earmark-spreadsheet', path: '/invoices', moduleId: 'mod_invoice' },
  { name: 'Ledger', icon: 'bi-journal-check', path: '/ledger', moduleId: 'mod_ledger' },
  { name: 'Pending Payment', icon: 'bi-clock-history', path: '/payments/pending', moduleId: 'mod_pending_payment' },
  { name: 'Active Sales Area', icon: 'bi-geo-alt', path: '/sales-map', moduleId: 'mod_sales_hub' },
  { name: 'Price Fixing', icon: 'bi-tags', path: '/master/price-fixing', moduleId: 'mod_price_fixing' },
  { name: 'Employee Management', icon: 'bi-person-badge', path: '/employees', moduleId: 'mod_employee' },
  { name: 'User Management', icon: 'bi-person-gear', path: '/users', moduleId: 'mod_user_management' },
  { name: 'Lead Management', icon: 'bi-funnel', path: '/leads', moduleId: 'mod_lead' },
  { name: 'Field Stores', icon: 'bi-shop', path: '/stores', moduleId: 'mod_lead' }, // Shares lead module permission for now
  { name: 'GSTN Lookup', icon: 'bi-shield-check', path: '/gst-lookup', moduleId: 'default' },
  { name: 'Sales Hub', icon: 'bi-graph-up-arrow', path: '/sales-hub', moduleId: 'mod_sales_hub' },

  // Reports
  { 
    name: 'Reports', 
    icon: 'bi-file-earmark-text', 
    path: '#', 
    moduleId: 'default',
    children: [
      { name: 'Payment Report', icon: 'bi-cash-stack', path: '/reports/payment', moduleId: 'mod_voucher' },
      { name: 'Invoice Report', icon: 'bi-file-earmark-bar-graph', path: '/reports/invoice', moduleId: 'mod_invoice' },
      { name: 'Inward Report', icon: 'bi-box-arrow-in-left', path: '/reports/inward', moduleId: 'mod_inward' },
      // { name: 'Voucher', icon: 'bi-receipt-cutoff', path: '/reports/voucher', moduleId: 'mod_voucher' },
      { name: 'GST Report', icon: 'bi-file-text', path: '/reports/gst', moduleId: 'mod_invoice' },
    ]
  },

  { name: 'Companies', icon: 'bi-building', path: '/admin/companies', moduleId: 'super_admin' },
  { name: 'Settings', icon: 'bi-gear', path: '/settings', moduleId: 'default' },
];

export interface ModulePermission {
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type PermissionUser = {
  role: string;
  modulePermissions?: ModulePermission[];
};

/**
 * Utility to check if a user can access a navigation item based on 
 * their modulePermissions (provided by API/Data) and the company's active profile.
 * Just requires 'canRead' permission.
 */
export const hasPermission = (
  item: NavItem, 
  user: PermissionUser | null | undefined, 
  companyModules: string[] | undefined
): boolean => {
  if (!user) return false;

  // 1. Super Admin Role Check (Always has access to everything)
  if (user.role === 'super_admin') return true;

  // 3. Special Case: super_admin only items (like Companies)
  if (item.moduleId === 'super_admin') return false; // Non-super-admins cannot see this

  // 4. Company Admin Role Check (Bypasses regular module/read permissions)
  if (user.role === 'company_admin') return true;

  // 5. Default Access (items like Dashboard/Settings that don't belong to a specific paid module)
  if (item.moduleId === 'default') {
    // Hide Dashboard for sales and staff roles
    if (item.name === 'Dashboard' && (user.role === 'sales' || user.role === 'staff')) {
      return false;
    }
    return true;
  }

  // 6. Module check: Is this module active for the organization?
  if (user.role !== 'sales_agent') {
    const isModuleActive = companyModules?.includes(item.moduleId);
    if (!isModuleActive) return false;
  }

  // 7. User specific module read permission check
  if (!user.modulePermissions) return false;
  const perm = user.modulePermissions.find(p => p.moduleId === item.moduleId);
  return perm ? perm.canRead : false;
};

/**
 * Utility function to check specific action permissions (Create, Edit, Delete).
 * Will be used inside component pages (e.g., hiding the "New Lead" button if !canCreate).
 */
export const checkActionPermission = (
  user: PermissionUser | null | undefined,
  moduleId: string,
  action: 'create' | 'edit' | 'delete'
): boolean => {
  if (!user || !user.modulePermissions) return false;
  
  // Super Admin & Company Admin bypass
  if (user.role === 'super_admin' || user.role === 'company_admin') return true;
  
  const perm = user.modulePermissions.find(p => p.moduleId === moduleId);
  if (!perm) return false;
  
  switch (action) {
    case 'create': return perm.canCreate;
    case 'edit': return perm.canEdit;
    case 'delete': return perm.canDelete;
    default: return false;
  }
};
