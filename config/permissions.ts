// config/permissions.ts

// ======================
// NORMALIZE ROLE
// ======================

export const normalizeRole = (
    role?: string
  ): string => {
    if (!role) return '';
  
    const normalized =
      role.toLowerCase();
  
    // Backend role mappings
  
    if (normalized.includes('owner'))
      return 'owner';
  
    if (
      normalized.includes(
        'general manager'
      )
    )
      return 'general_manager';
  
    if (
      normalized.includes(
        'inventory manager'
      )
    )
      return 'inventory_manager';
  
    if (
      normalized.includes(
        'cashier'
      ) ||
      normalized.includes(
        'sales rep'
      )
    )
      return 'cashier';
  
    if (
      normalized.includes(
        'auditor'
      ) ||
      normalized.includes(
        'viewer'
      )
    )
      return 'auditor';
  
    if (
      normalized.includes(
        'accountant'
      )
    )
      return 'accountant';
  
    return normalized
      .replace(/\s+/g, '_')
      .replace('/', '_');
  };
  
  // ======================
  // DEFAULT ROUTES
  // ======================
  
  export const ROLE_REDIRECTS: Record<
    string,
    string
  > = {
    owner: '/dashboard',
  
    general_manager:
      '/dashboard',
  
    accountant:
      '/financials/transactions',
  
    inventory_manager:
      '/inventory/products',
  
    cashier: '/sales/pos',
  
    auditor: '/reports',
  };
  
  // ======================
  // ACCESS CONTROL
  // ======================
  
  export const ROLE_ACCESS: Record<
    string,
    string[]
  > = {
    owner: [
      'dashboard',
      'sales',
      'inventory',
      'financials',
      'hr',
      'analytics',
      'users',
      'profile',
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
    ],
  
    accountant: [
      'dashboard',
      'financials',
      'analytics',
      'hr',
      'profile',
    ],
  
    auditor: [
      'dashboard',
      'analytics',
      'financials',
      'profile',
    ],
  
    inventory_manager: [
      'inventory',
      'profile',
    ],
  
    cashier: [
      'sales',
      'profile',
    ],
  };
  
  // ======================
  // CHECK ACCESS
  // ======================
  
  export const hasAccess = (
    role: string,
    module: string
  ): boolean => {
    const normalizedRole =
      normalizeRole(role);
  
    const access =
      ROLE_ACCESS[
        normalizedRole
      ];
  
    if (!access) return false;
  
    return access.includes(module);
  };
  
  // ======================
  // DEFAULT ROUTE
  // ======================
  
  export const getDefaultRoute = (
    role: string
  ): string => {
    const normalizedRole =
      normalizeRole(role);
  
    return (
      ROLE_REDIRECTS[
        normalizedRole
      ] || '/dashboard'
    );
  };