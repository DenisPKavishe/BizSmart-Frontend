// app/(dashboard)/bi/reports/page.tsx - WITH REAL EXPENSES DATA

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi } from '@/services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import {
  FiCalendar,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiUsers,
  FiBox,
  FiPrinter,
  FiAlertCircle,
  FiActivity,
  FiImage,
  FiRepeat,
  FiBarChart2,
} from 'react-icons/fi';
import {
  FaChartLine,
  FaMoneyBillWave,
  FaChartBar,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// ==================== INTERFACES ====================

interface ExecutiveData {
  business_name: string;
  generated_at: string;
  kpi: {
    period: {
      current_month: string;
      previous_month: string;
    };
    revenue: {
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
      is_negative: boolean;
    };
    margins: {
      net_margin: number;
    };
    sales: {
      total_transactions: number;
      average_order_value: number;
      transactions_change: number;
    };
    customers: {
      total: number;
      new_this_month: number;
      repeat_rate: number;
      avg_ltv: number;
    };
    inventory: {
      total_value: number;
      low_stock_items: number;
      total_quantity: number;
    };
    employees: {
      total: number;
      revenue_per_employee: number;
    };
  };
  trends: {
    daily: Array<{ date: string; revenue: number }>;
  };
  top_products: Array<{ id: number; name: string; sku: string; quantity_sold: number; revenue: number }>;
  customer_insights: {
    total_customers: number;
    segments: {
      high_value: number;
      medium_value: number;
      low_value: number;
    };
    retention_rate: number;
    repeat_customers: number;
    top_customers: Array<any>;
  };
}

interface FinancialSummaryData {
  current_month_profit_loss: {
    income: { total: number };
    expenses: { total: number };
    profit: { net_profit: number };
  };
  key_metrics: {
    revenue: {
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
      is_negative: boolean;
    };
    margins: {
      net_margin: number;
    };
  };
}

interface ProfitLossData {
  income: { total: number };
  expenses: { total: number };
  profit: { net_profit: number };
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

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ==================== COMPONENTS ====================

function MetricCard({ title, value, subtitle, icon: Icon, color, change, trend }: any) {
  const isPositive = trend === 'up' || (change > 0);
  const isNegative = trend === 'down' || (change < 0);
  
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiTrendingUp size={12} /> : isNegative ? <FiTrendingDown size={12} /> : null}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, onExport, loading }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="text-teal-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {loading && <div className="ml-2 w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
          >
            <FiImage size={14} />
            Export PNG
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ==================== MAIN DASHBOARD ====================

export default function ReportsDashboard() {
  const { user } = useAuthStore();
  
  // Refs for each section
  const kpiRef = useRef<HTMLDivElement>(null);
  const plRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const customersRef = useRef<HTMLDivElement>(null);
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Data from different endpoints
  const [executiveData, setExecutiveData] = useState<ExecutiveData | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryData | null>(null);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch available months
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchAllData();
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const res = await biApi.getAvailableMonths();
      const months = res.data?.months || [];
      setAvailableMonths(months);
      if (months.length > 0) {
        setSelectedMonth(months[0]?.value || '');
      }
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch all three endpoints in parallel
      const [executiveRes, financialSummaryRes, profitLossRes] = await Promise.all([
        biApi.getExecutiveDashboard(),
        biApi.getFinancialSummary(),
        biApi.getProfitLoss(),
      ]);

      console.log('Executive Data:', executiveRes.data);
      console.log('Financial Summary:', financialSummaryRes.data);
      console.log('Profit & Loss (has real expenses):', profitLossRes.data);

      setExecutiveData(executiveRes.data);
      setFinancialSummary(financialSummaryRes.data);
      setProfitLossData(profitLossRes.data);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    toast.success('Refreshing data...');
  };

  const exportSection = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref?.current) {
      toast.error('Section not found');
      return;
    }
    
    setIsExporting(true);
    toast.loading(`Generating ${filename}...`);
    
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `${filename}-${timestamp}.png`;
      link.href = image;
      link.click();
      
      toast.dismiss();
      toast.success(`${filename} downloaded!`);
    } catch (error) {
      console.error('Failed to generate PNG:', error);
      toast.dismiss();
      toast.error('Failed to generate PNG');
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare data for display
  // REVENUE: Use profit-loss endpoint (has total 2,733,336) or financial summary (273,600)
  const currentRevenue = financialSummary?.current_month_profit_loss?.income?.total || 
                         executiveData?.kpi?.revenue?.current || 0;
  
  // EXPENSES: Use profit-loss endpoint which has REAL expenses (174,995)
  // NOT the financial summary which shows 0
  const totalExpenses = profitLossData?.expenses?.total || 0;
  const currentExpenses = profitLossData?.expenses?.total || 
                          financialSummary?.current_month_profit_loss?.expenses?.total || 0;
  
  // PROFIT: Calculate from revenue - expenses for accuracy
  const calculatedProfit = currentRevenue - currentExpenses;
  const totalProfit = profitLossData?.profit?.net_profit || calculatedProfit;
  const currentProfit = financialSummary?.current_month_profit_loss?.profit?.net_profit || calculatedProfit;
  
  // Profit margin based on real data
  const profitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
  
  // Use profit-loss endpoint for total/historical data
  const totalRevenue = profitLossData?.income?.total || currentRevenue;

  // Prepare daily trend data from executive dashboard
  const dailyTrendData = executiveData?.trends?.daily
    ?.filter((d: { date: string; revenue: number }) => d.revenue > 0)
    ?.slice(-30) // Last 30 days
    ?.map((d: { date: string; revenue: number }) => ({
      date: formatDate(d.date),
      revenue: d.revenue,
    })) || [];

  // Top products from executive dashboard
  const topProductsData = executiveData?.top_products?.slice(0, 5)?.map((p: { name: string; quantity_sold: number; revenue: number }) => ({
    name: p.name,
    quantity: p.quantity_sold,
    revenue: p.revenue,
  })) || [];

  // Customer segments from executive dashboard
  const segments = executiveData?.customer_insights?.segments;
  const segmentData = segments ? [
    { name: 'High Value', value: segments.high_value || 0, color: '#10B981' },
    { name: 'Medium Value', value: segments.medium_value || 0, color: '#3B82F6' },
    { name: 'Low Value', value: segments.low_value || 0, color: '#F59E0B' },
  ] : [];

  // Monthly P&L data for chart (Previous vs Current)
  const monthlyPLData = [
    { 
      month: executiveData?.kpi?.period?.previous_month?.substring(0, 3) || 'Previous', 
      revenue: executiveData?.kpi?.revenue?.previous || 0, 
      expenses: 0, 
      profit: executiveData?.kpi?.profit?.previous || 0 
    },
    { 
      month: executiveData?.kpi?.period?.current_month?.substring(0, 3) || 'Current', 
      revenue: currentRevenue, 
      expenses: currentExpenses, 
      profit: currentProfit 
    },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!executiveData && !financialSummary) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No data available</p>
        <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const kpi = executiveData?.kpi;
  const customerInsights = executiveData?.customer_insights;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              {executiveData?.business_name || 'BizSmart'} • Real-time business analytics
            </p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
              <FiCalendar className="text-gray-400" size={16} />
              {availableMonths.length > 0 ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-sm focus:outline-none bg-transparent"
                >
                  {availableMonths.map((month: { value: string; label: string }) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm">{kpi?.period?.current_month || 'Current Month'}</span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <FiRefreshCw size={16} className={isExporting ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <FiPrinter size={16} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Section - Using Executive Dashboard Data */}
      <div ref={kpiRef}>
        <Section 
          title="Key Performance Indicators" 
          icon={FaChartLine}
          onExport={() => exportSection(kpiRef, 'kpi-report')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(currentRevenue)}
              subtitle={`${formatNumber(kpi?.sales?.total_transactions)} transactions`}
              icon={FaMoneyBillWave}
              color="bg-green-100 text-green-600"
              change={kpi?.revenue?.change}
              trend={kpi?.revenue?.trend}
            />
            <MetricCard
              title="Net Profit"
              value={formatCurrency(currentProfit)}
              subtitle={`${formatPercent(profitMargin)} margin`}
              icon={FaChartLine}
              color="bg-blue-100 text-blue-600"
              change={kpi?.profit?.change}
              trend={kpi?.profit?.trend}
            />
            <MetricCard
              title="Average Order Value"
              value={formatCurrency(kpi?.sales?.average_order_value)}
              subtitle="Per transaction"
              icon={FiShoppingCart}
              color="bg-purple-100 text-purple-600"
            />
            <MetricCard
              title="Total Customers"
              value={formatNumber(kpi?.customers?.total)}
              subtitle={`${kpi?.customers?.new_this_month} new this month`}
              icon={FiUsers}
              color="bg-teal-100 text-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
            <MetricCard
              title="Repeat Purchase Rate"
              value={formatPercent(kpi?.customers?.repeat_rate)}
              subtitle={`${customerInsights?.repeat_customers || 0} repeat customers`}
              icon={FiRepeat}
              color="bg-indigo-100 text-indigo-600"
            />
            <MetricCard
              title="Customer LTV"
              value={formatCurrency(kpi?.customers?.avg_ltv)}
              subtitle="Average lifetime value"
              icon={FaMoneyBillWave}
              color="bg-pink-100 text-pink-600"
            />
            <MetricCard
              title="Inventory Value"
              value={formatCurrency(kpi?.inventory?.total_value)}
              subtitle={`${kpi?.inventory?.low_stock_items} low stock items`}
              icon={FiBox}
              color="bg-yellow-100 text-yellow-600"
            />
            <MetricCard
              title="Revenue per Employee"
              value={formatCurrency(kpi?.employees?.revenue_per_employee)}
              subtitle={`${kpi?.employees?.total} employees`}
              icon={FiUsers}
              color="bg-orange-100 text-orange-600"
            />
          </div>
        </Section>
      </div>

      {/* Profit & Loss Section - Using REAL expenses from Profit-Loss API */}
      <div ref={plRef}>
        <Section 
          title="Profit & Loss Statement" 
          icon={FaChartBar}
          onExport={() => exportSection(plRef, 'profit-loss')}
        >
          {/* Summary Cards with REAL Expenses Data */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" />
              Profit & Loss Summary (from Profit-Loss API)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400">All time</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-red-400">Real expenses from API</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Net Profit</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Profit Margin</p>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-16 h-16">
                    <circle
                      className="text-gray-200"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <circle
                      className="text-blue-600"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - profitMargin / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <text x="32" y="37" textAnchor="middle" className="text-xs font-bold fill-current">
                      {profitMargin.toFixed(0)}%
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Current Month Details */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-3">Current Month Details ({kpi?.period?.current_month})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">% of Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm text-gray-900">Revenue</td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">
                      {formatCurrency(currentRevenue)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">100%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-sm text-gray-900">Expenses</td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-red-600">
                      {formatCurrency(currentExpenses)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {currentRevenue > 0 ? ((currentExpenses / currentRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">Net Profit</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                      {formatCurrency(currentProfit)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-blue-600">
                      {profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Month-over-Month Comparison Chart */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-3">Month-over-Month Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyPLData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" tickFormatter={(v) => `${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'Revenue') return formatCurrency(value);
                    if (name === 'Expenses') return formatCurrency(value);
                    if (name === 'Profit') return formatCurrency(value);
                    return formatCurrency(value);
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#3B82F6" name="Profit" strokeWidth={3} dot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics from Financial Summary */}
          {financialSummary?.key_metrics && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-3">Key Financial Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Revenue Change</p>
                  <p className={`text-xl font-bold ${financialSummary.key_metrics.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {financialSummary.key_metrics.revenue.change}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {financialSummary.key_metrics.revenue.previous.toLocaleString()} → {financialSummary.key_metrics.revenue.current.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Profit Change</p>
                  <p className={`text-xl font-bold ${financialSummary.key_metrics.profit.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {financialSummary.key_metrics.profit.change}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {financialSummary.key_metrics.profit.previous.toLocaleString()} → {financialSummary.key_metrics.profit.current.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Net Margin</p>
                  <p className="text-xl font-bold text-blue-600">{formatPercent(financialSummary.key_metrics.margins.net_margin)}</p>
                  <p className="text-xs text-gray-400">Profitability ratio</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Source Note */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>📊 Expenses data from: Profit & Loss API | Total Expenses: {formatCurrency(totalExpenses)}</p>
            <p>📈 Revenue data from: Financial Summary API | Period: {selectedMonth || kpi?.period?.current_month}</p>
          </div>
        </Section>
      </div>

      {/* Revenue Trends Section - From Executive Dashboard */}
      <div ref={trendsRef}>
        <Section 
          title="Revenue Trends" 
          icon={FiTrendingUp}
          onExport={() => exportSection(trendsRef, 'revenue-trends')}
        >
          {dailyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#revenueGrad)" name="Daily Revenue" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No revenue data available for this period</div>
          )}
        </Section>
      </div>

      {/* Top Products & Customer Segments - From Executive Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div ref={productsRef}>
          <Section 
            title="Top Selling Products" 
            icon={FiShoppingCart}
            onExport={() => exportSection(productsRef, 'top-products')}
          >
            {topProductsData.length > 0 ? (
              <div className="space-y-3">
                {topProductsData.map((product: { name: string; quantity: number; revenue: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatNumber(product.quantity)} units sold</p>
                    </div>
                    <p className="font-semibold text-teal-600">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No product data available</div>
            )}
          </Section>
        </div>

        {/* Customer Segments */}
        <div ref={customersRef}>
          <Section 
            title="Customer Segmentation" 
            icon={FiUsers}
            onExport={() => exportSection(customersRef, 'customer-segments')}
          >
            {segmentData.some(s => s.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => 
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {segmentData.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">High Value</p>
                    <p className="text-xl font-bold text-green-600">{formatNumber(segmentData[0]?.value)}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Medium Value</p>
                    <p className="text-xl font-bold text-blue-600">{formatNumber(segmentData[1]?.value)}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-500">Low Value</p>
                    <p className="text-xl font-bold text-yellow-600">{formatNumber(segmentData[2]?.value)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">No customer segment data available</div>
            )}
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Generated by {user?.username || 'System'} • {executiveData?.business_name || 'BizSmart'} • {new Date().toLocaleString('en-TZ')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Data sources: Executive Dashboard | Financial Summary | Profit & Loss API (Real Expenses: {formatCurrency(totalExpenses)})
        </p>
      </div>
    </div>
  );
}