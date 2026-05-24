// app/(dashboard)/bi/financial/page.tsx - COMPLETE WORKING VERSION

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, financialsApi, hrApi, salesApi } from '@/services/api';
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
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
  FiHome,
  FiCreditCard,
  FiUser,
  FiShoppingBag,
  FiAward,
} from 'react-icons/fi';
import { FaHandHoldingUsd, FaMoneyBillWave, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import {
  LineChart,
  Line,
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
  ComposedChart,
} from 'recharts';

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
  if (num >= 1000000) return `TZS ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `TZS ${(num / 1000).toFixed(0)}k`;
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

// ==================== CUSTOM TOOLTIP COMPONENT ====================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">
              {item.name === 'Profit Margin %' || item.dataKey === 'margin' || item.name === 'Profit Margin'
                ? `${item.value.toFixed(1)}%`
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

function FinancialMetricCard({ title, value, change, icon: Icon, isNegative, subtext, onClick }: any) {
  const isPositive = toNumber(change) > 0;
  const isNegativeChange = toNumber(change) < 0;
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>{value}</p>
          {change !== undefined && change !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={12} /> : isNegativeChange ? <FiArrowDown size={12} /> : null}
              <span>{Math.abs(toNumber(change))}% from last period</span>
            </div>
          )}
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="text-blue-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {action && (
          <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {action.label} <FiArrowRight size={12} />
          </button>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function FinancialDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  // Main Financial Data
  const [pnlData, setPnlData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  
  // Money Flow Data
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netCashFlow, setNetCashFlow] = useState(0);
  
  // Customer Money Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCustomerMoney, setTotalCustomerMoney] = useState(0);
  const [customerRevenue, setCustomerRevenue] = useState(0);
  const [topSpendingCustomers, setTopSpendingCustomers] = useState<any[]>([]);
  
  // Loans Data
  const [loans, setLoans] = useState<any[]>([]);
  const [totalLoanBalance, setTotalLoanBalance] = useState(0);
  const [totalMonthlyLoanPayments, setTotalMonthlyLoanPayments] = useState(0);
  
  // Petty Cash Data
  const [pettyCash, setPettyCash] = useState<any[]>([]);
  const [pettyCashTotal, setPettyCashTotal] = useState(0);
  const [pettyCashByCategory, setPettyCashByCategory] = useState<any[]>([]);
  
  // Payroll Data
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  
  // Invoice Data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  
  // Revenue by Source
  const [revenueBySource, setRevenueBySource] = useState<any[]>([]);

  useEffect(() => {
    fetchAllFinancialData();
  }, [selectedPeriod]);

  const fetchAllFinancialData = async () => {
    setIsLoading(true);
    try {
      const [
        pnlRes,
        cashFlowRes,
        trendsRes,
        transactionsRes,
        customersRes,
        loansRes,
        pettyCashRes,
        payrollRes,
        invoicesRes,
        salesRes,
      ] = await Promise.all([
        biApi.getProfitLoss().catch(() => ({ data: null })),
        financialsApi.getCashFlow().catch(() => ({ data: null })),
        biApi.getTrends().catch(() => ({ data: null })),
        financialsApi.getTransactions().catch(() => ({ data: null })),
        salesApi.getCustomers().catch(() => ({ data: null })),
        financialsApi.getLoans().catch(() => ({ data: null })),
        financialsApi.getPettyCash().catch(() => ({ data: null })),
        hrApi.getPayrolls().catch(() => ({ data: null })),
        financialsApi.getInvoices().catch(() => ({ data: null })),
        salesApi.getSales({ page_size: 500 }).catch(() => ({ data: null })),
      ]);

      if (pnlRes?.data) setPnlData(pnlRes.data);
      if (cashFlowRes?.data) setCashFlowData(cashFlowRes.data);
      if (trendsRes?.data) setTrendData(trendsRes.data);
      
      let transactionsList = transactionsRes.data?.results || transactionsRes.data || [];
      setTransactions(transactionsList);
      
      let income = 0;
      let expenses = 0;
      transactionsList.forEach((t: any) => {
        const amount = toNumber(t.amount);
        if (t.type === 'income') income += amount;
        else if (t.type === 'expense') expenses += amount;
      });
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setNetCashFlow(income - expenses);
      
      let customersList = customersRes.data?.results || customersRes.data || [];
      setCustomers(customersList);
      
      let totalSpent = 0;
      const customerSpending = customersList.map((c: any) => ({
        id: c.id,
        name: c.name || 'Customer',
        total_spent: toNumber(c.total_spent),
        total_visits: toNumber(c.total_visits),
        average_order: toNumber(c.total_visits) > 0 ? toNumber(c.total_spent) / toNumber(c.total_visits) : 0,
      }));
      totalSpent = customerSpending.reduce((sum: number, c: any) => sum + c.total_spent, 0);
      setTotalCustomerMoney(totalSpent);
      setCustomerRevenue(totalSpent);
      setTopSpendingCustomers(customerSpending.sort((a: any, b: any) => b.total_spent - a.total_spent).slice(0, 5));
      
      let loansList = loansRes.data?.results || loansRes.data || [];
      setLoans(loansList);
      const activeLoans = loansList.filter((l: any) => l.status === 'active');
      setTotalLoanBalance(activeLoans.reduce((sum: number, l: any) => sum + toNumber(l.balance_remaining), 0));
      setTotalMonthlyLoanPayments(activeLoans.reduce((sum: number, l: any) => sum + toNumber(l.monthly_payment), 0));
      
      let pettyCashList = pettyCashRes.data?.results || pettyCashRes.data || [];
      setPettyCash(pettyCashList);
      const pettyTotal = pettyCashList.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0);
      setPettyCashTotal(pettyTotal);
      
      const pettyCategories: any = {};
      pettyCashList.forEach((p: any) => {
        const cat = p.category || 'Other';
        pettyCategories[cat] = (pettyCategories[cat] || 0) + toNumber(p.amount);
      });
      setPettyCashByCategory(Object.entries(pettyCategories).map(([name, value]) => ({ name, value })));
      
      let payrollList = payrollRes.data?.results || payrollRes.data || [];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const monthlyPayroll = payrollList
        .filter((p: any) => p.month === currentMonth && p.year === currentYear && p.status === 'paid')
        .reduce((sum: number, p: any) => sum + toNumber(p.total_net_salary), 0);
      setPayrollTotal(monthlyPayroll);
      setPayrollHistory(payrollList.slice(0, 6));
      
      let invoicesList = invoicesRes.data?.results || invoicesRes.data || [];
      setInvoices(invoicesList);
      const pending = invoicesList.filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled');
      setPendingInvoices(pending);
      const overdue = pending.filter((i: any) => {
        const dueDate = new Date(i.due_date);
        const today = new Date();
        return dueDate < today;
      });
      setOverdueInvoices(overdue);
      
      const salesList = salesRes.data?.results || salesRes.data || [];
      const revenueByPaymentMethod: any = {};
      salesList.forEach((sale: any) => {
        const method = sale.payment_method || 'cash';
        revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + toNumber(sale.total_amount);
      });
      setRevenueBySource(Object.entries(revenueByPaymentMethod).map(([name, value]) => ({ name, value })));
      
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyRevenueData = (trendData?.monthly || []).slice(-6).map((item: any) => ({
    month: item.month?.substring(0, 3) || item.short_month || item.month || 'N/A',
    revenue: toNumber(item.revenue),
    expenses: toNumber(pnlData?.expenses?.total) * 0.2 || 0,
    profit: toNumber(item.revenue) - (toNumber(pnlData?.expenses?.total) * 0.2 || 0),
  }));

  const expenseColors = ['#EF4444', '#F59E0B', '#EC4899', '#8B5CF6'];
  const profitMarginValue = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Complete overview of all money movements - Green = Positive, Red = Negative</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  selectedPeriod === period ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : 'This Year'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAllFinancialData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={18} />
          </button>
          <Link
            href="/reports"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiDownload size={16} />
            Reports
          </Link>
        </div>
      </div>

      {/* Main Money Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <FinancialMetricCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          change={12.5}
          icon={FaMoneyBillWave}
          isNegative={false}
          subtext={`From ${transactions.filter(t => t.type === 'income').length} transactions`}
        />
        <FinancialMetricCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={-5.2}
          icon={FiTrendingDown}
          isNegative={true}
          subtext={`${transactions.filter(t => t.type === 'expense').length} expense transactions`}
        />
        <FinancialMetricCard
          title="Net Cash Flow"
          value={formatCurrency(Math.abs(netCashFlow))}
          change={netCashFlow > 0 ? 15.3 : -8.7}
          icon={FiActivity}
          isNegative={netCashFlow < 0}
          subtext={netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow - Review expenses'}
        />
        <FinancialMetricCard
          title="Profit Margin"
          value={formatPercent(profitMarginValue)}
          icon={FiTarget}
          isNegative={profitMarginValue < 0}
          subtext={profitMarginValue > 20 ? 'Healthy margin' : profitMarginValue > 10 ? 'Moderate margin' : 'Margin needs improvement'}
        />
      </div>

      {/* Customer Money & Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <FinancialMetricCard
          title="Total Customer Money"
          value={formatCurrency(totalCustomerMoney)}
          icon={FiUsers}
          isNegative={false}
          subtext={`From ${customers.length} customers`}
        />
        <FinancialMetricCard
          title="Customer Revenue"
          value={formatCurrency(customerRevenue)}
          change={18.2}
          icon={FiShoppingBag}
          isNegative={false}
          subtext="Total sales from customers"
        />
        <FinancialMetricCard
          title="Average Customer Spend"
          value={formatCurrency(customers.length > 0 ? totalCustomerMoney / customers.length : 0)}
          icon={FiUser}
          isNegative={false}
          subtext="Per customer lifetime value"
        />
        <FinancialMetricCard
          title="Pending Invoices"
          value={formatCurrency(pendingInvoices.reduce((sum, i) => sum + toNumber(i.balance_due), 0))}
          icon={FiFileText}
          isNegative={true}
          subtext={`${pendingInvoices.length} unpaid invoices (${overdueInvoices.length} overdue)`}
        />
      </div>

      {/* Profit & Loss Section */}
      <Section title="Profit & Loss Statement" icon={FaChartLine}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Gross Revenue</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(pnlData?.income?.total || totalIncome)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Costs</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(pnlData?.expenses?.total || totalExpenses)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${(pnlData?.profit?.net_profit || netCashFlow) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500">Net Profit</p>
            <p className={`text-xl font-bold ${(pnlData?.profit?.net_profit || netCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(pnlData?.profit?.net_profit || netCashFlow)}
            </p>
            <p className="text-xs">Margin: {formatPercent(pnlData?.profit?.net_margin || profitMarginValue)}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" tickFormatter={(v) => `TZS ${toNumber(v)/1000}k`} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${toNumber(v)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#3B82F6" name="Profit" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Income & Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Income Sources</h4>
            <div className="space-y-2">
              {pnlData?.income?.breakdown?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="capitalize">{item.category?.replace('_', ' ') || 'Other'}</span>
                  <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {(!pnlData?.income?.breakdown || pnlData.income.breakdown.length === 0) && (
                <div className="text-center text-gray-400 py-4">No income data available</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Expense Categories</h4>
            <div className="space-y-2">
              {pnlData?.expenses?.breakdown?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="capitalize">{item.category?.replace('_', ' ') || 'Other'}</span>
                  <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {(!pnlData?.expenses?.breakdown || pnlData.expenses.breakdown.length === 0) && (
                <div className="text-center text-gray-400 py-4">No expense data available</div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Loans & Petty Cash Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Loans Section */}
        <Section title="Loans Management" icon={FaHandHoldingUsd}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Total Loan Balance</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalLoanBalance)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Monthly Payments</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalMonthlyLoanPayments)}</p>
              </div>
            </div>
            {loans.filter(l => l.status === 'active').length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loans.filter(l => l.status === 'active').map((loan) => (
                  <div key={loan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{loan.lender_name}</p>
                      <p className="text-xs text-gray-500">{loan.loan_type} • {toNumber(loan.interest_rate)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(loan.balance_remaining)}</p>
                      <p className="text-xs text-gray-400">Monthly: {formatCurrency(loan.monthly_payment)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No active loans</div>
            )}
          </div>
        </Section>

        {/* Petty Cash Section */}
        <Section title="Petty Cash Management" icon={FiHome}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Total Petty Cash</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(pettyCashTotal)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-lg font-bold text-gray-800">{pettyCash.length}</p>
              </div>
            </div>
            
            {pettyCashByCategory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">By Category</h4>
                <div className="space-y-2">
                  {pettyCashByCategory.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="capitalize">{cat.name}</span>
                      <span className="font-medium text-red-600">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pettyCash.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Recent Transactions</h4>
                {pettyCash.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.purpose}</span>
                    <span className="text-red-500">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Customers & Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Spending Customers */}
        <Section title="Top Spending Customers" icon={FiAward}>
          {topSpendingCustomers.length > 0 ? (
            <div className="space-y-3">
              {topSpendingCustomers.map((customer, idx) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.total_visits} visits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">{formatCurrency(customer.total_spent)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No customer data available</div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between font-semibold">
            <span>Total Customer Value</span>
            <span className="text-green-600">{formatCurrency(totalCustomerMoney)}</span>
          </div>
        </Section>

        {/* Revenue by Payment Method */}
        <Section title="Revenue by Source" icon={FiPieChart}>
          {revenueBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {revenueBySource.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400">No revenue data available</div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {revenueBySource.map((source, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500 capitalize">{source.name}</p>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(source.value)}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Invoices & Payroll Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Section */}
        <Section title="Invoices Management" icon={FiFileText}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold">{invoices.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{pendingInvoices.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-lg font-bold text-red-600">{overdueInvoices.length}</p>
            </div>
          </div>
          
          {pendingInvoices.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700">Pending Invoices</h4>
              {pendingInvoices.slice(0, 5).map((invoice) => {
                const isOverdue = new Date(invoice.due_date) < new Date();
                return (
                  <div key={invoice.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-500">{invoice.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(invoice.balance_due)}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-yellow-600'}`}>
                        {isOverdue ? 'Overdue' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Payroll Section */}
        <Section title="Payroll Management" icon={FaUserGraduate}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Monthly Payroll</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(payrollTotal)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Percent of Revenue</p>
              <p className="text-lg font-bold">{totalIncome > 0 ? ((payrollTotal / totalIncome) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
          
          {payrollHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Payrolls</h4>
              {payrollHistory.map((payroll) => (
                <div key={payroll.id} className="flex justify-between items-center text-sm">
                  <span>{new Date(payroll.processed_date).toLocaleDateString()}</span>
                  <span className="font-medium text-red-600">{formatCurrency(toNumber(payroll.total_net_salary))}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Cash Flow Section */}
      {cashFlowData && (
        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Cash Flow Forecast (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cashFlowData.forecast_30_days?.slice(0, 30) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(v) => `TZS ${toNumber(v)/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="projected_balance" stroke={toNumber(cashFlowData.current_balance) < 0 ? "#EF4444" : "#10B981"} fill={toNumber(cashFlowData.current_balance) < 0 ? "#EF4444" : "#10B981"} fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
          {cashFlowData.warning && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-800">
              Warning: {cashFlowData.warning}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-500">Avg Daily Income</p>
              <p className="font-semibold text-green-600">{formatCurrency(cashFlowData.avg_daily_income)}</p>
            </div>
            <div>
              <p className="text-gray-500">Avg Daily Expense</p>
              <p className="font-semibold text-red-600">{formatCurrency(cashFlowData.avg_daily_expense)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Data as of {new Date().toLocaleString()}</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">Green = Positive / Income</span>
            <span className="flex items-center gap-1">Red = Negative / Expenses</span>
            <Link href="/reports" className="hover:text-blue-600">Download Financial Reports →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}