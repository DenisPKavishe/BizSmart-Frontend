// app/(dashboard)/bi/financial/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, financialsApi, hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiCreditCard,
  FiUsers,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiHome,
  FiTruck,
  FiSmartphone,
} from 'react-icons/fi';
import { FaMoneyBillWave, FaHandHoldingUsd, FaFileInvoice, FaChartLine } from 'react-icons/fa';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

interface PettyCash {
  id: number;
  amount: number | string;
  purpose: string;
  category: string;
  approved_by: string;
  date: string;
}

interface Loan {
  id: number;
  lender_name: string;
  loan_type: string;
  principal_amount: number | string;
  interest_rate: number | string;
  monthly_payment: number | string;
  amount_paid: number | string;
  balance_remaining: number | string;
  status: string;
}

interface Payroll {
  id: number;
  month: number;
  year: number;
  total_net_salary: number | string;
  total_deductions: number | string;
  status: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  status: string;
  due_date: string;
}

interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  pending_invoices: number;
  pending_invoices_amount: number;
  total_loan_balance: number;
  total_monthly_loan_payments: number;
  total_payroll_monthly: number;
  total_petty_cash_month: number;
  cash_position: number;
  projected_30d_expenses: number;
}

export default function FinancialIntelligencePage() {
  const { user } = useAuthStore();
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const parseNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [pettyCashRes, loansRes, payrollsRes, invoicesRes] = await Promise.all([
        financialsApi.getPettyCash(),
        financialsApi.getLoans(),
        hrApi.getPayrolls(),
        financialsApi.getInvoices(),
      ]);

      const pettyCashData = pettyCashRes.data.results || pettyCashRes.data || [];
      const loansData = loansRes.data.results || loansRes.data || [];
      const payrollsData = payrollsRes.data.results || payrollsRes.data || [];
      const invoicesData = invoicesRes.data.results || invoicesRes.data || [];

      setPettyCash(pettyCashData);
      setLoans(loansData);
      setPayrolls(payrollsData);
      setInvoices(invoicesData);
      
      const calculatedSummary = calculateSummary(pettyCashData, loansData, payrollsData, invoicesData);
      setSummary(calculatedSummary);
      generateInsights(pettyCashData, loansData, payrollsData, invoicesData, calculatedSummary);
      
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (pettyCashData: any[], loansData: any[], payrollsData: any[], invoicesData: any[]): FinancialSummary => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate Petty Cash expenses for current month
    const pettyCashMonth = pettyCashData
      .filter(pc => {
        const pcDate = new Date(pc.date);
        return pcDate.getMonth() === currentMonth && pcDate.getFullYear() === currentYear;
      })
      .reduce((sum, pc) => sum + parseNumber(pc.amount), 0);
    
    // Calculate active loan balances
    const activeLoans = loansData.filter(l => l.status === 'active');
    const totalLoanBalance = activeLoans.reduce((sum, l) => sum + parseNumber(l.balance_remaining), 0);
    const totalMonthlyLoanPayments = activeLoans.reduce((sum, l) => sum + parseNumber(l.monthly_payment), 0);
    
    // Calculate current month payroll
    const payrollMonth = payrollsData
      .filter(p => p.month === currentMonth + 1 && p.year === currentYear && p.status === 'paid')
      .reduce((sum, p) => sum + parseNumber(p.total_net_salary), 0);
    
    // Calculate invoice totals
    const pendingInvoices = invoicesData.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, i) => sum + parseNumber(i.balance_due), 0);
    const paidInvoices = invoicesData.filter(i => i.status === 'paid');
    const totalIncome = paidInvoices.reduce((sum, i) => sum + parseNumber(i.total_amount), 0);
    
    // Total expenses
    const totalExpenses = pettyCashMonth + totalMonthlyLoanPayments + payrollMonth;
    
    // Calculate cash position
    const cashPosition = totalIncome - totalExpenses;
    
    // Projected expenses for next 30 days
    const projectedExpenses = totalMonthlyLoanPayments + payrollMonth + (pettyCashMonth * 1.1);
    
    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: cashPosition,
      pending_invoices: pendingInvoices.length,
      pending_invoices_amount: pendingInvoicesAmount,
      total_loan_balance: totalLoanBalance,
      total_monthly_loan_payments: totalMonthlyLoanPayments,
      total_payroll_monthly: payrollMonth,
      total_petty_cash_month: pettyCashMonth,
      cash_position: cashPosition,
      projected_30d_expenses: projectedExpenses,
    };
  };

  const generateInsights = (pettyCashData: any[], loansData: any[], payrollsData: any[], invoicesData: any[], summaryData: FinancialSummary) => {
    const insightsList = [];
    
    // Petty Cash Insights
    const highPettyCash = pettyCashData.filter(pc => parseNumber(pc.amount) > 500000);
    if (highPettyCash.length > 0) {
      insightsList.push({
        type: 'warning',
        category: 'petty_cash',
        title: 'High Petty Cash Expenses',
        description: `${highPettyCash.length} transactions above 500,000 TZS detected`,
        recommendation: 'Review high-value petty cash expenses and consider using bank transfers instead',
        metric_value: highPettyCash.reduce((sum, pc) => sum + parseNumber(pc.amount), 0),
      });
    }
    
    // Loan Insights
    const highInterestLoans = loansData.filter(l => parseNumber(l.interest_rate) > 15);
    if (highInterestLoans.length > 0) {
      insightsList.push({
        type: 'critical',
        category: 'loans',
        title: 'High Interest Loans',
        description: `${highInterestLoans.length} loans with interest rate above 15%`,
        recommendation: 'Consider refinancing or consolidating high-interest loans to reduce monthly payments',
        metric_value: highInterestLoans.length,
      });
    }
    
    const nearlyPaidLoans = loansData.filter(l => l.status === 'active' && parseNumber(l.balance_remaining) < parseNumber(l.monthly_payment) * 2);
    if (nearlyPaidLoans.length > 0) {
      insightsList.push({
        type: 'positive',
        category: 'loans',
        title: 'Loans Nearing Completion',
        description: `${nearlyPaidLoans.length} loans will be paid off within 2 months`,
        recommendation: 'Redirect loan payments to savings or investments after payoff',
        metric_value: nearlyPaidLoans.reduce((sum, l) => sum + parseNumber(l.balance_remaining), 0),
      });
    }
    
    // Payroll Insights
    const payrollTotal = payrollsData.reduce((sum, p) => sum + parseNumber(p.total_net_salary), 0);
    if (summaryData.total_income > 0 && payrollTotal > summaryData.total_income * 0.5) {
      insightsList.push({
        type: 'warning',
        category: 'payroll',
        title: 'High Payroll Cost',
        description: `Payroll (${formatCurrency(payrollTotal)}) exceeds 50% of income`,
        recommendation: 'Review staff productivity and consider performance-based incentives',
        metric_value: payrollTotal,
      });
    }
    
    // Invoice Insights
    const overdueInvoices = invoicesData.filter(i => {
      if (i.status === 'paid' || i.status === 'cancelled') return false;
      const dueDate = new Date(i.due_date);
      const today = new Date();
      return dueDate < today;
    });
    
    if (overdueInvoices.length > 0) {
      insightsList.push({
        type: 'critical',
        category: 'invoices',
        title: 'Overdue Invoices',
        description: `${overdueInvoices.length} invoices are past due date`,
        recommendation: 'Send payment reminders and consider late payment fees',
        metric_value: overdueInvoices.reduce((sum, i) => sum + parseNumber(i.balance_due), 0),
      });
    }
    
    const highValueInvoices = invoicesData.filter(i => parseNumber(i.total_amount) > 1000000 && i.status !== 'paid');
    if (highValueInvoices.length > 0) {
      insightsList.push({
        type: 'opportunity',
        category: 'invoices',
        title: 'Large Pending Payments',
        description: `${highValueInvoices.length} invoices over 1M TZS pending collection`,
        recommendation: 'Prioritize collection of large invoices to improve cash flow',
        metric_value: highValueInvoices.reduce((sum, i) => sum + parseNumber(i.balance_due), 0),
      });
    }
    
    // Cash Flow Insights
    if (summaryData.cash_position < 0) {
      insightsList.push({
        type: 'critical',
        category: 'cash_flow',
        title: 'Negative Cash Flow',
        description: `Current cash flow is negative at ${formatCurrency(summaryData.cash_position)}`,
        recommendation: 'Reduce expenses or accelerate receivables to improve cash position',
        metric_value: summaryData.cash_position,
      });
    }
    
    if (summaryData.total_income > 0 && summaryData.pending_invoices_amount > summaryData.total_income * 0.3) {
      insightsList.push({
        type: 'warning',
        category: 'cash_flow',
        title: 'High Outstanding Receivables',
        description: `${formatCurrency(summaryData.pending_invoices_amount)} in pending invoices (${Math.round(summaryData.pending_invoices_amount / summaryData.total_income * 100)}% of income)`,
        recommendation: 'Implement stricter payment terms or offer early payment discounts',
        metric_value: summaryData.pending_invoices_amount,
      });
    }
    
    setInsights(insightsList);
  };

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return 'TZS 0';
    return `TZS ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-100 text-green-700', label: 'Paid' },
      active: { color: 'bg-blue-100 text-blue-700', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      overdue: { color: 'bg-red-100 text-red-700', label: 'Overdue' },
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      processed: { color: 'bg-blue-100 text-blue-700', label: 'Processed' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`inline-flex text-xs px-2 py-1 rounded-full ${config.color}`}>{config.label}</span>;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'critical':
        return <FiAlertCircle className="text-red-500" size={20} />;
      case 'opportunity':
        return <FaChartLine className="text-amber-500" size={20} />;
      default:
        return <FiAlertCircle className="text-yellow-500" size={20} />;
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
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  // Prepare chart data with safety checks
  const expenseBreakdown = [
    { name: 'Payroll', value: summary?.total_payroll_monthly || 0 },
    { name: 'Loan Payments', value: summary?.total_monthly_loan_payments || 0 },
    { name: 'Petty Cash', value: summary?.total_petty_cash_month || 0 },
  ].filter(item => item.value > 0);

  const incomeVsExpenses = [
    { name: 'Income', amount: summary?.total_income || 0 },
    { name: 'Expenses', amount: summary?.total_expenses || 0 },
  ];

  // Monthly petty cash by category
  const pettyCashByCategory = pettyCash.reduce((acc: any, pc) => {
    const category = pc.category || 'Other';
    if (!acc[category]) acc[category] = 0;
    acc[category] += parseNumber(pc.amount);
    return acc;
  }, {});

  const pettyCashChartData = Object.entries(pettyCashByCategory).map(([name, value]) => ({ name, value }));

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
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Complete financial analysis including loans, payroll, invoices & petty cash</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Income</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.total_income || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">From paid invoices</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiTrendingDown className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.total_expenses || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Payroll + Loans + Petty Cash</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Net Cash Flow</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-blue-600" size={20} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${(summary?.net_cash_flow || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary?.net_cash_flow || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Pending Receivables</p>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FaFileInvoice className="text-amber-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.pending_invoices_amount || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary?.pending_invoices || 0} unpaid invoices</p>
        </div>
      </div>

      {/* Second Row of Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FaHandHoldingUsd className="text-purple-600" size={20} />
            <p className="text-sm text-gray-500">Total Loan Balance</p>
          </div>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(summary?.total_loan_balance || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Monthly: {formatCurrency(summary?.total_monthly_loan_payments || 0)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FiUsers className="text-blue-600" size={20} />
            <p className="text-sm text-gray-500">Monthly Payroll</p>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(summary?.total_payroll_monthly || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Salary expenses</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FiHome className="text-teal-600" size={20} />
            <p className="text-sm text-gray-500">Petty Cash (Month)</p>
          </div>
          <p className="text-xl font-bold text-teal-600">{formatCurrency(summary?.total_petty_cash_month || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Small expenses</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FiTrendingUp className="text-indigo-600" size={20} />
            <p className="text-sm text-gray-500">Projected 30d Expenses</p>
          </div>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(summary?.projected_30d_expenses || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Based on current trends</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `TZS ${value / 1000}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          {expenseBreakdown.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No expense data available</p>
          )}
        </div>
      </div>

      {/* Insights Section */}
      <div className="mb-6">
        <h2 className="font-bold text-lg text-gray-900 mb-3">Financial Insights & Recommendations</h2>
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
                      {insight.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  <p className="text-sm font-medium text-blue-600">{insight.recommendation}</p>
                  {insight.metric_value > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Amount: {formatCurrency(insight.metric_value)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="col-span-2 text-center py-8 bg-white rounded-xl border border-gray-200">
              <FiCheckCircle className="mx-auto text-green-500 mb-2" size={32} />
              <p className="text-gray-500">Great! No critical financial issues detected.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="space-y-6">
        {/* Petty Cash Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiHome className="text-teal-600" />
              Recent Petty Cash Transactions
            </h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pettyCash.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-600">{formatDate(item.date)}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{item.purpose}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-red-600">{formatCurrency(parseNumber(item.amount))}</td>
                  </tr>
                ))}
                {pettyCash.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No petty cash transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FaHandHoldingUsd className="text-purple-600" />
              Active Loans
            </h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.filter(l => l.status === 'active').map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{loan.lender_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{loan.loan_type}</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(parseNumber(loan.principal_amount))}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-amber-600">{formatCurrency(parseNumber(loan.balance_remaining))}</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">{formatCurrency(parseNumber(loan.monthly_payment))}</td>
                    <td className="px-6 py-3 text-center">{getStatusBadge(loan.status)}</td>
                  </tr>
                ))}
                {loans.filter(l => l.status === 'active').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active loans</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FaFileInvoice className="text-amber-600" />
              Pending Invoices
            </h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.filter(i => i.status !== 'paid').slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{invoice.customer_name}</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(parseNumber(invoice.total_amount))}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-amber-600">{formatCurrency(parseNumber(invoice.balance_due))}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-3 text-center">{getStatusBadge(invoice.status)}</td>
                  </tr>
                ))}
                {invoices.filter(i => i.status !== 'paid').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No pending invoices</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}