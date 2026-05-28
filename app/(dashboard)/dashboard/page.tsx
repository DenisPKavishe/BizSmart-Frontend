// app/(dashboard)/dashboard/page.tsx - TODAY'S CASHFLOW ONLY

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { salesApi, financialsApi } from '@/services/api';
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
  FiArrowUp,
  FiArrowDown,
  FiCreditCard,
  FiSmartphone,
} from 'react-icons/fi';
import Link from 'next/link';

// Types
interface TodayCashflow {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  transactions: number;
  averageOrderValue: number;
}

interface PaymentMethodBreakdown {
  cash: number;
  mpesa: number;
  card: number;
  total: number;
}

interface RecentTransaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  type: 'income' | 'expense';
  payment_method: string;
  time: string;
}

// Helper function to safely convert to number
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

const formatNumber = (value: number) => {
  return toNumber(value).toLocaleString();
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayCashflow, setTodayCashflow] = useState<TodayCashflow>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    profitMargin: 0,
    transactions: 0,
    averageOrderValue: 0,
  });
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown>({
    cash: 0,
    mpesa: 0,
    card: 0,
    total: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get today's date range
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = startDate;
      
      // Fetch today's sales and transactions
      const [salesRes, transactionsRes] = await Promise.all([
        salesApi.getSales({ 
          start_date: startDate, 
          end_date: endDate,
          page_size: 100 
        }).catch(() => ({ data: null })),
        financialsApi.getTransactions({ 
          start_date: startDate, 
          end_date: endDate,
          page_size: 100 
        }).catch(() => ({ data: null })),
      ]);

      let todayRevenue = 0;
      let todayTransactions = 0;
      let cashTotal = 0;
      let mpesaTotal = 0;
      let cardTotal = 0;
      const transactionsList: RecentTransaction[] = [];

      // Process sales data
      if (salesRes.data) {
        const sales = salesRes.data.results || salesRes.data || [];
        
        sales.forEach((sale: any) => {
          const amount = toNumber(sale.total_amount);
          if (sale.status === 'completed') {
            todayRevenue += amount;
            todayTransactions++;
            
            // Track payment methods
            const method = sale.payment_method?.toLowerCase() || '';
            if (method === 'cash' || method.includes('cash')) {
              cashTotal += amount;
            } else if (method === 'mpesa' || method.includes('mpesa')) {
              mpesaTotal += amount;
            } else if (method === 'card' || method.includes('card')) {
              cardTotal += amount;
            }
            
            // Add to recent transactions list
            transactionsList.push({
              id: sale.id,
              invoice_number: sale.invoice_number,
              customer_name: sale.customer_name || 'Walk-in Customer',
              amount: amount,
              type: 'income',
              payment_method: sale.payment_method || 'cash',
              time: sale.sale_date,
            });
          }
        });
      }

      // Process expenses (if any)
      let todayExpenses = 0;
      if (transactionsRes.data) {
        const transactions = transactionsRes.data.results || transactionsRes.data || [];
        transactions.forEach((t: any) => {
          if (t.type === 'expense') {
            todayExpenses += toNumber(t.amount);
            transactionsList.push({
              id: t.id,
              invoice_number: t.reference || `EXP-${t.id}`,
              customer_name: t.category || 'Expense',
              amount: toNumber(t.amount),
              type: 'expense',
              payment_method: t.payment_method || 'cash',
              time: t.created_at,
            });
          }
        });
      }

      // Sort transactions by time (newest first)
      transactionsList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      const todayProfit = todayRevenue - todayExpenses;
      const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
      const avgOrderValue = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

      setTodayCashflow({
        revenue: todayRevenue,
        expenses: todayExpenses,
        profit: todayProfit,
        profitMargin: profitMargin,
        transactions: todayTransactions,
        averageOrderValue: avgOrderValue,
      });

      setPaymentBreakdown({
        cash: cashTotal,
        mpesa: mpesaTotal,
        card: cardTotal,
        total: todayRevenue,
      });

      setRecentTransactions(transactionsList.slice(0, 10));
      
    } catch (err: any) {
      console.error('Dashboard API Error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTodayData();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-2xl"></div>
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
          <button onClick={fetchTodayData} className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasSales = todayCashflow.revenue > 0 || todayCashflow.transactions > 0;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
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

      {/* Today's Cashflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-100 text-sm">Today's Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(todayCashflow.revenue)}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="bg-white/20 rounded-full px-2 py-1 text-xs">
                  {todayCashflow.transactions} transactions
                </div>
                <div className="bg-white/20 rounded-full px-2 py-1 text-xs">
                  Avg: {formatCurrency(todayCashflow.averageOrderValue)}
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-100 text-sm">Today's Expenses</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(todayCashflow.expenses)}</p>
              <p className="text-red-100 text-xs mt-3">Outgoing payments today</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiTrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className={`rounded-2xl p-6 shadow-lg ${
          todayCashflow.profit >= 0 
            ? 'bg-gradient-to-br from-teal-500 to-teal-600' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600'
        } text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm">Today's Net Profit</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(todayCashflow.profit)}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-white/20 rounded-full px-2 py-1 text-xs">
                  Margin: {todayCashflow.profitMargin.toFixed(1)}%
                </span>
                {todayCashflow.profit >= 0 ? (
                  <FiArrowUp className="w-4 h-4" />
                ) : (
                  <FiArrowDown className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Cash Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentBreakdown.cash)}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${paymentBreakdown.total > 0 ? (paymentBreakdown.cash / paymentBreakdown.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {paymentBreakdown.total > 0 ? ((paymentBreakdown.cash / paymentBreakdown.total) * 100).toFixed(0) : 0}% of today's sales
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiSmartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">M-Pesa Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentBreakdown.mpesa)}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${paymentBreakdown.total > 0 ? (paymentBreakdown.mpesa / paymentBreakdown.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {paymentBreakdown.total > 0 ? ((paymentBreakdown.mpesa / paymentBreakdown.total) * 100).toFixed(0) : 0}% of today's sales
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Card Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentBreakdown.card)}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${paymentBreakdown.total > 0 ? (paymentBreakdown.card / paymentBreakdown.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {paymentBreakdown.total > 0 ? ((paymentBreakdown.card / paymentBreakdown.total) * 100).toFixed(0) : 0}% of today's sales
          </p>
        </div>
      </div>

      {/* No Sales State */}
      {!hasSales && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Today</h3>
          <p className="text-gray-500 mb-4">Start selling to see your cashflow data</p>
          <Link href="/sales/pos" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <FiShoppingCart size={16} />
            Go to POS
          </Link>
        </div>
      )}

      {/* Today's Transactions */}
      {hasSales && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiActivity className="text-blue-500" size={18} />
                <h3 className="font-semibold text-gray-900">Today's Transactions</h3>
              </div>
              <span className="text-xs text-gray-400">{recentTransactions.length} transactions</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Latest sales and expenses from today</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3 space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FiShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions today</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {transaction.type === 'income' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Sale
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Expense
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{transaction.invoice_number}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{transaction.customer_name}</span>
                        {transaction.type === 'income' && <span className="text-gray-400"> made a purchase</span>}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-400">
                          Payment: {transaction.payment_method}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTime(transaction.time)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentTransactions.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <Link href="/sales/history" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
                View All Today's Transactions
                <FiChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}