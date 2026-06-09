// services/api.ts
import api from '@/lib/api';

// ==================== AUTHENTICATION ====================
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login/', { email, password }),
  
  register: (data: any) => 
    api.post('/auth/register/', data),
  
  getUsers: () => 
    api.get('/auth/users/'),
  
  updateUser: (userId: number, data: any) => 
    api.patch(`/auth/users/${userId}/`, data),
  
  deleteUser: (userId: number) => 
    api.delete(`/auth/users/${userId}/`),  

  changePassword: (data: { email: string; current_password: string; new_password: string }) => 
    api.post('/auth/password-reset/', data),  
  
  logout: (refreshToken: string) => 
    api.post('/auth/logout/', { refresh: refreshToken }),
  
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh/', { refresh: refreshToken }),
  
  getProfile: () => 
    api.get('/auth/profile/'),
  
  updateProfile: (data: { username?: string; phone?: string }) => 
    api.patch('/auth/profile/', data),
};

// ==================== DASHBOARD & BI ====================
export const biApi = {
  // Main Dashboard
  getMainDashboard: (params?: { month?: string }) => 
    api.get('/bi/dashboard/', { params }),
  
  getDashboardTrends: (params?: { days?: number }) => 
    api.get('/bi/dashboard/trends/', { params }),
  
  getDashboardAlerts: () => 
    api.get('/bi/dashboard/alerts/'),
  
  getDashboardMilestones: () => 
    api.get('/bi/dashboard/milestones/'),
  
  getAvailableMonths: () => 
    api.get('/bi/dashboard/available-months/'),
  
  // KPI & Trends
  getKPIDashboard: () => 
    api.get('/bi/kpi/'),
  
  getTrends: (params?: { days?: number }) => 
    api.get('/bi/trends/', { params }),
  
  // Sales Analytics
  getTopProducts: (params?: { limit?: number }) => 
    api.get('/bi/sales/top-products/', { params }),
  
  getSalesPerformance: (params?: { period?: string }) => 
    api.get('/bi/sales/performance/', { params }),
  
  getSalesForecast: (params?: { days?: number }) => 
    api.get('/bi/sales/forecast/', { params }),
  
  // Inventory Analytics
  getInventoryAnalytics: () => 
    api.get('/bi/inventory/analytics/'),
  
  getSlowMovingProducts: (params?: { days?: number }) => 
    api.get('/bi/inventory/slow-moving/', { params }),
  
  // Customer Analytics
  getCustomerInsights: () => 
    api.get('/bi/customer/insights/'),
  
  // Financial Analytics
  getFinancialSummary: () => 
    api.get('/bi/financial/summary/'),
  
  getProfitLoss: (params?: { days?: number }) => 
    api.get('/bi/financial/profit-loss/', { params }),
  
  // HR Analytics
  getHRAnalytics: () => 
    api.get('/bi/hr/analytics/'),
  
  // Insights
  getInsights: () => 
    api.get('/bi/insights/'),
  
  markInsightRead: (id: number) => 
    api.post(`/bi/insights/${id}/mark-read/`),
  
  // Goals
  getGoals: () => 
    api.get('/bi/goals/'),
  
  createGoal: (data: any) => 
    api.post('/bi/goals/', data),
  
  updateGoal: (id: number, data: any) => 
    api.patch(`/bi/goals/${id}/`, data),
  
  deleteGoal: (id: number) => 
    api.delete(`/bi/goals/${id}/`),
  
  // Widgets
  getDashboardWidgets: (userId?: number) => 
    api.get('/bi/widgets/', { params: { user_id: userId } }),
  
  createDashboardWidget: (data: any) => 
    api.post('/bi/widgets/', data),
  
  reorderWidgets: (widgetIds: number[]) => 
    api.post('/bi/widgets/reorder/', { widget_ids: widgetIds }),
  
  // Executive Dashboard
  getExecutiveDashboard: () => 
    api.get('/bi/executive/'),
  
  // Cache
  clearBICache: () => 
    api.post('/bi/clear-cache/'),
};

// ==================== FINANCIALS ====================
export const financialsApi = {
  // Transactions
  getTransactions: (params?: any) => 
    api.get('/financials/transactions/', { params }),
  
  createTransaction: (data: any) => 
    api.post('/financials/transactions/', data),
  
  updateTransaction: (id: number, data: any) => 
    api.put(`/financials/transactions/${id}/`, data),
  
  deleteTransaction: (id: number) => 
    api.delete(`/financials/transactions/${id}/`),
  
  // Invoices
  getInvoices: (params?: any) => 
    api.get('/financials/invoices/', { params }),
  
  createInvoice: (data: any) => 
    api.post('/financials/invoices/', data),
  
  updateInvoice: (id: number, data: any) => 
    api.put(`/financials/invoices/${id}/`, data),

  deleteInvoice: (id: number) =>   
    api.delete(`/financials/invoices/${id}/`),  
  
  recordPayment: (id: number, amount: number) => 
    api.post(`/financials/invoices/${id}/pay/`, { amount }),


// petty cash
getPettyCash: (params?: any) => 
  api.get('/financials/petty-cash/', { params }),

createPettyCash: (data: any) => 
  api.post('/financials/petty-cash/', data),

updatePettyCash: (id: number, data: any) => 
  api.put(`/financials/petty-cash/${id}/`, data),

deletePettyCash: (id: number) => 
  api.delete(`/financials/petty-cash/${id}/`),
  
  // Loans
  getLoans: (params?: any) => 
  api.get('/financials/loans/', { params }),

  createLoan: (data: any) => 
  api.post('/financials/loans/', data),

  updateLoan: (id: number, data: any) => 
  api.put(`/financials/loans/${id}/`, data),

  deleteLoan: (id: number) => 
  api.delete(`/financials/loans/${id}/`),

  // Budget CRUD
getBudgets: (params?: any) => api.get('/financials/budgets/', { params }),
getBudget: (id: number) => api.get(`/financials/budgets/${id}/`),
createBudget: (data: any) => api.post('/financials/budgets/', data),  // Important: ONE request with items array
updateBudget: (id: number, data: any) => api.patch(`/financials/budgets/${id}/`, data),
deleteBudget: (id: number) => api.delete(`/financials/budgets/${id}/`),
getBudgetVsActual: (id: number) => api.get(`/financials/budgets/${id}/vs-actual/`),
copyBudget: (id: number, data: any) => api.post(`/financials/budgets/${id}/copy/`, data),

// Budget Items (optional - for individual item operations)
addBudgetItem: (budgetId: number, data: any) => api.post(`/financials/budgets/${budgetId}/items/`, data),
updateBudgetItem: (budgetId: number, itemId: number, data: any) => api.patch(`/financials/budgets/${budgetId}/items/${itemId}/`, data),
deleteBudgetItem: (budgetId: number, itemId: number) => api.delete(`/financials/budgets/${budgetId}/items/${itemId}/`),
  
  
  // Cash Flow
  getCashFlow: () => 
    api.get('/financials/cash-flow/'),
  
  getFinancialDashboard: () => 
    api.get('/financials/dashboard/'),
  
  exportReport: (format: string = 'csv', startDate?: string, endDate?: string) => 
    api.get('/financials/export/', { params: { format, start_date: startDate, end_date: endDate } }),
};

// ==================== INVENTORY ====================
export const inventoryApi = {
  // Categories
  getCategories: () => 
    api.get('/inventory/categories/'),
  
  createCategory: (data: any) => 
    api.post('/inventory/categories/', data),
  
  updateCategory: (id: number, data: any) => 
    api.put(`/inventory/categories/${id}/`, data),
  
  deleteCategory: (id: number) => 
    api.delete(`/inventory/categories/${id}/`),
  
  // Suppliers
  getSuppliers: () => 
    api.get('/inventory/suppliers/'),
  
  createSupplier: (data: any) => 
    api.post('/inventory/suppliers/', data),
  
  updateSupplier: (id: number, data: any) => 
    api.put(`/inventory/suppliers/${id}/`, data),
  
  deleteSupplier: (id: number) => 
    api.delete(`/inventory/suppliers/${id}/`),
  
  // Products
  getProducts: (params?: any) => 
    api.get('/inventory/products/', { params }),
  
  getProduct: (id: number) => 
    api.get(`/inventory/products/${id}/`),
  
  createProduct: (data: any) => 
    api.post('/inventory/products/', data),
  
  updateProduct: (id: number, data: any) => 
    api.put(`/inventory/products/${id}/`, data),
  
  deleteProduct: (id: number) => 
    api.delete(`/inventory/products/${id}/`),
  
  getLowStockProducts: () => 
    api.get('/inventory/products/low-stock/'),
  
  // Stock Movements
  stockIn: (productId: number, quantity: number, unitCost: number, notes?: string) => 
    api.post('/inventory/stock/in/', { product_id: productId, quantity, unit_cost: unitCost, notes }),
  
  stockOut: (productId: number, quantity: number, reason?: string, notes?: string) => 
    api.post('/inventory/stock/out/', { product_id: productId, quantity, reason, notes }),

  
  // Purchase Orders
  getPurchaseOrders: () => api.get('/inventory/purchase-orders/'),
  
  getPurchaseOrder: (id: number) => api.get(`/inventory/purchase-orders/${id}/`),

  receivePurchaseOrder: (poId: number, data: any) => 
    api.post(`/inventory/purchase-orders/${poId}/receive/`, data),
  
  createPurchaseOrder: (data: any) => api.post('/inventory/purchase-orders/', data),
  
  updatePurchaseOrder: (id: number, data: any) => api.put(`/inventory/purchase-orders/${id}/`, data),
  
  deletePurchaseOrder: (id: number) => api.delete(`/inventory/purchase-orders/${id}/`),
  
  receivePurchaseOrderItem: (poId: number, data: any) => 
    api.post(`/inventory/purchase-orders/${poId}/receive/`, data),

  getProductByBarcode: (barcode: string) => 
    api.get(`/inventory/products/barcode/${barcode}/`),  

  getSlowMovingProducts: () => 
    api.get('/bi/inventory/slow-moving/'),
  
  // Get stock movements with filters
  getStockMovements: (params?: { start_date?: string; end_date?: string; page_size?: number }) => 
     api.get('/inventory/stock/movements/', { params }),
  
  // Get top products with date filter
  getTopProductsWithDate: (params?: { limit?: number; start_date?: string; end_date?: string }) => 
    api.get('/bi/sales/top-products/', { params }),  
};  

// ==================== SALES ====================
export const salesApi = {
  // Customers
  getCustomers: () => 
    api.get('/sales/customers/'),
  
  createCustomer: (data: any) => 
    api.post('/sales/customers/', data),
  
  updateCustomer: (id: number, data: any) => 
    api.put(`/sales/customers/${id}/`, data),
  
  deleteCustomer: (id: number) => 
    api.delete(`/sales/customers/${id}/`),
  
  // Sales
  getSales: (params?: any) => 
    api.get('/sales/sales/', { params }),
  
  getSale: (id: number) => 
    api.get(`/sales/sales/${id}/`),
  
  processSale: (data: any) => 
    api.post('/sales/sales/process/', data),
  
  getReceipt: (id: number) => 
    api.get(`/sales/sales/${id}/receipt/`),
  
  // Returns Management
  getReturns: (params?: any) => 
    api.get('/sales/returns/', { params }),

  getReturn: (id: number) => 
    api.get(`/sales/returns/${id}/`),

  createReturn: (data: any) => 
    api.post('/sales/returns/', data),

  updateReturn: (id: number, data: any) => 
    api.put(`/sales/returns/${id}/`, data),

  deleteReturn: (id: number) => 
    api.delete(`/sales/returns/${id}/`),
  
  // Reports
  getDailySalesReport: (days: number = 7) => 
    api.get(`/sales/reports/daily/?days=${days}`),
  
  getTodaySales: () => 
    api.get('/sales/reports/today/'),

  // getDailyReport: (days?: number) => 
  //   api.get('/sales/reports/daily/', { params: { days } }),
  
  // getTodayReport: () => 
  //   api.get('/sales/reports/today/'), 
    
  getDailyReport: (params?: { days?: number }) => 
    api.get('/sales/reports/daily/', { params }),

  getTodayReport: () => 
    api.get('/sales/reports/today/'),

  getSalesByDateRange: (startDate: string, endDate: string) => 
    api.get('/sales/sales/', { params: { start_date: startDate, end_date: endDate, page_size: 1000 } }),  

  getSaleItems: () => api.get('/sales/items/'),
  getSaleItem: (id: number) => api.get(`/sales/items/${id}/`),
  createSaleItem: (data: any) => api.post('/sales/items/', data),
  updateSaleItem: (id: number, data: any) => api.put(`/sales/items/${id}/`, data),
  patchSaleItem: (id: number, data: any) => api.patch(`/sales/items/${id}/`, data),
  deleteSaleItem: (id: number) => api.delete(`/sales/items/${id}/`),  
};

// // ==================== HR ====================
// export const hrApi = {
//   // Departments
//   getDepartments: () => 
//     api.get('/hr/departments/'),
  
//   createDepartment: (data: any) => 
//     api.post('/hr/departments/', data),
  
//   // Employees
//   getEmployees: () => 
//     api.get('/hr/employees/'),
  
//   getEmployee: (id: number) => 
//     api.get(`/hr/employees/${id}/`),
  
//   createEmployee: (data: any) => 
//     api.post('/hr/employees/', data),
  
//   updateEmployee: (id: number, data: any) => 
//     api.put(`/hr/employees/${id}/`, data),
  
//   deleteEmployee: (id: number) => 
//     api.delete(`/hr/employees/${id}/`),
  
//     getSalaries: () => 
//     api.get('/hr/salaries/'),
  
//   getSalary: (id: number) => 
//     api.get(`/hr/salaries/${id}/`),
  
//   createSalary: (data: any) => 
//     api.post('/hr/salaries/', data),
  
//   updateSalary: (id: number, data: any) => 
//     api.put(`/hr/salaries/${id}/`, data),
  
//   deleteSalary: (id: number) => 
//     api.delete(`/hr/salaries/${id}/`),
  
//   // Payroll
//   getPayrolls: () => 
//     api.get('/hr/payroll/'),
  
//   processPayroll: (month: number, year: number, includeCommission?: boolean) => 
//     api.post('/hr/payroll/process/', { month, year, include_commission: includeCommission }),
  
//   markPayrollPaid: (id: number) => 
//     api.post(`/hr/payroll/${id}/mark-paid/`),
  
//   // Reports
//   getSalesByEmployee: (month?: number, year?: number) => 
//     api.get('/hr/reports/sales-by-employee/', { params: { month, year } }),
  
//   getTopPerformers: (limit: number = 10, days: number = 30) => 
//     api.get(`/hr/reports/top-performers/?limit=${limit}&days=${days}`),
  
//   getPayrollReport: (year: number) => 
//     api.get(`/hr/reports/payroll/?year=${year}`),
// };


// services/api.ts - Add these to your existing hrApi

export const hrApi = {
  // Departments
  getDepartments: () => api.get('/hr/departments/'),
  getDepartment: (id: number) => api.get(`/hr/departments/${id}/`),
  createDepartment: (data: any) => api.post('/hr/departments/', data),
  updateDepartment: (id: number, data: any) => api.put(`/hr/departments/${id}/`, data),
  patchDepartment: (id: number, data: any) => api.patch(`/hr/departments/${id}/`, data),
  deleteDepartment: (id: number) => api.delete(`/hr/departments/${id}/`),
  
  // Employees
  getEmployees: () => api.get('/hr/employees/'),
  getEmployee: (id: number) => api.get(`/hr/employees/${id}/`),
  createEmployee: (data: any) => api.post('/hr/employees/', data),
  updateEmployee: (id: number, data: any) => api.put(`/hr/employees/${id}/`, data),
  deleteEmployee: (id: number) => api.delete(`/hr/employees/${id}/`),
  
  // Salaries
  getSalaries: () => api.get('/hr/salaries/'),
  getSalary: (id: number) => api.get(`/hr/salaries/${id}/`),
  createSalary: (data: any) => api.post('/hr/salaries/', data),
  updateSalary: (id: number, data: any) => api.put(`/hr/salaries/${id}/`, data),
  deleteSalary: (id: number) => api.delete(`/hr/salaries/${id}/`),
  
  // Payroll - Existing Endpoints Only
  getPayrolls: () => api.get('/hr/payroll/'),
  getPayroll: (id: number) => api.get(`/hr/payroll/${id}/`),
  processPayroll: (month: number, year: number) => 
    api.post('/hr/payroll/process/', { month, year }),
  markPayrollPaid: (id: number) => 
    api.post(`/hr/payroll/${id}/mark-paid/`),
};