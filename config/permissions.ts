// config/permissions.tsx

// NORMALIZE ROLE
export const normalizeRole = (role?: string): string => {
  if (!role) return '';

  const normalized = role.toLowerCase();

  // Exact matches
  if (normalized === 'owner') return 'owner';
  if (normalized === 'general manager') return 'general_manager';
  if (normalized === 'general_manager') return 'general_manager';
  if (normalized === 'inventory manager') return 'inventory_manager';
  if (normalized === 'inventory_manager') return 'inventory_manager';
  if (normalized === 'cashier') return 'cashier';
  if (normalized === 'sales rep') return 'cashier';
  if (normalized === 'sales_rep') return 'cashier';
  if (normalized === 'auditor') return 'auditor';
  if (normalized === 'accountant') return 'accountant';

  // Partial matches (fallback)
  if (normalized.includes('owner')) return 'owner';
  if (normalized.includes('general manager')) return 'general_manager';
  if (normalized.includes('inventory manager')) return 'inventory_manager';
  if (normalized.includes('cashier') || normalized.includes('sales rep')) return 'cashier';
  if (normalized.includes('auditor')) return 'auditor';
  if (normalized.includes('accountant')) return 'accountant';

  return normalized.replace(/\s+/g, '_');
};

// DEFAULT REDIRECTS AFTER LOGIN
export const ROLE_REDIRECTS: Record<string, string> = {
  owner: '/sales/pos',
  general_manager: '/sales/pos',
  accountant: '/financials/transactions',
  inventory_manager: '/inventory/products',
  cashier: '/sales/pos',
  auditor: '/audit-logs',
};

// MODULE ACCESS CONTROL
export const ROLE_ACCESS: Record<string, string[]> = {
  owner: [
    'dashboard',
    'sales',
    'inventory',
    'financials',
    'hr',
    'analytics',
    'users',
    'profile',
    'audit',
  ],

  general_manager: [
    'dashboard',
    'sales',
    'inventory',
    'financials',
    'hr',
    'analytics',
    'users',
    'profile',
    'audit',
  ],

  // Accountant
  accountant: [
    'dashboard',
    'financials',
    'hr',
    'profile',
    'audit',
  ],

  auditor: [
    'dashboard',
    'analytics',
    'financials',
    'profile',
    'audit',
  ],

  // Inventory Manager - ONLY inventory and profile
  inventory_manager: [
    'inventory',
    'profile',
  ],

  // Cashier - ONLY sales and profile
  cashier: [
    'sales',
    'profile',
  ],
};

// MENU ITEMS INTERFACE
export interface MenuItem {
  name: string;
  href: string;
  icon: string;
  children?: MenuItem[];
}

// GET MENU FOR ROLE
export const getMenuForRole = (role: string): MenuItem[] => {
  const normalizedRole = normalizeRole(role);

  // Owner & General Manager - Full access
  if (normalizedRole === 'owner' || normalizedRole === 'general_manager') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: 'FiHome' },
      {
        name: 'Sales',
        href: '/sales',
        icon: 'FiShoppingCart',
        children: [
          { name: 'Point of Sale', href: '/sales/pos', icon: 'FiCreditCard' },
          { name: 'Sales History', href: '/sales/history', icon: 'FiClock' },
          { name: 'Sales Items', href: '/sales/items', icon: 'FiPackage' },
          { name: 'Returns', href: '/sales/returns', icon: 'FiRotateCcw' },
          { name: 'Customers', href: '/sales/customers', icon: 'FiUsers' },
        ],
      },
      {
        name: 'Inventory',
        href: '/inventory',
        icon: 'FiPackage',
        children: [
          { name: 'Products', href: '/inventory/products', icon: 'FiBox' },
          { name: 'Purchase Orders', href: '/inventory/purchase-orders', icon: 'FiShoppingCart' },
          { name: 'Suppliers', href: '/inventory/suppliers', icon: 'FiTruck' },
          { name: 'Categories', href: '/inventory/categories', icon: 'FiGrid' },
          { name: 'Stock Movements', href: '/inventory/stock-movements', icon: 'FiActivity' },
        ],
      },
      {
        name: 'Financials',
        href: '/financials',
        icon: 'FiDollarSign',
        children: [
          { name: 'Transactions', href: '/financials/transactions', icon: 'FiList' },
          { name: 'Invoices', href: '/financials/invoices', icon: 'FiFileText' },
          { name: 'Petty Cash', href: '/financials/petty-cash', icon: 'FiDollarSign' },
          { name: 'Loans', href: '/financials/loans', icon: 'FiDollarSign' },
          { name: 'Budget', href: '/financials/budgets', icon: 'FiTarget' },
        ],
      },
      {
        name: 'HR',
        href: '/hr',
        icon: 'FiUsers',
        children: [
          { name: 'Departments', href: '/hr/departments', icon: 'FiBuilding' },
          { name: 'Employees', href: '/hr/employees', icon: 'FiUser' },
          { name: 'Salaries', href: '/hr/salaries', icon: 'FiDollarSign' },
          { name: 'Payroll', href: '/hr/payroll', icon: 'FiDollarSign' },
        ],
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: 'FiBarChart2',
        children: [
          { name: 'Dashboard', href: '/bi/dashboard', icon: 'FiBarChart2' },
          { name: 'Financial Analytics', href: '/bi/financial', icon: 'FiDollarSign' },
          { name: 'Sales Analytics', href: '/bi/sales', icon: 'FiShoppingCart' },
          { name: 'Inventory Analytics', href: '/bi/inventory', icon: 'FiBox' },
          { name: 'HR Analytics', href: '/bi/hr', icon: 'FiUsers' },
          { name: 'Customer Analytics', href: '/bi/customers', icon: 'FiUsers' },
          { name: 'Reports', href: '/reports', icon: 'FiFileText' },
        ],
      },
      { name: 'Users', href: '/admin/users', icon: 'FiShield' },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'FiActivity' },
      { name: 'Profile', href: '/profile', icon: 'FiUser' },
    ];
  }

  // Inventory Manager - ONLY Inventory + Profile
  if (normalizedRole === 'inventory_manager') {
    return [
      {
        name: 'Inventory',
        href: '/inventory',
        icon: 'FiPackage',
        children: [
          { name: 'Products', href: '/inventory/products', icon: 'FiBox' },
          { name: 'Purchase Orders', href: '/inventory/purchase-orders', icon: 'FiShoppingCart' },
          { name: 'Suppliers', href: '/inventory/suppliers', icon: 'FiTruck' },
          { name: 'Categories', href: '/inventory/categories', icon: 'FiGrid' },
          { name: 'Stock Movements', href: '/inventory/stock-movements', icon: 'FiActivity' },
        ],
      },
      { name: 'Profile', href: '/profile', icon: 'FiUser' },
    ];
  }

  // Accountant - Financials + HR + Audit
  if (normalizedRole === 'accountant') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: 'FiHome' },
      {
        name: 'Financials',
        href: '/financials',
        icon: 'FiDollarSign',
        children: [
          { name: 'Transactions', href: '/financials/transactions', icon: 'FiList' },
          { name: 'Invoices', href: '/financials/invoices', icon: 'FiFileText' },
          { name: 'Petty Cash', href: '/financials/petty-cash', icon: 'FiDollarSign' },
          { name: 'Loans', href: '/financials/loans', icon: 'FiDollarSign' },
          { name: 'Budget', href: '/financials/budgets', icon: 'FiTarget' },
        ],
      },
      {
        name: 'HR',
        href: '/hr',
        icon: 'FiUsers',
        children: [
          { name: 'Departments', href: '/hr/departments', icon: 'FiBuilding' },
          { name: 'Employees', href: '/hr/employees', icon: 'FiUser' },
          { name: 'Salaries', href: '/hr/salaries', icon: 'FiDollarSign' },
          { name: 'Payroll', href: '/hr/payroll', icon: 'FiDollarSign' },
        ],
      },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'FiActivity' },
      { name: 'Profile', href: '/profile', icon: 'FiUser' },
    ];
  }

  // Auditor - Read-only analytics, financials, and audit
  if (normalizedRole === 'auditor') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: 'FiHome' },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: 'FiBarChart2',
        children: [
          { name: 'Dashboard', href: '/bi/dashboard', icon: 'FiBarChart2' },
          { name: 'Financial Analytics', href: '/bi/financial', icon: 'FiDollarSign' },
          { name: 'Sales Analytics', href: '/bi/sales', icon: 'FiShoppingCart' },
          { name: 'Inventory Analytics', href: '/bi/inventory', icon: 'FiBox' },
          { name: 'Customer Analytics', href: '/bi/customers', icon: 'FiUsers' },
          { name: 'Reports', href: '/reports', icon: 'FiFileText' },
        ],
      },
      {
        name: 'Financials',
        href: '/financials',
        icon: 'FiDollarSign',
        children: [
          { name: 'Reports', href: '/financials/reports', icon: 'FiBarChart2' },
        ],
      },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'FiActivity' },
      { name: 'Profile', href: '/profile', icon: 'FiUser' },
    ];
  }

  // Cashier - ONLY Sales + Profile
  if (normalizedRole === 'cashier') {
    return [
      { name: 'Point of Sale', href: '/sales/pos', icon: 'FiCreditCard' },
      { name: 'Sales History', href: '/sales/history', icon: 'FiClock' },
      { name: 'Customers', href: '/sales/customers', icon: 'FiUsers' },
      { name: 'Returns', href: '/sales/returns', icon: 'FiRotateCcw' },
      { name: 'Profile', href: '/profile', icon: 'FiUser' },
    ];
  }

  // Default fallback - only profile
  return [{ name: 'Profile', href: '/profile', icon: 'FiUser' }];
};

// CHECK ACCESS FOR MODULE
export const hasAccess = (role: string, module: string): boolean => {
  const normalizedRole = normalizeRole(role);
  const access = ROLE_ACCESS[normalizedRole];
  if (!access) return false;
  return access.includes(module);
};

// ACTION PERMISSIONS
export interface ActionPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export const getActionPermissions = (role: string, module: string): ActionPermissions => {
  const normalizedRole = normalizeRole(role);

  // Owner - Full permissions
  if (normalizedRole === 'owner') {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
  }

  // General Manager - Full except delete
  if (normalizedRole === 'general_manager') {
    return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
  }

  // Inventory Manager - Inventory permissions
  if (normalizedRole === 'inventory_manager') {
    if (module === 'inventory') {
      return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
    }
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }

  // Accountant - Financial permissions (NO analytics)
  if (normalizedRole === 'accountant') {
    if (module === 'financials') {
      return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
    }
    if (module === 'hr') {
      return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
    }
    if (module === 'audit') {
      return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true };
    }
    return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }

  // Auditor - Read only
  if (normalizedRole === 'auditor') {
    if (module === 'audit') {
      return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true };
    }
    return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }

  // Cashier - Limited
  if (normalizedRole === 'cashier') {
    if (module === 'sales') {
      return { canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: false };
    }
    if (module === 'customers') {
      return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false };
    }
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }

  // Default - No access
  return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
};

// GET DEFAULT ROUTE AFTER LOGIN
export const getDefaultRoute = (role: string): string => {
  const normalizedRole = normalizeRole(role);
  return ROLE_REDIRECTS[normalizedRole] || '/profile';
};

// CAN ACCESS PAGE (for route guarding)
export const canAccessPage = (role: string, pathname: string): boolean => {
  const normalizedRole = normalizeRole(role);
  
  // Everyone can access profile
  if (pathname === '/profile') return true;
  
  // Audit logs access - only for owner, general_manager, accountant, auditor
  if (pathname === '/audit-logs' || pathname.startsWith('/audit-logs')) {
    if (normalizedRole === 'owner') return true;
    if (normalizedRole === 'general_manager') return true;
    if (normalizedRole === 'accountant') return true;
    if (normalizedRole === 'auditor') return true;
    return false;
  }
  
  // Extract module from pathname (first part of URL)
  const module = pathname.split('/')[1];
  
  // Inventory Manager can ONLY access inventory and profile
  if (normalizedRole === 'inventory_manager') {
    if (module === 'inventory') return true;
    return false;
  }
  
  // Cashier can ONLY access sales and profile
  if (normalizedRole === 'cashier') {
    if (module === 'sales') return true;
    return false;
  }
  
  // Auditor can access analytics, financials, dashboard, audit
  if (normalizedRole === 'auditor') {
    if (module === 'analytics') return true;
    if (module === 'financials') return true;
    if (module === 'dashboard') return true;
    if (module === 'audit') return true;
    return false;
  }
  
  // Accountant can access financials, hr, dashboard, audit
  if (normalizedRole === 'accountant') {
    if (module === 'financials') return true;
    if (module === 'hr') return true;
    if (module === 'dashboard') return true;
    if (module === 'audit') return true;
    return false;
  }
  
  // Owner and General Manager can access everything
  if (normalizedRole === 'owner' || normalizedRole === 'general_manager') {
    return true;
  }
  
  // Default - check module access
  return hasAccess(role, module);
};