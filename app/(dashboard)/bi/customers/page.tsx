// app/(dashboard)/bi/customers/page.tsx - COMPLETE CUSTOMER DASHBOARD

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
  FiDownload,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
  FiAward,
  FiStar,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiHeart,
  FiRepeat,
  FiAward as FiTrophy,
} from 'react-icons/fi';
import { FaChartLine, FaUsers, FaMoneyBillWave, FaUserFriends, FaUserCheck } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

// ==================== INTERFACES ====================
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  total_visits: number;
  average_order: number;
  last_purchase_date: string;
  join_date: string;
  city?: string;
}

interface CustomerSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerLTV {
  customer_name: string;
  lifetime_value: number;
  total_orders: number;
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
  return new Date(dateString).toLocaleDateString();
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
              {item.name === 'Customers' || item.name === 'Orders' || item.name === 'Visits'
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

function CustomerMetricCard({ title, value, change, icon: Icon, isNegative, subtext, onClick }: any) {
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-100 text-teal-600 group-hover:scale-110 transition">
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
          <Icon className="text-teal-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function CustomerCard({ customer, index }: { customer: Customer; index: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
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
            <p className="text-xs text-gray-400">{customer.total_visits} orders</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-teal-600 text-lg">{formatCurrency(customer.total_spent)}</p>
        <p className="text-xs text-gray-400">Avg: {formatCurrency(customer.average_order)}</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  
  // Customer Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [churnedCustomers, setChurnedCustomers] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);
  const [repeatPurchaseRate, setRepeatPurchaseRate] = useState(0);
  const [averageLTV, setAverageLTV] = useState(0);
  const [totalCustomerValue, setTotalCustomerValue] = useState(0);
  
  // Segmentation
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<any[]>([]);
  const [ltvDistribution, setLtvDistribution] = useState<any[]>([]);
  
  // Location data
  const [customerCities, setCustomerCities] = useState<any[]>([]);

  // Fetch available months
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchCustomerData();
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

  const fetchCustomerData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch customers
      const customersRes = await salesApi.getCustomers();
      const customersList = customersRes.data.results || customersRes.data || [];
      setCustomers(customersList);
      
      // Calculate customer metrics
      const total = customersList.length;
      setTotalCustomers(total);
      
      // Calculate new customers this month
      const currentDate = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month, 1);
      const newCustomersCount = customersList.filter((c: Customer) => {
        const joinDate = new Date(c.join_date);
        return joinDate >= currentDate && joinDate < nextMonth;
      }).length;
      setNewCustomers(newCustomersCount);
      
      // Calculate total customer value
      const totalValue = customersList.reduce((sum: number, c: Customer) => sum + toNumber(c.total_spent), 0);
      setTotalCustomerValue(totalValue);
      
      // Calculate average LTV
      const avgLTV = total > 0 ? totalValue / total : 0;
      setAverageLTV(avgLTV);
      
      // Calculate repeat purchase rate
      const repeatCustomers = customersList.filter((c: Customer) => c.total_visits > 1).length;
      const repeatRate = total > 0 ? (repeatCustomers / total) * 100 : 0;
      setRepeatPurchaseRate(repeatRate);
      
      // Calculate retention rate (customers who purchased in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const retainedCustomers = customersList.filter((c: Customer) => {
        const lastPurchase = new Date(c.last_purchase_date);
        return lastPurchase >= ninetyDaysAgo;
      }).length;
      const retention = total > 0 ? (retainedCustomers / total) * 100 : 0;
      setRetentionRate(retention);
      
      // Calculate churned customers (no purchase in last 90 days)
      const churned = total - retainedCustomers;
      setChurnedCustomers(churned);
      
      // Customer segmentation by spending
      const segments = [
        { name: 'High Value', min: 500000, max: Infinity, count: 0, color: '#10B981' },
        { name: 'Medium Value', min: 100000, max: 499999, count: 0, color: '#3B82F6' },
        { name: 'Low Value', min: 10000, max: 99999, count: 0, color: '#F59E0B' },
        { name: 'New/Rare', min: 0, max: 9999, count: 0, color: '#EF4444' },
      ];
      
      customersList.forEach((customer: Customer) => {
        const spent = toNumber(customer.total_spent);
        for (const segment of segments) {
          if (spent >= segment.min && spent <= segment.max) {
            segment.count++;
            break;
          }
        }
      });
      
      const segmentData = segments.map(s => ({
        name: s.name,
        count: s.count,
        percentage: total > 0 ? (s.count / total) * 100 : 0,
        color: s.color
      }));
      setCustomerSegments(segmentData);
      
      // Top customers
      const topSpenders = [...customersList]
        .sort((a, b) => toNumber(b.total_spent) - toNumber(a.total_spent))
        .slice(0, 10);
      setTopCustomers(topSpenders);
      
      // Calculate LTV distribution
      const ltvRanges = [
        { range: '0 - 100k', min: 0, max: 100000, count: 0 },
        { range: '100k - 500k', min: 100000, max: 500000, count: 0 },
        { range: '500k - 1M', min: 500000, max: 1000000, count: 0 },
        { range: '1M - 2M', min: 1000000, max: 2000000, count: 0 },
        { range: '2M+', min: 2000000, max: Infinity, count: 0 },
      ];
      
      customersList.forEach((customer: Customer) => {
        const ltv = toNumber(customer.total_spent);
        for (const range of ltvRanges) {
          if (ltv >= range.min && ltv < range.max) {
            range.count++;
            break;
          }
        }
      });
      setLtvDistribution(ltvRanges.filter(r => r.count > 0));
      
      // Generate customer growth data (last 6 months) - FIXED VERSION
      const growthData: Array<{ month: string; newCustomers: number; cumulative: number }> = [];
      let cumulativeTotal = 0;
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const monthStart = d;
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const monthNewCustomers = customersList.filter((c: Customer) => {
          const joinDate = new Date(c.join_date);
          return joinDate >= monthStart && joinDate <= monthEnd;
        }).length;
        
        cumulativeTotal += monthNewCustomers;
        
        growthData.push({
          month: fullMonthNames[d.getMonth()].substring(0, 3),
          newCustomers: monthNewCustomers,
          cumulative: cumulativeTotal
        });
      }
      setCustomerGrowth(growthData);
      
      // Calculate city distribution
      const cityMap: Record<string, number> = {};
      customersList.forEach((customer: Customer) => {
        if (customer.city) {
          cityMap[customer.city] = (cityMap[customer.city] || 0) + 1;
        }
      });
      const cityData = Object.entries(cityMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setCustomerCities(cityData);
      
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      toast.error('Failed to load customer data');
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

  const SEGMENT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

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
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track customer behavior, lifetime value, and retention metrics</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {availableMonths.length > 0 && (
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            onClick={fetchCustomerData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={18} />
          </button>
          <Link
            href="/sales/customers"
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <FiUsers size={16} />
            Manage Customers
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <CustomerMetricCard
          title="Total Customers"
          value={formatNumber(totalCustomers)}
          change={5.2}
          icon={FiUsers}
          isNegative={false}
          subtext={`${newCustomers} new this month`}
        />
        <CustomerMetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(averageLTV)}
          change={3.8}
          icon={FaMoneyBillWave}
          isNegative={false}
          subtext={`Total value: ${formatCurrency(totalCustomerValue)}`}
        />
        <CustomerMetricCard
          title="Retention Rate"
          value={`${retentionRate.toFixed(1)}%`}
          change={2.1}
          icon={FaUserCheck}
          isNegative={retentionRate < 60}
          subtext={`${churnedCustomers} customers churned`}
        />
        <CustomerMetricCard
          title="Repeat Purchase Rate"
          value={`${repeatPurchaseRate.toFixed(1)}%`}
          change={1.5}
          icon={FiRepeat}
          isNegative={repeatPurchaseRate < 40}
          subtext="Customers who buy again"
        />
      </div>

      {/* Customer Segmentation & LTV Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Segmentation */}
        <Section title="Customer Segmentation" icon={FaUserFriends}>
          {customerSegments.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customerSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {customerSegments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No segmentation data available</div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {customerSegments.map((segment, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{segment.name}</p>
                <p className="text-sm font-semibold text-teal-600">{formatNumber(segment.count)}</p>
                <p className="text-xs text-gray-400">{segment.percentage.toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </Section>

        {/* LTV Distribution */}
        <Section title="Customer Lifetime Value Distribution" icon={FaChartLine}>
          {ltvDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ltvDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#14B8A6" name="Customers" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No LTV data available</div>
          )}
        </Section>
      </div>

      {/* Customer Growth Trend & City Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Growth Trend */}
        <Section title="Customer Growth Trend" icon={FiTrendingUp}>
          {customerGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={customerGrowth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="newCustomers" stroke="#14B8A6" fill="url(#growthGrad)" name="New Customers" strokeWidth={2} />
                <Line type="monotone" dataKey="cumulative" stroke="#8B5CF6" name="Total Customers" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No growth data available</div>
          )}
        </Section>

        {/* Customer Location Distribution */}
        <Section title="Top Locations" icon={FiMapPin}>
          {customerCities.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={customerCities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#14B8A6" name="Customers" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No location data available</div>
          )}
        </Section>
      </div>

      {/* Top Customers */}
      <Section title="Top Spending Customers" icon={FiTrophy}>
        {topCustomers.length > 0 ? (
          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((customer, idx) => (
              <CustomerCard key={customer.id} customer={customer} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No customer data available</div>
        )}
        
        {/* Customer Statistics Footer */}
        {topCustomers.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-teal-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Avg Customer LTV</p>
                <p className="text-xl font-bold text-teal-600">{formatCurrency(averageLTV)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Top Customer Value</p>
                <p className="text-xl font-bold text-blue-600">
                  {topCustomers[0] ? formatCurrency(topCustomers[0].total_spent) : 'TZS 0'}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Customer Value</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(totalCustomerValue)}</p>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span>Data as of {getMonthDisplay(selectedMonth)}</span>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1">Total customers: {formatNumber(totalCustomers)}</span>
            <Link href="/sales/customers" className="hover:text-teal-600">Manage Customers →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}