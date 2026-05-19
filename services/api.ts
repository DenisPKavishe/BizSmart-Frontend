// services/api.ts
import api from '@/lib/api';

// ==================== AUTHENTICATION ====================
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login/', { email, password }),
  
  register: (data: any) => 
    api.post('/auth/register/', data),
  
  logout: (refreshToken: string) => 
    api.post('/auth/logout/', { refresh: refreshToken }),
  
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh/', { refresh: refreshToken }),
  
  getProfile: () => 
    api.get('/auth/profile/'),
  
  updateProfile: (data: any) => 
    api.patch('/auth/profile/', data),
};

// ==================== DASHBOARD & BI ====================
export const biApi = {
  getDashboard: () => 
    api.get('/bi/dashboard/'),
  
  getTrends: (days: number = 30) => 
    api.get(`/bi/trends/?days=${days}`),
  
  getTopProducts: (limit: number = 10) => 
    api.get(`/bi/top-products/?limit=${limit}`),
  
  getSlowProducts: (days: number = 30) => 
    api.get(`/bi/slow-products/?days=${days}`),
  
  getCustomerInsights: () => 
    api.get('/bi/customer-insights/'),
  
  getForecast: (days: number = 30) => 
    api.get(`/bi/forecast/?days=${days}`),
  
  getInsights: () => 
    api.get('/bi/insights/'),
  
  getProfitLoss: (startDate?: string, endDate?: string) => 
    api.get('/bi/profit-loss/', { params: { start_date: startDate, end_date: endDate } }),
  
  getExecutiveDashboard: () => 
    api.get('/bi/executive/'),
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
  
  getStockMovements: () => 
    api.get('/inventory/stock/movements/'),
  
  // Purchase Orders
  getPurchaseOrders: () => 
    api.get('/inventory/purchase-orders/'),
  
  createPurchaseOrder: (data: any) => 
    api.post('/inventory/purchase-orders/', data),
  
  receivePurchaseOrder: (id: number) => 
    api.post(`/inventory/purchase-orders/${id}/receive/`),
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
  
  // Returns
  getReturns: () => 
    api.get('/sales/returns/'),
  
  processReturn: (data: any) => 
    api.post('/sales/returns/process/', data),
  
  // Reports
  getDailySalesReport: (days: number = 7) => 
    api.get(`/sales/reports/daily/?days=${days}`),
  
  getTodaySales: () => 
    api.get('/sales/reports/today/'),
};

// ==================== HR ====================
export const hrApi = {
  // Departments
  getDepartments: () => 
    api.get('/hr/departments/'),
  
  createDepartment: (data: any) => 
    api.post('/hr/departments/', data),
  
  // Employees
  getEmployees: () => 
    api.get('/hr/employees/'),
  
  getEmployee: (id: number) => 
    api.get(`/hr/employees/${id}/`),
  
  createEmployee: (data: any) => 
    api.post('/hr/employees/', data),
  
  updateEmployee: (id: number, data: any) => 
    api.put(`/hr/employees/${id}/`, data),
  
  deleteEmployee: (id: number) => 
    api.delete(`/hr/employees/${id}/`),
  
    getSalaries: () => 
    api.get('/hr/salaries/'),
  
  getSalary: (id: number) => 
    api.get(`/hr/salaries/${id}/`),
  
  createSalary: (data: any) => 
    api.post('/hr/salaries/', data),
  
  updateSalary: (id: number, data: any) => 
    api.put(`/hr/salaries/${id}/`, data),
  
  deleteSalary: (id: number) => 
    api.delete(`/hr/salaries/${id}/`),
  
  // Payroll
  getPayrolls: () => 
    api.get('/hr/payroll/'),
  
  processPayroll: (month: number, year: number, includeCommission?: boolean) => 
    api.post('/hr/payroll/process/', { month, year, include_commission: includeCommission }),
  
  markPayrollPaid: (id: number) => 
    api.post(`/hr/payroll/${id}/mark-paid/`),
  
  // Reports
  getSalesByEmployee: (month?: number, year?: number) => 
    api.get('/hr/reports/sales-by-employee/', { params: { month, year } }),
  
  getTopPerformers: (limit: number = 10, days: number = 30) => 
    api.get(`/hr/reports/top-performers/?limit=${limit}&days=${days}`),
  
  getPayrollReport: (year: number) => 
    api.get(`/hr/reports/payroll/?year=${year}`),
};