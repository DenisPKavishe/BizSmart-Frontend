// lib/permissions.ts
export const getUserRole = (user: any) => {
    const role = user?.role?.name?.toLowerCase();
    return {
      isCashier: role === 'cashier' || role === 'sales_rep',
      isManager: role === 'general_manager' || role === 'owner',
      isAccountant: role === 'accountant',
      isAuditor: role === 'auditor',
      role: role,
    };
  };
  
  export const getPagePermissions = (user: any) => {
    const { isCashier, isManager, isAccountant, isAuditor } = getUserRole(user);
    
    return {
      canViewAnalytics: !isCashier,
      canViewProfit: isManager || isAccountant,
      canViewFinancialReports: isManager || isAccountant || isAuditor,
      canViewAllSales: isManager || isAccountant || isAuditor,
      canProcessSales: true,
      canProcessReturns: isManager,
      canViewAllCustomers: isManager || isAccountant,
      canManageCustomers: true,
      canViewReturnAnalytics: !isCashier,
      canViewProfitMargin: isManager || isAccountant,
      canDelete: isManager,
      canExport: isManager || isAccountant,
    };
  };