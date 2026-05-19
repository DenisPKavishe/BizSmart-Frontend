// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, salesApi, inventoryApi } from '@/services/api';
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

// Custom tooltip for chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-brand-600">
          Revenue: TZS {payload[0].value?.toLocaleString() || 0}
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
      const [kpiRes, trendsRes, lowStockRes, salesRes] = await Promise.all([
        biApi.getDashboard(),
        biApi.getTrends(180),
        inventoryApi.getLowStockProducts(),
        salesApi.getSales({ limit: 10 }),
      ]);

      if (kpiRes.data) setStats(kpiRes.data);
      
      if (trendsRes.data && trendsRes.data.monthly) {
        setSalesData(trendsRes.data.monthly);
      }
      
      if (lowStockRes.data && lowStockRes.data.products) {
        setLowStockProducts(lowStockRes.data.products);
      } else if (lowStockRes.data && Array.isArray(lowStockRes.data)) {
        setLowStockProducts(lowStockRes.data);
      }
      
      if (salesRes.data && salesRes.data.results) {
        // Fetch items for each sale (optional - you can expand this)
        setRecentSales(salesRes.data.results);
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
    if (!value) return 'TZS 0';
    if (value >= 1000000) return `TZS ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `TZS ${(value / 1000).toFixed(0)}k`;
    return `TZS ${value.toLocaleString()}`;
  };

  const revenueCurrent = stats?.revenue?.current ?? 0;
  const revenueChange = stats?.revenue?.change ?? 0;
  const expensesCurrent = stats?.expenses?.current ?? 0;
  const expensesChange = stats?.expenses?.change ?? 0;
  const profitCurrent = stats?.profit?.current ?? 0;
  const profitChange = stats?.profit?.change ?? 0;
  const profitMargin = revenueCurrent > 0 ? (profitCurrent / revenueCurrent) * 100 : 0;
  const customersTotal = stats?.customers?.total ?? 0;
  const customersNew = stats?.customers?.new_this_month ?? 0;
  const salesTransactions = stats?.sales?.total_transactions ?? 0;
  const salesAvgOrder = stats?.sales?.average_order_value ?? 0;
  const inventoryValue = stats?.inventory?.total_value ?? 0;
  const employeesTotal = stats?.employees?.total ?? 0;

  // Get low stock products (critical first)
  const criticalStock = lowStockProducts.filter(p => p.quantity_on_hand === 0);
  const lowStock = lowStockProducts.filter(p => p.quantity_on_hand > 0 && p.quantity_on_hand <= p.reorder_level);
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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(revenueCurrent)}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                {Math.abs(revenueChange)}% from last month
              </p>
            </div>
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-brand-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(profitCurrent)}</p>
              <p className="text-xs text-gray-500 mt-2">Margin: {profitMargin.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(expensesCurrent)}</p>
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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold mt-1">{customersTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{customersNew} new this month</p>
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
          <p className="text-xl font-bold text-gray-900">{salesTransactions.toLocaleString()}</p>
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
          <p className="text-xl font-bold text-gray-900">{employeesTotal}</p>
        </div>
      </div>

      {/* Two Column Layout for Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart - Takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `TZS ${v/1000}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sales" fill="#0077C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">No chart data</div>
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
              sortedLowStock.map((product) => (
                <div key={product.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                    {product.quantity_on_hand === 0 ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Critical</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="text-sm font-semibold text-red-600">{product.quantity_on_hand} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reorder Level</p>
                        <p className="text-sm font-medium text-gray-700">{product.reorder_level} units</p>
                      </div>
                    </div>
                    <button className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                      Reorder →
                    </button>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((product.quantity_on_hand / product.reorder_level) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
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
            recentSales.map((sale, index) => (
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
                    
                    {/* Items details - showing what was purchased */}
                    {sale.items && sale.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Items purchased:</p>
                        <div className="flex flex-wrap gap-2">
                          {sale.items.map((item, idx) => (
                            <span key={idx} className="text-xs bg-white px-2 py-1 rounded-md shadow-sm">
                              {item.product_name} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">TZS {sale.total_amount.toLocaleString()}</p>
                    <button className="text-xs text-brand-600 hover:text-brand-700 mt-1">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
          <button className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1">
            View All Transactions
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}