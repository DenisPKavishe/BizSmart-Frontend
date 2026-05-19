// app/(dashboard)/bi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiAlertCircle,
  FiCheckCircle,
  FiActivity,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiUser,
  FiTruck,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface DashboardData {
  period: {
    current_month: string;
    previous_month: string;
    current_month_start: string;
    current_month_end: string;
  };
  revenue: {
    current: number;
    previous: number;
    change: number;
    trend: string;
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
    trend: string;
  };
  profit: {
    current: number;
    previous: number;
    change: number;
    trend: string;
  };
  margins: {
    gross_margin: number;
    net_margin: number;
  };
  inventory: {
    total_value: number;
    low_stock_items: number;
  };
  sales: {
    total_transactions: number;
    average_order_value: number;
  };
  customers: {
    total: number;
    new_this_month: number;
  };
  employees: {
    total: number;
    revenue_per_employee: number;
  };
}

interface Insight {
  type: 'positive' | 'critical' | 'opportunity' | 'warning';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  metric_value: number;
}

interface ForecastData {
  period: string;
  forecast: Array<{
    day: number;
    date: string;
    predicted_sales: number;
  }>;
  total_forecast: number;
  average_daily_forecast: number;
  confidence: number;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  quantity_sold: number;
  revenue: number;
  profit: number;
  profit_margin: number;
}

interface CustomerInsight {
  total_customers: number;
  segments: {
    high_value: number;
    medium_value: number;
    low_value: number;
  };
  retention_rate: number;
  repeat_customers: number;
  top_customers: Array<{
    id: number;
    name: string;
    total_spent: number;
    total_visits: number;
    average_order: number;
  }>;
}

interface ProfitLossData {
  period: {
    start_date: string;
    end_date: string;
  };
  income: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  profit: {
    gross_profit: number;
    gross_margin: number;
    net_profit: number;
    net_margin: number;
  };
}

interface SlowProduct {
  id: number;
  name: string;
  sku: string;
  quantity_on_hand: number;
  sold_last_30_days: number;
  days_to_sell: number;
  investment: number;
  recommendation: string;
}

export default function BIPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [slowProducts, setSlowProducts] = useState<SlowProduct[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        dashboardRes,
        insightsRes,
        forecastRes,
        topProductsRes,
        customerInsightsRes,
        profitLossRes,
        slowProductsRes,
        trendsRes,
      ] = await Promise.all([
        biApi.getDashboard(),
        biApi.getInsights(),
        biApi.getForecast(),
        biApi.getTopProducts(),
        biApi.getCustomerInsights(),
        biApi.getProfitLoss(),
        biApi.getSlowProducts(),
        biApi.getTrends(),
      ]);

      setDashboard(dashboardRes.data);
      setInsights(insightsRes.data.insights || []);
      setForecast(forecastRes.data);
      setTopProducts(topProductsRes.data.top_products || []);
      setCustomerInsights(customerInsightsRes.data);
      setProfitLoss(profitLossRes.data);
      setSlowProducts(slowProductsRes.data.slow_moving_products || []);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch BI data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return 'TZS 0';
    return `TZS ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <FiArrowUp className="text-green-500" />;
    }
    return <FiArrowDown className="text-red-500" />;
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'critical':
        return <FiAlertCircle className="text-red-500" size={20} />;
      case 'opportunity':
        return <FiStar className="text-amber-500" size={20} />;
      default:
        return <FiActivity className="text-blue-500" size={20} />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'opportunity':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time analytics and insights for your business</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <FiDownload size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'insights'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'forecast'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Forecast
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'products'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'customers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Customers
        </button>
      </div>

      {activeTab === 'overview' && dashboard && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Revenue</p>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.revenue.current)}</p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(dashboard.revenue.trend, dashboard.revenue.change)}
                <span className={`text-sm ${getChangeColor(dashboard.revenue.change)}`}>
                  {dashboard.revenue.change}% vs last month
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Profit</p>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboard.profit.current)}</p>
              <p className="text-xs text-gray-500 mt-1">Margin: {dashboard.margins.net_margin}%</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Transactions</p>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiShoppingCart className="text-purple-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboard.sales.total_transactions)}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Order: {formatCurrency(dashboard.sales.average_order_value)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Customers</p>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboard.customers.total}</p>
              <p className="text-xs text-green-600 mt-1">+{dashboard.customers.new_this_month} new this month</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends?.daily?.slice(-30) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `TZS ${value / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#93C5FD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Profit/Loss Breakdown */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Income', amount: profitLoss?.income.total || 0 },
                  { name: 'Expenses', amount: profitLoss?.expenses.total || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `TZS ${value / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <FiPackage className="text-blue-600" size={20} />
                <p className="text-sm text-gray-500">Inventory Value</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard.inventory.total_value)}</p>
              {dashboard.inventory.low_stock_items > 0 && (
                <p className="text-xs text-red-600 mt-1">{dashboard.inventory.low_stock_items} low stock items</p>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <FiUsers className="text-purple-600" size={20} />
                <p className="text-sm text-gray-500">Revenue per Employee</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard.employees.revenue_per_employee)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboard.employees.total} active employees</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <FiBarChart2 className="text-green-600" size={20} />
                <p className="text-sm text-gray-500">Gross Margin</p>
              </div>
              <p className="text-xl font-bold text-green-600">{dashboard.margins.gross_margin}%</p>
              <p className="text-xs text-gray-500 mt-1">Net margin: {dashboard.margins.net_margin}%</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 border ${getInsightBgColor(insight.type)} shadow-sm`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 capitalize">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  <p className="text-sm font-medium text-blue-600">{insight.recommendation}</p>
                  {insight.metric_value > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Value: {formatCurrency(insight.metric_value)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No insights available yet. Continue selling to generate insights!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecast' && forecast && (
        <div className="space-y-6">
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total Forecast (30 days)</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(forecast.total_forecast)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Average Daily Forecast</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(forecast.average_daily_forecast)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Confidence Level</p>
              <p className="text-2xl font-bold text-amber-600">{forecast.confidence}%</p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">30-Day Sales Forecast</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecast.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `TZS ${value / 1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line type="monotone" dataKey="predicted_sales" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiStar className="text-amber-500" />
                Top Performing Products
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">{product.quantity_sold}</td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">{formatCurrency(product.revenue)}</td>
                      <td className="px-6 py-4 text-right text-sm text-blue-600">{formatCurrency(product.profit)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span className="inline-flex px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          {product.profit_margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slow Moving Products */}
          {slowProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  Slow Moving Products
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sold (30d)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days to Sell</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slowProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">{product.quantity_on_hand}</td>
                        <td className="px-6 py-4 text-right text-sm">{product.sold_last_30_days}</td>
                        <td className="px-6 py-4 text-right text-sm">{product.days_to_sell} days</td>
                        <td className="px-6 py-4 text-sm text-amber-600">{product.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'customers' && customerInsights && (
        <div className="space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customerInsights.total_customers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Repeat Customers</p>
              <p className="text-2xl font-bold text-green-600">{customerInsights.repeat_customers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Retention Rate</p>
              <p className="text-2xl font-bold text-blue-600">{customerInsights.retention_rate}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">High Value Customers</p>
              <p className="text-2xl font-bold text-amber-600">{customerInsights.segments.high_value}</p>
            </div>
          </div>

          {/* Customer Segmentation */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Segmentation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'High Value', value: customerInsights.segments.high_value },
                    { name: 'Medium Value', value: customerInsights.segments.medium_value },
                    { name: 'Low Value', value: customerInsights.segments.low_value },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiUser className="text-blue-500" />
                Top Customers
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerInsights.top_customers.slice(0, 10).map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{customer.name}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">{formatCurrency(customer.total_spent)}</td>
                      <td className="px-6 py-4 text-right text-sm">{customer.total_visits}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(customer.average_order)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}