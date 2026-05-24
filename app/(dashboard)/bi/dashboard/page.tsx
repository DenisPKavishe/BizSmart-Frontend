// app/(dashboard)/bi/page.tsx - CORRECTED WITH COLOR CODING

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, salesApi, inventoryApi, financialsApi } from '@/services/api';
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
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiArrowRight,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';

const toNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: number) => {
  const num = toNumber(value);
  if (num === 0) return 'TZS 0';
  if (num >= 1000000) return `TZS ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `TZS ${(num / 1000).toFixed(0)}k`;
  return `TZS ${num.toLocaleString()}`;
};

const formatNumber = (value: number) => toNumber(value).toLocaleString();
const formatPercent = (value: number) => `${toNumber(value).toFixed(1)}%`;

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Quick Metric Card Component with proper color coding
function QuickMetric({ title, value, change, icon: Icon, isNegative, onClick }: any) {
  const isPositive = toNumber(change) > 0;
  const isNegativeChange = toNumber(change) < 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{value}</p>
          {change !== undefined && change !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={12} /> : isNegativeChange ? <FiArrowDown size={12} /> : null}
              <span>{Math.abs(toNumber(change))}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} group-hover:scale-110 transition`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// Alert Component with proper typing
function AlertBanner({ type, message, action, onAction }: { 
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };
  
  const icons: Record<string, React.ReactNode> = {
    critical: <FiAlertCircle className="text-red-500" size={18} />,
    warning: <FiAlertCircle className="text-yellow-500" size={18} />,
    info: <FiActivity className="text-blue-500" size={18} />,
    success: <FiCheckCircle className="text-green-500" size={18} />,
  };
  
  return (
    <div className={`rounded-xl p-3 border ${colors[type]} flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {icons[type]}
        <p className="text-sm">{message}</p>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-medium underline hover:no-underline">
          {action}
        </button>
      )}
    </div>
  );
}

// Navigation Card to other analytics sections
function NavCard({ title, description, icon: Icon, href, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    amber: 'bg-amber-50 border-amber-200',
  };
  
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
  };
  
  return (
    <Link href={href} className="block">
      <div className={`rounded-xl p-4 border ${colors[color]} hover:shadow-md transition-all group`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${iconColors[color]}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <FiArrowRight className="text-gray-400 group-hover:text-gray-600 transition" size={16} />
        </div>
      </div>
    </Link>
  );
}

export default function BIPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, trendsRes, cashFlowRes, lowStockRes] = await Promise.all([
        biApi.getDashboard().catch(() => ({ data: null })),
        biApi.getTrends().catch(() => ({ data: null })),
        financialsApi.getCashFlow().catch(() => ({ data: null })),
        inventoryApi.getLowStockProducts().catch(() => ({ data: null })),
      ]);

      if (dashboardRes?.data) setDashboard(dashboardRes.data);
      if (trendsRes?.data) setTrendData(trendsRes.data);
      if (cashFlowRes?.data) setCashFlow(cashFlowRes.data);
      if (lowStockRes?.data?.products) setLowStockCount(lowStockRes.data.products.length);
      
      generateAlerts(dashboardRes?.data, cashFlowRes?.data, lowStockRes?.data?.products);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAlerts = (dashboardData: any, cashFlowData: any, lowStockList: any[]) => {
    const newAlerts: any[] = [];
    
    if (dashboardData?.profit?.current < 0) {
      newAlerts.push({
        type: 'critical',
        message: `Net loss of ${formatCurrency(Math.abs(dashboardData.profit.current))}. Review expenses.`,
        action: 'View Financials',
      });
    }
    
    if (lowStockList && lowStockList.length > 0) {
      newAlerts.push({
        type: 'warning',
        message: `${lowStockList.length} products are low on stock. Reorder soon.`,
        action: 'View Inventory',
      });
    }
    
    if (cashFlowData?.warning) {
      newAlerts.push({
        type: 'warning',
        message: cashFlowData.warning,
        action: 'View Cash Flow',
      });
    }
    
    if (dashboardData?.revenue?.change > 20) {
      newAlerts.push({
        type: 'success',
        message: `Revenue grew ${dashboardData.revenue.change}%! Excellent performance.`,
      });
    }
    
    setAlerts(newAlerts.slice(0, 3));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>)}
          </div>
          <div className="h-80 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const isProfitNegative = (dashboard?.profit?.current || 0) < 0;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your business at a glance - Green = Positive, Red = Negative</p>
        </div>
        <button
          onClick={fetchOverviewData}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Quick Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, idx) => (
            <AlertBanner 
              key={idx} 
              type={alert.type}
              message={alert.message}
              action={alert.action}
              onAction={() => {
                if (alert.action === 'View Financials') window.location.href = '/bi/financial';
                if (alert.action === 'View Inventory') window.location.href = '/inventory/products';
                if (alert.action === 'View Cash Flow') window.location.href = '/bi/financial';
              }}
            />
          ))}
        </div>
      )}

      {/* Key Metrics Row - Green for positive/income, Red for negative/expenses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <QuickMetric
          title="Revenue"
          value={formatCurrency(dashboard?.revenue?.current || 0)}
          change={dashboard?.revenue?.change}
          icon={FiDollarSign}
          isNegative={false}
        />
        <QuickMetric
          title="Net Profit"
          value={formatCurrency(Math.abs(dashboard?.profit?.current || 0))}
          change={dashboard?.profit?.change}
          icon={FiTrendingUp}
          isNegative={isProfitNegative}
        />
        <QuickMetric
          title="Transactions"
          value={formatNumber(dashboard?.sales?.total_transactions || 0)}
          icon={FiActivity}
          isNegative={false}
        />
        <QuickMetric
          title="Customers"
          value={formatNumber(dashboard?.customers?.total || 0)}
          change={dashboard?.customers?.new_this_month}
          icon={FiUsers}
          isNegative={false}
        />
      </div>

      {/* Navigation Cards to Other Analytics Sections */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Analytics & Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NavCard
            title="Financial Analytics"
            description="Deep dive into P&L, cash flow, loans, and expenses"
            icon={FiPieChart}
            href="/bi/financial"
            color="blue"
          />
          <NavCard
            title="Reports Center"
            description="Download PDF reports, export data, and schedule reports"
            icon={FiFileText}
            href="/reports"
            color="purple"
          />
          <NavCard
            title="Inventory Analytics"
            description="Track stock levels, turnover, and product performance"
            icon={FiPackage}
            href="/inventory/analytics"
            color="amber"
          />
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 ${dashboard?.revenue?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboard?.revenue?.change >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
              {Math.abs(dashboard?.revenue?.change || 0)}% vs last month
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData?.daily?.slice(-30) || []}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tickFormatter={(v) => `TZS ${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#revenueGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiPackage className="text-amber-500" size={18} />
            <p className="text-sm text-gray-600">Inventory Value</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard?.inventory?.total_value || 0)}</p>
          {lowStockCount > 0 && (
            <p className="text-xs text-red-600 mt-1">{lowStockCount} low stock items</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="text-blue-500" size={18} />
            <p className="text-sm text-gray-600">Cash Runway</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {cashFlow?.avg_daily_expense ? `${Math.floor(Math.abs(cashFlow.current_balance) / cashFlow.avg_daily_expense)} days` : 'N/A'}
          </p>
          {cashFlow?.warning && <p className="text-xs text-red-600 mt-1">{cashFlow.warning}</p>}
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiTarget className="text-green-500" size={18} />
            <p className="text-sm text-gray-600">Profit Margin</p>
          </div>
          <p className={`text-xl font-bold ${dashboard?.margins?.net_margin >= 20 ? 'text-green-600' : dashboard?.margins?.net_margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {formatPercent(dashboard?.margins?.net_margin || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {dashboard?.margins?.net_margin >= 20 ? 'Healthy margin' : dashboard?.margins?.net_margin >= 10 ? 'Moderate margin' : 'Margin needs improvement'}
          </p>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Last updated: {new Date().toLocaleString()}</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">Green = Positive / Income</span>
            <span className="flex items-center gap-1">Red = Negative / Expenses</span>
            <Link href="/bi/financial" className="hover:text-blue-600">View Financial Analytics →</Link>
            <Link href="/reports" className="hover:text-blue-600">Download Reports →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}