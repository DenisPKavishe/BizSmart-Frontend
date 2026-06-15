// app/(dashboard)/bi/page.tsx - COMPLETE WORKING VERSION WITH PROPER COLORS

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi } from '@/services/api';
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
  FiTarget,
  FiArrowRight,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiCalendar,
  FiFlag,
  FiBarChart2,
  FiPieChart,
  FiFileText,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatCurrency = (value: number) => {
  const num = Number(value) || 0;
  if (num === 0) return 'TZS 0';
  // Display full number without K/M suffix
  return `TZS ${num.toLocaleString()}`;
};

const formatNumber = (value: number) => (Number(value) || 0).toLocaleString();
const formatPercent = (value: number) => `${(Number(value) || 0).toFixed(1)}%`;

// Metric Card Component - Profit color based on isNegative
function MetricCard({ title, value, change, icon: Icon, isNegative, subtitle, onClick }: any) {
  const isPositive = change > 0;
  const isNegativeChange = change < 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{value}</p>
          {change !== undefined && change !== null && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={14} /> : isNegativeChange ? <FiArrowDown size={14} /> : null}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} group-hover:scale-110 transition`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// Alert Component
function AlertBanner({ type, message, action, onAction }: any) {
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
    <div className={`rounded-xl p-4 border ${colors[type]} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <p className="text-sm font-medium">{message}</p>
      </div>
      {action && (
        <button onClick={onAction} className="text-sm font-medium underline hover:no-underline">
          {action} →
        </button>
      )}
    </div>
  );
}

// Navigation Card
function NavCard({ title, description, icon: Icon, href, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    green: 'bg-green-50 border-green-200 hover:border-green-300',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-300',
    red: 'bg-red-50 border-red-200 hover:border-red-300',
  };
  
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  
  return (
    <Link href={href} className="block">
      <div className={`rounded-xl p-4 border ${colorClasses[color]} hover:shadow-md transition-all group`}>
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

// Custom Tooltip for Charts
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

export default function BIPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchDashboardData();
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

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, trendsRes, alertsRes] = await Promise.all([
        biApi.getMainDashboard({ month: selectedMonth }),
        biApi.getDashboardTrends({ days: 30 }),
        biApi.getDashboardAlerts(),
      ]);

      if (dashboardRes.data) {
        setDashboard(dashboardRes.data.dashboard);
        setBusinessInfo(dashboardRes.data.business_info);
      }
      if (trendsRes.data) setTrends(trendsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getBusinessAge = () => {
    if (!businessInfo?.start_date) return null;
    const start = new Date(businessInfo.start_date);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return months;
  };

  const businessAge = getBusinessAge();
  const chartData = trends?.daily?.slice(-30) || [];
  const hasBudgetTargets = dashboard?.budget_targets && dashboard.budget_targets.has_budget;

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

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {businessInfo?.start_date && (
              <span className="flex items-center gap-1">
                <FiFlag size={12} className="text-green-500" />
                Business started: {new Date(businessInfo.start_date).toLocaleDateString()}
                {businessAge !== null && ` • ${businessAge} months in business`}
              </span>
            )}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
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
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.slice(0, 3).map((alert, idx) => (
            <AlertBanner 
              key={idx}
              type={alert.type}
              message={alert.description}
              action={alert.recommendation ? 'View Details' : undefined}
            />
          ))}
        </div>
      )}

      {/* Key Metrics Row - Net Profit uses isNegative for color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Revenue"
          value={formatCurrency(dashboard?.revenue?.current || 0)}
          change={dashboard?.revenue?.change}
          icon={FiDollarSign}
          isNegative={false}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(Math.abs(dashboard?.profit?.current || 0))}
          change={dashboard?.profit?.change}
          icon={FiTrendingUp}
          isNegative={dashboard?.profit?.current < 0}
          subtitle={`Margin: ${formatPercent(dashboard?.margins?.net_margin || 0)}`}
        />
        <MetricCard
          title="Transactions"
          value={formatNumber(dashboard?.sales?.total_transactions || 0)}
          change={dashboard?.sales?.transactions_change}
          icon={FiActivity}
          isNegative={false}
          subtitle={`Avg: ${formatCurrency(dashboard?.sales?.average_order_value || 0)}`}
        />
        <MetricCard
          title="New Customers"
          value={formatNumber(dashboard?.customers?.new_this_month || 0)}
          icon={FiUsers}
          isNegative={false}
          subtitle={`Total: ${formatNumber(dashboard?.customers?.total || 0)}`}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Revenue Trend - {getMonthDisplay(selectedMonth)}
            </h3>
            <p className="text-xs text-gray-500">Daily revenue breakdown</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm flex items-center gap-1 ${dashboard?.revenue?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboard?.revenue?.change >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
              {Math.abs(dashboard?.revenue?.change || 0)}% vs last month
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#revenueGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones Section - Only show if active budget exists */}
      {hasBudgetTargets && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FiTarget size={14} className="text-green-500" />
            Milestones & Targets
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({dashboard.budget_targets.period_display})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Target Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <FiDollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Revenue Target</p>
                  <p className="text-xs text-gray-500">
                    Target: {formatCurrency(dashboard.budget_targets.total_planned_income)}
                  </p>
                  {dashboard.budget_targets.budget_period !== 'monthly' && (
                    <p className="text-xs text-gray-400">
                      Monthly Avg: {formatCurrency(dashboard.budget_targets.monthly_average)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-amber-600">
                    {dashboard.budget_targets.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500 bg-amber-500"
                    style={{ width: `${Math.min(dashboard.budget_targets.progress, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm font-medium mt-2">
                Achieved: {formatCurrency(dashboard?.revenue?.current || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Target to date: {formatCurrency(dashboard.budget_targets.target_to_date)}
              </p>
            </div>

            {/* Profit Margin Target Card - Color based on actual vs target */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <FiTrendingUp size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Profit Margin Target</p>
                  <p className="text-xs text-gray-500">
                    Target: {dashboard.budget_targets.planned_margin}%
                  </p>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Actual</span>
                  <span className={`font-medium ${(dashboard?.margins?.net_margin || 0) >= dashboard.budget_targets.planned_margin ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboard?.margins?.net_margin || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${(dashboard?.margins?.net_margin || 0) >= dashboard.budget_targets.planned_margin ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(((dashboard?.margins?.net_margin || 0) / dashboard.budget_targets.planned_margin) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className={`text-sm font-medium mt-2 ${(dashboard?.profit?.current || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(dashboard?.profit?.current || 0) >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Need {(dashboard.budget_targets.planned_margin - (dashboard?.margins?.net_margin || 0)).toFixed(1)}% more to reach target
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Analytics & Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NavCard
            title="Sales Analytics"
            description="Track sales performance and trends"
            icon={FiBarChart2}
            href="/bi/sales"
            color="blue"
          />
          <NavCard
            title="Financial Analytics"
            description="P&L, cash flow, and expenses"
            icon={FiPieChart}
            href="/bi/financial"
            color="green"
          />
          <NavCard
            title="Inventory Analytics"
            description="Stock levels and product performance"
            icon={FiPackage}
            href="/bi/inventory"
            color="amber"
          />
          <NavCard
            title="HR Analytics"
            description="Employee metrics and attendance"
            icon={FiUsers}
            href="/bi/hr"
            color="purple"
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiPackage className="text-amber-500" size={18} />
            <p className="text-sm text-gray-600">Inventory Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.inventory?.total_value || 0)}</p>
          {dashboard?.inventory?.low_stock_items > 0 && (
            <p className="text-xs text-red-600 mt-1">{dashboard?.inventory?.low_stock_items} low stock items</p>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiActivity className="text-blue-500" size={18} />
            <p className="text-sm text-gray-600">Average Order Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.sales?.average_order_value || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Based on {dashboard?.sales?.total_transactions || 0} transactions</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="text-purple-500" size={18} />
            <p className="text-sm text-gray-600">Customer Retention</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboard?.customers?.repeat_rate ? `${dashboard.customers.repeat_rate}%` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Repeat customers rate</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}