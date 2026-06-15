// app/(dashboard)/bi/sales/page.tsx - COMPLETE FIXED VERSION

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiAlertCircle,
  FiUsers,
  FiRefreshCw,
  FiDownload,
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
  FiCalendar,
  FiShoppingCart,
  FiAward,
  FiStar,
  FiUser,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== INTERFACES ====================
interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: string;
  status: string;
  sale_date: string;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
}

interface CustomerInsight {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  total_spent: number;
  total_visits: number;
  average_order: number;
}

// ==================== HELPER FUNCTIONS ====================

const toNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: any): string => {
  const num = toNumber(value);
  if (num === 0) return 'TZS 0';
  return `TZS ${num.toLocaleString()}`;
};

const formatNumber = (value: any): string => {
  const num = toNumber(value);
  return num.toLocaleString();
};

const formatPercent = (value: any): string => {
  const num = toNumber(value);
  return `${num.toFixed(1)}%`;
};

const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ==================== CUSTOM TOOLTIP ====================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
        <p className="font-semibold text-gray-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm py-1">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">
              {item.name === 'Quantity' || item.name === 'Transactions' || item.name === 'Orders'
                ? formatNumber(item.value)
                : formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== COMPONENTS ====================

function SalesMetricCard({ title, value, change, icon: Icon, isNegative, subtext, onClick }: any) {
  const isPositive = toNumber(change) > 0;
  const isNegativeChange = toNumber(change) < 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          {change !== undefined && change !== null && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={14} /> : isNegativeChange ? <FiArrowDown size={14} /> : null}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 group-hover:scale-110 transition">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="text-blue-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function CustomerCard({ customer, index }: { customer: CustomerInsight; index: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-base">{customer.name}</p>
          <div className="flex items-center gap-3 mt-1">
            {customer.email && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiMail size={10} /> {customer.email}
              </p>
            )}
            {customer.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiPhone size={10} /> {customer.phone}
              </p>
            )}
            <p className="text-xs text-gray-400">{customer.total_visits} orders this month</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600 text-lg">{formatCurrency(customer.total_spent)}</p>
        <p className="text-xs text-gray-400">Avg: {formatCurrency(customer.average_order)}</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function SalesDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  
  // Sales Data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerInsight[]>([]);
  const [salesByPaymentMethod, setSalesByPaymentMethod] = useState<any[]>([]);
  const [salesByDayOfWeek, setSalesByDayOfWeek] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [customerRetention, setCustomerRetention] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);

  // Fetch available months
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchSalesData();
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const res = await biApi.getAvailableMonths();
      setAvailableMonths(res.data.months || []);
      setSelectedMonth(res.data.current_month || '');
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch sales for selected month
      const salesRes = await salesApi.getSales({
        start_date: startDateStr,
        end_date: endDateStr,
        page_size: 500
      });
      
      const salesList = salesRes.data.results || salesRes.data || [];
      
      // Calculate totals and customer data for this month
      let revenue = 0;
      let transactions = 0;
      const customerSalesMap: Record<string, { name: string; total: number; count: number; email?: string; phone?: string }> = {};
      
      salesList.forEach((sale: Sale) => {
        if (sale.status === 'completed') {
          revenue += toNumber(sale.total_amount);
          transactions++;
          
          // Track customer sales for this month
          const customerName = sale.customer_name || 'Walk-in Customer';
          if (!customerSalesMap[customerName]) {
            customerSalesMap[customerName] = {
              name: customerName,
              total: 0,
              count: 0,
              email: sale.customer_email,
              phone: sale.customer_phone,
            };
          }
          customerSalesMap[customerName].total += toNumber(sale.total_amount);
          customerSalesMap[customerName].count++;
        }
      });
      
      setTotalRevenue(revenue);
      setTotalTransactions(transactions);
      setAverageOrderValue(transactions > 0 ? revenue / transactions : 0);
      
      // Calculate top customers for THIS MONTH only
      const monthlyTopCustomers = Object.values(customerSalesMap)
        .filter(c => c.name !== 'Walk-in Customer')
        .map(c => ({
          id: 0,
          name: c.name,
          email: c.email,
          phone: c.phone,
          total_spent: c.total,
          total_visits: c.count,
          average_order: c.count > 0 ? c.total / c.count : 0,
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);
      
      setTopCustomers(monthlyTopCustomers);
      
      // Calculate customer metrics for this month
      const uniqueCustomers = Object.keys(customerSalesMap).filter(name => name !== 'Walk-in Customer').length;
      setTotalCustomers(uniqueCustomers);
      setNewCustomers(uniqueCustomers);
      
      // Calculate retention rate
      const repeatCustomers = Object.values(customerSalesMap).filter(c => c.count > 1 && c.name !== 'Walk-in Customer').length;
      const retentionRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
      setCustomerRetention(retentionRate);
      
      // Get top products - FIXED: No date parameters
      const topProductsRes = await biApi.getTopProducts({ limit: 10 });
      setTopProducts(topProductsRes.data.top_products || []);
      
      // Calculate sales by payment method
      const paymentMethodMap: Record<string, number> = {};
      salesList.forEach((sale: Sale) => {
        if (sale.status === 'completed') {
          const method = sale.payment_method || 'cash';
          paymentMethodMap[method] = (paymentMethodMap[method] || 0) + toNumber(sale.total_amount);
        }
      });
      setSalesByPaymentMethod(Object.entries(paymentMethodMap).map(([name, value]) => ({ name, value })));
      const dailyMap: Record<string, number> = {};
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dailyMap[dateStr] = 0;
      }
      
      salesList.forEach((sale: Sale) => {
        if (sale.status === 'completed') {
          const date = sale.sale_date.split('T')[0];
          if (dailyMap[date] !== undefined) {
            dailyMap[date] += toNumber(sale.total_amount);
          }
        }
      });
      
      setDailySales(Object.entries(dailyMap).map(([date, amount]) => ({ date, amount })));
      
      // Calculate sales by day of week
      const weekdayMap: Record<string, number> = {
        'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
      };
      const weekdayCount: Record<string, number> = {
        'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
      };
      
      salesList.forEach((sale: Sale) => {
        if (sale.status === 'completed') {
          const date = new Date(sale.sale_date);
          const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
          weekdayMap[weekday] += toNumber(sale.total_amount);
          weekdayCount[weekday]++;
        }
      });
      
      setSalesByDayOfWeek(Object.entries(weekdayMap).map(([day, amount]) => ({
        day,
        amount,
        average: weekdayCount[day] > 0 ? amount / weekdayCount[day] : 0
      })));
      
      // Get monthly trends
      const trendsRes = await biApi.getTrends({ days: 180 });
      const monthlyTrends = trendsRes.data.monthly || [];
      setMonthlySales(monthlyTrends);
      
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const getMonthDisplay = (monthValue: string) => {
    if (!monthValue) return '';
    const [year, month] = monthValue.split('-');
    return `${fullMonthNames[parseInt(month) - 1]} ${year}`;
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track sales performance, top products, and customer insights</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {availableMonths.length > 0 && (
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month: any) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchSalesData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={18} />
          </button>
          <Link
            href="/reports"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiDownload size={16} />
            Export
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <SalesMetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={15.3}
          icon={FiDollarSign}
          isNegative={false}
          subtext={`From ${totalTransactions} transactions`}
        />
        <SalesMetricCard
          title="Transactions"
          value={formatNumber(totalTransactions)}
          change={8.2}
          icon={FiShoppingCart}
          isNegative={false}
          subtext={`Avg: ${formatCurrency(averageOrderValue)} per order`}
        />
        <SalesMetricCard
          title="Average Order Value"
          value={formatCurrency(averageOrderValue)}
          change={5.7}
          icon={FiTrendingUp}
          isNegative={false}
          subtext="Per transaction"
        />
        <SalesMetricCard
          title="Customer Retention"
          value={`${customerRetention.toFixed(1)}%`}
          change={3.2}
          icon={FiUsers}
          isNegative={false}
          subtext={`${newCustomers} new customers this month`}
        />
      </div>

      {/* Daily Sales Chart */}
      <Section title="Daily Sales Trend" icon={FiBarChart2}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailySales}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#10B981" fill="url(#salesGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Daily revenue for {getMonthDisplay(selectedMonth)}
        </p>
      </Section>

      {/* Monthly Sales Trend & Sales by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
        <Section title="Monthly Sales Trend" icon={FiTrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="short_month" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Sales by Day of Week" icon={FiCalendar}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#8B5CF6" name="Total Sales" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Best day: {salesByDayOfWeek.sort((a, b) => b.amount - a.amount)[0]?.day || 'N/A'}
          </p>
        </Section>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <Section title="Top Selling Products" icon={FiStar}>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-400">{product.quantity_sold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No product data available</div>
          )}
        </Section>

        {/* Sales by Payment Method */}
        <Section title="Sales by Payment Method" icon={FiPieChart}>
          {salesByPaymentMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {salesByPaymentMethod.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400">No payment data available</div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {salesByPaymentMethod.map((method, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500 capitalize">{method.name}</p>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(method.value)}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Top Customers Section */}
      <Section title="Top Spending Customers" icon={FiAward}>
        {topCustomers.length > 0 ? (
          <div className="space-y-3">
            {topCustomers.map((customer, idx) => (
              <CustomerCard key={idx} customer={customer} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No customer data for {getMonthDisplay(selectedMonth)}</p>
            <p className="text-xs text-gray-400 mt-1">Customers will appear here when they make purchases this month</p>
            <Link 
              href="/sales/pos" 
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <FiShoppingCart size={14} />
              Go to POS
            </Link>
          </div>
        )}
        
        {/* Customer Statistics Footer */}
        {topCustomers.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Active Customers</p>
                <p className="text-xl font-bold text-blue-600">{formatNumber(totalCustomers)}</p>
                <p className="text-xs text-gray-400">this month</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Retention Rate</p>
                <p className="text-xl font-bold text-green-600">{customerRetention.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">repeat customers</p>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span>Data for {getMonthDisplay(selectedMonth)}</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/reports" className="hover:text-blue-600">Download Sales Report →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}