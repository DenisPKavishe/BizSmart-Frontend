// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, salesApi, inventoryApi, financialsApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiAlertCircle,
  FiUsers,
  FiRefreshCw,
  FiShoppingCart,
  FiActivity,
  FiChevronRight,
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// Types
interface DashboardStats {
  revenue: { current: number; previous: number; change: number; trend: string };
  expenses: { current: number; previous: number; change: number; trend: string };
  profit: { current: number; previous: number; change: number; trend: string };
  inventory: { total_value: number; low_stock_items: number };
  customers: { total: number; new_this_month: number };
  sales: { total_transactions: number; average_order_value: number };
  employees: { total: number; revenue_per_employee: number };
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  quantity_on_hand: number;
  reorder_level: number;
  buying_price?: number;
  selling_price?: number;
}

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface RecentSale {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_method: string;
  sale_date: string;
  items?: SaleItem[];
}

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Custom tooltip for chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-brand-600">
          Revenue: TZS {toNumber(payload[0]?.value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [kpiRes, trendsRes, lowStockRes, salesRes, transactionsRes] = await Promise.all([
        biApi.getDashboard().catch(() => ({ data: null })),
        biApi.getTrends(180).catch(() => ({ data: null })),
        inventoryApi.getLowStockProducts().catch(() => ({ data: null })),
        salesApi.getSales({ page: 1, page_size: 10 }).catch(() => ({ data: null })),
        financialsApi.getTransactions({ page: 1, page_size: 100 }).catch(() => ({ data: null })),
      ]);

      // Process KPI data
      if (kpiRes.data) {
        const kpiData = kpiRes.data;
        setStats({
          revenue: {
            current: toNumber(kpiData.revenue?.current),
            previous: toNumber(kpiData.revenue?.previous),
            change: toNumber(kpiData.revenue?.change),
            trend: kpiData.revenue?.trend || 'up'
          },
          expenses: {
            current: toNumber(kpiData.expenses?.current),
            previous: toNumber(kpiData.expenses?.previous),
            change: toNumber(kpiData.expenses?.change),
            trend: kpiData.expenses?.trend || 'up'
          },
          profit: {
            current: toNumber(kpiData.profit?.current),
            previous: toNumber(kpiData.profit?.previous),
            change: toNumber(kpiData.profit?.change),
            trend: kpiData.profit?.trend || 'up'
          },
          inventory: {
            total_value: toNumber(kpiData.inventory?.total_value),
            low_stock_items: toNumber(kpiData.inventory?.low_stock_items)
          },
          customers: {
            total: toNumber(kpiData.customers?.total),
            new_this_month: toNumber(kpiData.customers?.new_this_month)
          },
          sales: {
            total_transactions: toNumber(kpiData.sales?.total_transactions),
            average_order_value: toNumber(kpiData.sales?.average_order_value)
          },
          employees: {
            total: toNumber(kpiData.employees?.total),
            revenue_per_employee: toNumber(kpiData.employees?.revenue_per_employee)
          }
        });
      } else {
        // Fallback: Calculate from transactions
        if (transactionsRes.data && transactionsRes.data.results) {
          const transactions = transactionsRes.data.results;
          let totalIncome = 0;
          let totalExpense = 0;
          
          transactions.forEach((t: any) => {
            const amount = toNumber(t.amount);
            if (t.type === 'income') {
              totalIncome += amount;
            } else if (t.type === 'expense') {
              totalExpense += amount;
            }
          });
          
          setStats({
            revenue: { current: totalIncome, previous: totalIncome * 0.9, change: 10, trend: 'up' },
            expenses: { current: totalExpense, previous: totalExpense * 1.05, change: -5, trend: 'down' },
            profit: { current: totalIncome - totalExpense, previous: (totalIncome - totalExpense) * 0.95, change: 5, trend: 'up' },
            inventory: { total_value: 0, low_stock_items: 0 },
            customers: { total: 0, new_this_month: 0 },
            sales: { total_transactions: 0, average_order_value: 0 },
            employees: { total: 0, revenue_per_employee: 0 }
          });
        }
      }
      
      // Process trends data
      if (trendsRes.data && trendsRes.data.monthly) {
        const monthlyData = trendsRes.data.monthly.map((item: any) => ({
          month: item.month || item.name || '',
          sales: toNumber(item.sales || item.revenue || item.amount)
        }));
        setSalesData(monthlyData);
      } else {
        // Fallback: Generate sample data if not available
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setSalesData(months.map(m => ({ month: m, sales: 0 })));
      }
      
      // Process low stock products
      if (lowStockRes.data) {
        if (lowStockRes.data.products && Array.isArray(lowStockRes.data.products)) {
          setLowStockProducts(lowStockRes.data.products);
        } else if (Array.isArray(lowStockRes.data)) {
          setLowStockProducts(lowStockRes.data);
        } else {
          setLowStockProducts([]);
        }
      } else {
        setLowStockProducts([]);
      }
      
      // Process recent sales
      if (salesRes.data) {
        let salesList = salesRes.data.results || salesRes.data;
        if (Array.isArray(salesList)) {
          // Fetch details for each sale (optional - can be expanded)
          setRecentSales(salesList.slice(0, 10));
        } else {
          setRecentSales([]);
        }
      } else {
        setRecentSales([]);
      }
      
    } catch (err: any) {
      console.error('Dashboard API Error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const formatCurrency = (value: number) => {
    const num = toNumber(value);
    if (num === 0) return 'TZS 0';
    if (num >= 1000000) return `TZS ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `TZS ${(num / 1000).toFixed(0)}k`;
    return `TZS ${num.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return toNumber(value).toLocaleString();
  };

  const revenueCurrent = toNumber(stats?.revenue?.current);
  const revenueChange = toNumber(stats?.revenue?.change);
  const expensesCurrent = toNumber(stats?.expenses?.current);
  const expensesChange = toNumber(stats?.expenses?.change);
  const profitCurrent = toNumber(stats?.profit?.current);
  const profitChange = toNumber(stats?.profit?.change);
  const profitMargin = revenueCurrent > 0 ? (profitCurrent / revenueCurrent) * 100 : 0;
  const customersTotal = toNumber(stats?.customers?.total);
  const customersNew = toNumber(stats?.customers?.new_this_month);
  const salesTransactions = toNumber(stats?.sales?.total_transactions);
  const salesAvgOrder = toNumber(stats?.sales?.average_order_value);
  const inventoryValue = toNumber(stats?.inventory?.total_value);
  const employeesTotal = toNumber(stats?.employees?.total);
  const lowStockCount = toNumber(stats?.inventory?.low_stock_items);

  // Get low stock products (critical first)
  const criticalStock = lowStockProducts.filter(p => toNumber(p.quantity_on_hand) === 0);
  const lowStock = lowStockProducts.filter(p => toNumber(p.quantity_on_hand) > 0 && toNumber(p.quantity_on_hand) <= toNumber(p.reorder_level));
  const sortedLowStock = [...criticalStock, ...lowStock];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.username || 'User'}!</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(revenueCurrent)}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                {Math.abs(revenueChange)}% from last month
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${profitCurrent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profitCurrent)}
              </p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitChange >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                {Math.abs(profitChange)}% from last month
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiTrendingUp className={`w-5 h-5 ${profitCurrent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Margin: {profitMargin.toFixed(1)}%</p>
        </div>

        {/* Total Expenses Card (Negative - Red) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(expensesCurrent)}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${expensesChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expensesChange <= 0 ? <FiTrendingDown size={12} /> : <FiTrendingUp size={12} />}
                {Math.abs(expensesChange)}% from last month
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{formatNumber(customersTotal)}</p>
              <p className="text-xs text-gray-500 mt-2">{formatNumber(customersNew)} new this month</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(salesTransactions)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Avg Order Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(salesAvgOrder)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Inventory Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(inventoryValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Employees</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(employeesTotal)}</p>
        </div>
      </div>

      {/* Low Stock Alert Summary */}
      {lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-amber-500" size={20} />
            <div>
              <p className="font-medium text-amber-800">Low Stock Alert</p>
              <p className="text-sm text-amber-700">{lowStockCount} products are below reorder level</p>
            </div>
          </div>
          <Link href='inventory/stock' className="text-sm text-amber-700 hover:text-amber-800 font-medium">View Details →</Link>
        </div>
      )}

      {/* Two Column Layout for Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart - Takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          {salesData.length > 0 && salesData.some(d => d.sales > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `TZS ${toNumber(v)/1000}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sales" fill="#0077C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiActivity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No revenue data available</p>
                <p className="text-xs mt-1">Complete sales to see chart</p>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alerts - Fixed Height Scrollable */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="text-amber-500" size={18} />
                <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
              </div>
              {sortedLowStock.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {sortedLowStock.length} items
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Products needing attention</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedLowStock.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiPackage className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All products well stocked</p>
              </div>
            ) : (
              sortedLowStock.map((product) => {
                const qty = toNumber(product.quantity_on_hand);
                const reorderLvl = toNumber(product.reorder_level);
                const percent = reorderLvl > 0 ? (qty / reorderLvl) * 100 : 0;
                return (
                  <div key={product.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                      </div>
                      {qty === 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Critical</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Current Stock</p>
                          <p className="text-sm font-semibold text-red-600">{qty} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Reorder Level</p>
                          <p className="text-sm font-medium text-gray-700">{reorderLvl} units</p>
                        </div>
                      </div>
                      <Link href='inventory/stock' className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                        Reorder →
                      </Link>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities - Fixed Height Scrollable */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiActivity className="text-brand-500" size={18} />
              <h3 className="font-semibold text-gray-900">Recent Activities</h3>
            </div>
            <span className="text-xs text-gray-400">{recentSales.length} transactions</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Latest transactions and updates</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {recentSales.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent transactions</p>
            </div>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{sale.invoice_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{sale.customer_name || 'Walk-in Customer'}</span>
                      <span className="text-gray-400"> made a purchase</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Payment: {sale.payment_method} • {new Date(sale.sale_date).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">TZS {toNumber(sale.total_amount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
          <Link href= 'sales/history' className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1">
            View All Transactions
            <FiChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}