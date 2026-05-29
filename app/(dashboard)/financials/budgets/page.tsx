// app/(dashboard)/financials/budgets/page.tsx - Complete Budget Management

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { financialsApi } from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiCopy,
  FiArchive,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiArrowLeft,
  FiCalendar,
  FiClock,
} from 'react-icons/fi';

// ==================== TYPES ====================
interface BudgetItem {
  id: number;
  category: string;
  category_name: string;
  type: 'income' | 'expense';
  planned_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  notes: string;
}

interface Budget {
  id: number;
  name: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  period_display: string;
  year: number;
  month?: number;
  quarter?: number;
  status: 'draft' | 'active' | 'archived';
  status_display: string;
  notes: string;
  items: BudgetItem[];
  total_planned_income: number;
  total_actual_income: number;
  total_planned_expenses: number;
  total_actual_expenses: number;
  planned_profit: number;
  actual_profit: number;
  created_at: string;
  updated_at: string;
}

interface BudgetAlert {
  category: string;
  category_name: string;
  type: string;
  planned_amount: number;
  actual_amount: number;
  percentage: number;
  severity: 'warning' | 'critical';
  message: string;
}

// ==================== HELPERS ====================
const formatCurrency = (value: number) => {
  const num = Number(value) || 0;
  if (num === 0) return 'TZS 0';
  if (num >= 1000000) return `TZS ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `TZS ${(num / 1000).toFixed(0)}k`;
  return `TZS ${num.toLocaleString()}`;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const quarterNames = {
  1: 'Q1 (Jan-Mar)',
  2: 'Q2 (Apr-Jun)',
  3: 'Q3 (Jul-Sep)',
  4: 'Q4 (Oct-Dec)',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'draft': return 'bg-gray-100 text-gray-700';
    case 'archived': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPeriodDisplay = (budget: Budget) => {
  if (budget.period === 'monthly' && budget.month) {
    return `${monthNames[budget.month - 1]} ${budget.year}`;
  }
  if (budget.period === 'quarterly' && budget.quarter) {
    return `${quarterNames[budget.quarter as keyof typeof quarterNames]} ${budget.year}`;
  }
  return `${budget.year}`;
};

// ==================== MAIN COMPONENT ====================
export default function BudgetsPage() {
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [overallStatus, setOverallStatus] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');

  // Create/Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    status: 'draft' as 'draft' | 'active' | 'archived',
    notes: '',
  });
  const [items, setItems] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryAmount, setCategoryAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomeCategories = [
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'service', label: 'Service Income' },
    { value: 'other_income', label: 'Other Income' },
  ];

  const expenseCategories = [
    { value: 'salaries', label: 'Salaries & Wages' },
    { value: 'rent', label: 'Rent & Utilities' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'software', label: 'Software & Subscriptions' },
    { value: 'shipping', label: 'Shipping & Delivery' },
    { value: 'utilities', label: 'Utilities (Electricity, Water)' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'maintenance', label: 'Maintenance & Repairs' },
    { value: 'travel', label: 'Travel & Transport' },
    { value: 'other', label: 'Other Expenses' },
  ];

  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    fetchBudgets();
  }, [selectedYear, periodFilter, statusFilter]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const params: any = { year: selectedYear };
      if (periodFilter !== 'all') params.period = periodFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await financialsApi.getBudgets(params);
      setBudgets(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgetDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await financialsApi.getBudgetVsActual(id);
      setSelectedBudget(response.data.budget);
      setAlerts(response.data.alerts || []);
      setOverallStatus(response.data.overall_status);
      setViewMode('detail');
    } catch (error: any) {
      console.error('Failed to fetch budget details:', error);
      toast.error(error.response?.data?.error || 'Failed to load budget details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;
    setIsDeleting(true);
    try {
      await financialsApi.deleteBudget(selectedBudget.id);
      toast.success('Budget deleted successfully');
      setShowDeleteModal(false);
      setSelectedBudget(null);
      fetchBudgets();
      setViewMode('list');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedBudget) return;
    setIsArchiving(true);
    try {
      await financialsApi.updateBudget(selectedBudget.id, { status: 'archived' });
      toast.success('Budget archived successfully');
      setShowArchiveModal(false);
      fetchBudgets();
      if (viewMode === 'detail') fetchBudgetDetail(selectedBudget.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive budget');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedBudget) return;
    try {
      await financialsApi.updateBudget(selectedBudget.id, { status: 'active' });
      toast.success('Budget activated successfully');
      fetchBudgetDetail(selectedBudget.id);
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate budget');
    }
  };

  const handleCopy = async () => {
    if (!selectedBudget) return;
    try {
      const targetYear = selectedBudget.year + 1;
      await financialsApi.copyBudget(selectedBudget.id, {
        name: `${selectedBudget.name} (Copy)`,
        year: targetYear,
        period: selectedBudget.period,
        month: selectedBudget.month,
        quarter: selectedBudget.quarter,
      });
      toast.success('Budget copied successfully');
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to copy budget');
    }
  };

  const addItem = () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    if (!categoryAmount || parseFloat(categoryAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const categoryMap = [...incomeCategories, ...expenseCategories];
    const category = categoryMap.find(c => c.value === selectedCategory);
    if (!category) return;
    
    // Check for duplicate category
    const existingItem = items.find(i => i.category === selectedCategory && i.type === selectedType);
    if (existingItem) {
      toast.error('This category already exists in the budget');
      return;
    }
    
    setItems([...items, {
      category: selectedCategory,
      category_name: category.label,
      type: selectedType,
      planned_amount: parseFloat(categoryAmount),
    }]);
    setSelectedCategory('');
    setCategoryAmount('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemAmount = (index: number, amount: number) => {
    const updated = [...items];
    updated[index].planned_amount = amount;
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetail('');
    
    if (!formData.name.trim()) {
      toast.error('Budget name is required');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one budget item');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare budget data
      const budgetData: any = {
        name: formData.name,
        period: formData.period,
        year: formData.year,
        status: formData.status,
        notes: formData.notes || '',
      };
      
      // Only add month/quarter for specific periods
      if (formData.period === 'monthly') {
        budgetData.month = formData.month;
      }
      if (formData.period === 'quarterly') {
        budgetData.quarter = formData.quarter;
      }
      
      console.log('Submitting budget data:', budgetData);
      
      const budgetRes = await financialsApi.createBudget(budgetData);
      const budgetId = budgetRes.data.id;
      
      // Create budget items
      for (const item of items) {
        await financialsApi.addBudgetItem(budgetId, {
          category: item.category,
          category_name: item.category_name,
          type: item.type,
          planned_amount: item.planned_amount,
        });
      }
      
      toast.success('Budget created successfully');
      setViewMode('list');
      setItems([]);
      resetForm();
      fetchBudgets();
      
    } catch (error: any) {
      console.error('Failed to create budget:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
          setErrorDetail(errorMsg);
          toast.error(errorMsg);
        } else {
          toast.error(errorData || 'Failed to create budget');
        }
      } else {
        toast.error('Failed to create budget');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetail('');
    
    if (!selectedBudget) return;
    
    if (!formData.name.trim()) {
      toast.error('Budget name is required');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one budget item');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update budget
      const budgetData: any = {
        name: formData.name,
        period: formData.period,
        year: formData.year,
        status: formData.status,
        notes: formData.notes || '',
      };
      
      if (formData.period === 'monthly') {
        budgetData.month = formData.month;
      }
      if (formData.period === 'quarterly') {
        budgetData.quarter = formData.quarter;
      }
      
      await financialsApi.updateBudget(selectedBudget.id, budgetData);
      
      // Delete existing budget items
      for (const item of selectedBudget.items) {
        await financialsApi.deleteBudgetItem(selectedBudget.id, item.id);
      }
      
      // Create new budget items
      for (const item of items) {
        await financialsApi.addBudgetItem(selectedBudget.id, {
          category: item.category,
          category_name: item.category_name,
          type: item.type,
          planned_amount: item.planned_amount,
        });
      }
      
      toast.success('Budget updated successfully');
      setViewMode('list');
      setItems([]);
      fetchBudgets();
      
    } catch (error: any) {
      console.error('Failed to update budget:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
          setErrorDetail(errorMsg);
          toast.error(errorMsg);
        } else {
          toast.error(errorData || 'Failed to update budget');
        }
      } else {
        toast.error('Failed to update budget');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      period: 'monthly',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      quarter: Math.floor(new Date().getMonth() / 3) + 1,
      status: 'draft',
      notes: '',
    });
    setItems([]);
    setSelectedCategory('');
    setCategoryAmount('');
    setErrorDetail('');
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      name: budget.name,
      period: budget.period,
      year: budget.year,
      month: budget.month || 1,
      quarter: budget.quarter || 1,
      status: budget.status,
      notes: budget.notes || '',
    });
    setItems(budget.items.map(item => ({
      category: item.category,
      category_name: item.category_name,
      type: item.type,
      planned_amount: item.planned_amount,
    })));
    setViewMode('edit');
  };

  const resetFilters = () => {
    setPeriodFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setSelectedYear(new Date().getFullYear());
  };

  const filteredBudgets = budgets.filter(budget =>
    budget.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals for edit/create view
  const totalIncome = items.filter(i => i.type === 'income').reduce((s, i) => s + i.planned_amount, 0);
  const totalExpenses = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.planned_amount, 0);
  const plannedProfit = totalIncome - totalExpenses;

  // Calculate summary for list view
  const summary = budgets.reduce((acc, b) => ({
    income: acc.income + b.total_actual_income,
    expenses: acc.expenses + b.total_actual_expenses,
    profit: acc.profit + b.actual_profit,
  }), { income: 0, expenses: 0, profit: 0 });

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-sm text-gray-500 mt-1">Plan and track your financial goals</p>
          </div>
          <button
            onClick={() => { 
              setViewMode('create'); 
              resetForm();
              setFormData({ 
                ...formData, 
                name: `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()} Budget`,
              }); 
            }}
            className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus size={18} />
            New Budget
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
            <p className="text-xs text-gray-400 mt-1">Actual vs Planned</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expenses)}</p>
            <p className="text-xs text-gray-400 mt-1">Actual vs Planned</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.profit)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Actual vs Planned</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search budgets by name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={16} />
              Filters
            </button>
            <button 
              onClick={fetchBudgets} 
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-blue-200 transition"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600">
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Period Type</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Periods</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Budget List */}
        {filteredBudgets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiDollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
            <p className="text-gray-500 mb-4">Create your first budget to start planning</p>
            <button 
              onClick={() => { setViewMode('create'); resetForm(); }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus size={18} />
              New Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBudgets.map((budget) => (
              <div 
                key={budget.id} 
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => fetchBudgetDetail(budget.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(budget.status)}`}>
                        {budget.status_display}
                      </span>
                      <span className="text-xs text-gray-400">{budget.period_display}</span>
                      <span className="text-xs text-gray-400">{getPeriodDisplay(budget)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => openEditModal(budget)} 
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    {budget.status !== 'archived' && (
                      <button 
                        onClick={() => { setSelectedBudget(budget); setShowArchiveModal(true); }} 
                        className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                        title="Archive"
                      >
                        <FiArchive size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => { setSelectedBudget(budget); setShowDeleteModal(true); }} 
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Income</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(budget.total_actual_income)}</p>
                    <p className="text-xs text-gray-400">Planned: {formatCurrency(budget.total_planned_income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(budget.total_actual_expenses)}</p>
                    <p className="text-xs text-gray-400">Planned: {formatCurrency(budget.total_planned_expenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profit</p>
                    <p className={`text-sm font-semibold ${budget.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budget.actual_profit)}
                    </p>
                    <p className="text-xs text-gray-400">Planned: {formatCurrency(budget.planned_profit)}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((budget.total_actual_income / budget.total_planned_income) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedBudget) {
    const profitVariance = selectedBudget.actual_profit - selectedBudget.planned_profit;
    const profitVariancePercent = selectedBudget.planned_profit ? (profitVariance / selectedBudget.planned_profit) * 100 : 0;

    return (
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setViewMode('list'); setSelectedBudget(null); }} 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedBudget.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedBudget.status)}`}>
                  {selectedBudget.status_display}
                </span>
                <span className="text-xs text-gray-400">{selectedBudget.period_display}</span>
                <span className="text-xs text-gray-400">{getPeriodDisplay(selectedBudget)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedBudget.status !== 'archived' && (
              <>
                <button 
                  onClick={() => openEditModal(selectedBudget)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
                <button 
                  onClick={handleCopy} 
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <FiCopy size={16} />
                  Copy
                </button>
                {selectedBudget.status === 'draft' && (
                  <button 
                    onClick={handleActivate} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <FiCheckCircle size={16} />
                    Activate
                  </button>
                )}
                <button 
                  onClick={() => setShowArchiveModal(true)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition flex items-center gap-2"
                >
                  <FiArchive size={16} />
                  Archive
                </button>
              </>
            )}
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2"
            >
              <FiTrash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  alert.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <FiAlertCircle className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} size={18} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Planned: {formatCurrency(alert.planned_amount)} | Actual: {formatCurrency(alert.actual_amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overall Status */}
        {overallStatus && (
          <div className={`mb-6 p-4 rounded-xl ${
            overallStatus.is_on_track ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {overallStatus.is_on_track ? (
                <FiCheckCircle className="text-green-600" size={20} />
              ) : (
                <FiAlertCircle className="text-yellow-600" size={20} />
              )}
              <div>
                <p className={`font-medium ${overallStatus.is_on_track ? 'text-green-800' : 'text-yellow-800'}`}>
                  {overallStatus.is_on_track ? 'On Track' : 'Needs Attention'}
                </p>
                <p className="text-sm text-gray-600">
                  Profit {overallStatus.profit_variance >= 0 ? 'above' : 'below'} target by {formatCurrency(Math.abs(overallStatus.profit_variance))}
                  ({Math.abs(overallStatus.profit_variance_percentage).toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedBudget.total_actual_income)}</p>
            <p className="text-xs text-gray-400 mt-1">Target: {formatCurrency(selectedBudget.total_planned_income)}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min((selectedBudget.total_actual_income / selectedBudget.total_planned_income) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedBudget.total_actual_expenses)}</p>
            <p className="text-xs text-gray-400 mt-1">Budget: {formatCurrency(selectedBudget.total_planned_expenses)}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${selectedBudget.total_actual_expenses <= selectedBudget.total_planned_expenses ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((selectedBudget.total_actual_expenses / selectedBudget.total_planned_expenses) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(selectedBudget.actual_profit)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Target: {formatCurrency(selectedBudget.planned_profit)}</p>
            <p className={`text-xs mt-1 ${profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitVariance >= 0 ? '+' : ''}{profitVariancePercent.toFixed(1)}% vs target
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Profit Margin</p>
            <p className="text-2xl font-bold text-blue-600">
              {selectedBudget.total_actual_income ? ((selectedBudget.actual_profit / selectedBudget.total_actual_income) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Target: {selectedBudget.total_planned_income ? ((selectedBudget.planned_profit / selectedBudget.total_planned_income) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        {/* Income Section */}
        {selectedBudget.items.filter(i => i.type === 'income').length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-green-600" size={18} />
                <h2 className="font-semibold text-gray-900">Income</h2>
                <span className="text-xs text-gray-400 ml-2">
                  {selectedBudget.items.filter(i => i.type === 'income').length} categories
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Planned</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedBudget.items.filter(i => i.type === 'income').map((item) => {
                    const progress = (item.actual_amount / item.planned_amount) * 100;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.category_name}</p>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {formatCurrency(item.planned_amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.actual_amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.variance >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                            {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                            <span className="text-xs">({item.variance_percentage.toFixed(0)}%)</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">{Math.min(progress, 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-gray-900">Total Income</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(selectedBudget.total_planned_income)}</td>
                    <td className="px-6 py-4 text-right text-green-600">{formatCurrency(selectedBudget.total_actual_income)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={selectedBudget.total_actual_income - selectedBudget.total_planned_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {selectedBudget.total_actual_income - selectedBudget.total_planned_income >= 0 ? '+' : ''}
                        {formatCurrency(selectedBudget.total_actual_income - selectedBudget.total_planned_income)}
                      </span>
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Section */}
        {selectedBudget.items.filter(i => i.type === 'expense').length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FiTrendingDown className="text-red-600" size={18} />
                <h2 className="font-semibold text-gray-900">Expenses</h2>
                <span className="text-xs text-gray-400 ml-2">
                  {selectedBudget.items.filter(i => i.type === 'expense').length} categories
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Planned</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedBudget.items.filter(i => i.type === 'expense').map((item) => {
                    const progress = (item.actual_amount / item.planned_amount) * 100;
                    const isOverBudget = item.variance > 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.category_name}</p>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {formatCurrency(item.planned_amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.actual_amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                            {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                            <span className="text-xs">({item.variance_percentage.toFixed(0)}%)</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs w-12 text-right ${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-gray-900">Total Expenses</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(selectedBudget.total_planned_expenses)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(selectedBudget.total_actual_expenses)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={selectedBudget.total_actual_expenses <= selectedBudget.total_planned_expenses ? 'text-green-600' : 'text-red-600'}>
                        {selectedBudget.total_actual_expenses - selectedBudget.total_planned_expenses >= 0 ? '+' : ''}
                        {formatCurrency(selectedBudget.total_actual_expenses - selectedBudget.total_planned_expenses)}
                      </span>
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedBudget.notes && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
            <p className="text-sm text-gray-600">{selectedBudget.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // ==================== CREATE/EDIT VIEW ====================
  if (viewMode === 'create' || viewMode === 'edit') {
    const isEdit = viewMode === 'edit';
    
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => { setViewMode('list'); setItems([]); resetForm(); setErrorDetail(''); }} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Budget' : 'Create New Budget'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEdit ? 'Update your budget plan' : 'Plan your financial goals for the period'}
            </p>
          </div>
        </div>

        {errorDetail && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{errorDetail}</p>
            </div>
          </div>
        )}

        <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g., May 2024 Budget, Q2 2024 Budget"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select 
                  value={formData.period} 
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as any })} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              {formData.period === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select 
                    value={formData.month} 
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.period === 'quarterly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                  <select 
                    value={formData.quarter} 
                    onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value) })} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Q1 (January - March)</option>
                    <option value={2}>Q2 (April - June)</option>
                    <option value={3}>Q3 (July - September)</option>
                    <option value={4}>Q4 (October - December)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  rows={3} 
                  placeholder="Any additional notes about this budget..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>

          {/* Budget Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Items</h2>
            
            {/* Add Item Form */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedType('income')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedType === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FiTrendingUp size={14} className="inline mr-1" />
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedType('expense')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedType === 'expense'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FiTrendingDown size={14} className="inline mr-1" />
                      Expense
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {(selectedType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount (TZS)</label>
                  <input
                    type="number"
                    value={categoryAmount}
                    onChange={(e) => setCategoryAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <FiPlus size={16} />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <>
                {/* Income Items */}
                {items.filter(i => i.type === 'income').length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FiTrendingUp className="text-green-600" size={16} />
                      Income Items
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Planned Amount</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.filter(i => i.type === 'income').map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.category_name}</td>
                              <td className="px-4 py-2 text-right">
                                <input
                                  type="number"
                                  value={item.planned_amount}
                                  onChange={(e) => updateItemAmount(items.indexOf(item), parseFloat(e.target.value) || 0)}
                                  className="w-32 px-2 py-1 text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(items.indexOf(item))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expense Items */}
                {items.filter(i => i.type === 'expense').length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FiTrendingDown className="text-red-600" size={16} />
                      Expense Items
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Planned Amount</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.filter(i => i.type === 'expense').map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.category_name}</td>
                              <td className="px-4 py-2 text-right">
                                <input
                                  type="number"
                                  value={item.planned_amount}
                                  onChange={(e) => updateItemAmount(items.indexOf(item), parseFloat(e.target.value) || 0)}
                                  className="w-32 px-2 py-1 text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(items.indexOf(item))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Planned Income:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Planned Expenses:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Planned Profit:</span>
                  <span className={`font-bold text-lg ${plannedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(plannedProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setViewMode('list'); setItems([]); resetForm(); }}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  {isEdit ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==================== MODALS ====================
  return (
    <>
      {/* Delete Modal */}
      {showDeleteModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiAlertCircle className="text-red-500" size={20} />
                Delete Budget
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{selectedBudget.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiArchive className="text-amber-500" size={20} />
                Archive Budget
              </h3>
              <button onClick={() => setShowArchiveModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Archive <span className="font-semibold text-gray-900">"{selectedBudget.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">Archived budgets are read-only and can be restored later.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                </button>
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}