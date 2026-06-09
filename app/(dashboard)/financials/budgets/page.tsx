// app/(dashboard)/financials/budgets/page.tsx - FULLY FIXED

'use client';

import { useState, useEffect } from 'react';
import { financialsApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiFilter, FiRefreshCw,
  FiCopy, FiArchive, FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiCheckCircle, FiX, FiArrowLeft,
} from 'react-icons/fi';

interface BudgetItemType {
  id: number;
  category: string;
  category_name: string;
  type: 'income' | 'expense';
  planned_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
}

interface BudgetType {
  id: number;
  name: string;
  period: string;
  year: number;
  month?: number;
  quarter?: number;
  status: string;
  notes: string;
  items: BudgetItemType[];
  total_planned_income: number;
  total_actual_income: number;
  total_planned_expenses: number;
  total_actual_expenses: number;
  planned_profit: number;
  actual_profit: number;
}

const formatCurrency = (value: number) => {
  const num = Number(value) || 0;
  return `TZS ${num.toLocaleString()}`;
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getStatusColor = (status: string) => {
  if (status === 'active') return 'bg-green-100 text-green-700';
  if (status === 'draft') return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-500';
};

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
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other Expenses' },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetType | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '', 
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly', 
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, 
    quarter: 1, 
    status: 'draft' as 'draft' | 'active', 
    notes: '',
  });
  const [items, setItems] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryAmount, setCategoryAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = [2023, 2024, 2025, 2026, 2027];

  useEffect(() => { fetchBudgets(); }, [selectedYear]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await financialsApi.getBudgets({ year: selectedYear });
      const data = res.data.results || res.data || [];
      const processedBudgets = data.map((budget: any) => {
        let totalPlannedIncome = 0, totalPlannedExpenses = 0;
        let totalActualIncome = 0, totalActualExpenses = 0;
        const processedItems = (budget.items || []).map((item: any) => {
          const planned = parseFloat(item.planned_amount) || 0;
          const actual = parseFloat(item.actual_amount) || 0;
          if (item.type === 'income') {
            totalPlannedIncome += planned;
            totalActualIncome += actual;
          } else {
            totalPlannedExpenses += planned;
            totalActualExpenses += actual;
          }
          return {
            ...item,
            planned_amount: planned,
            actual_amount: actual,
            variance: actual - planned,
            variance_percentage: planned ? ((actual - planned) / planned) * 100 : 0
          };
        });
        return {
          ...budget,
          items: processedItems,
          total_planned_income: totalPlannedIncome,
          total_actual_income: totalActualIncome,
          total_planned_expenses: totalPlannedExpenses,
          total_actual_expenses: totalActualExpenses,
          planned_profit: totalPlannedIncome - totalPlannedExpenses,
          actual_profit: totalActualIncome - totalActualExpenses
        };
      });
      setBudgets(processedBudgets);
    } catch (error) { 
      toast.error('Failed to load budgets'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const fetchBudgetDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await financialsApi.getBudgetVsActual(id);
      const budgetData = res.data.budget;
      let totalPlannedIncome = 0, totalPlannedExpenses = 0;
      let totalActualIncome = 0, totalActualExpenses = 0;
      const processedItems = (budgetData.items || []).map((item: any) => {
        const planned = parseFloat(item.planned_amount) || 0;
        const actual = parseFloat(item.actual_amount) || 0;
        if (item.type === 'income') {
          totalPlannedIncome += planned;
          totalActualIncome += actual;
        } else {
          totalPlannedExpenses += planned;
          totalActualExpenses += actual;
        }
        return {
          ...item,
          planned_amount: planned,
          actual_amount: actual,
          variance: actual - planned,
          variance_percentage: planned ? ((actual - planned) / planned) * 100 : 0
        };
      });
      setSelectedBudget({
        ...budgetData,
        items: processedItems,
        total_planned_income: totalPlannedIncome,
        total_actual_income: totalActualIncome,
        total_planned_expenses: totalPlannedExpenses,
        total_actual_expenses: totalActualExpenses,
        planned_profit: totalPlannedIncome - totalPlannedExpenses,
        actual_profit: totalActualIncome - totalActualExpenses
      });
      setViewMode('detail');
    } catch (error) { 
      toast.error('Failed to load details'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;
    setIsDeleting(true);
    try {
      await financialsApi.deleteBudget(selectedBudget.id);
      toast.success(`Budget "${selectedBudget.name}" deleted`);
      setShowDeleteModal(false);
      setSelectedBudget(null);
      await fetchBudgets();
      setViewMode('list');
    } catch (error: any) {
      if (error.response?.status === 405) {
        try {
          await financialsApi.updateBudget(selectedBudget.id, { status: 'archived' });
          toast.success(`Budget "${selectedBudget.name}" archived`);
          setShowDeleteModal(false);
          setSelectedBudget(null);
          await fetchBudgets();
          setViewMode('list');
        } catch (archiveError: any) {
          toast.error('Failed to archive budget');
        }
      } else {
        toast.error('Delete failed');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedBudget) return;
    setIsArchiving(true);
    try {
      await financialsApi.updateBudget(selectedBudget.id, { status: 'archived' });
      toast.success(`Budget "${selectedBudget.name}" archived`);
      setShowArchiveModal(false);
      await fetchBudgets();
      if (viewMode === 'detail') setViewMode('list');
    } catch (error: any) { 
      toast.error('Archive failed'); 
    } finally { 
      setIsArchiving(false); 
    }
  };

  const handleActivate = async () => {
    if (!selectedBudget) return;
    try {
      await financialsApi.updateBudget(selectedBudget.id, { status: 'active' });
      toast.success(`Budget "${selectedBudget.name}" activated`);
      await fetchBudgetDetail(selectedBudget.id);
      await fetchBudgets();
    } catch (error: any) { 
      toast.error('Activate failed'); 
    }
  };

  const handleCopy = async () => {
    if (!selectedBudget) return;
    try {
      await financialsApi.copyBudget(selectedBudget.id, { 
        name: `${selectedBudget.name} (Copy)`, 
        year: selectedBudget.year + 1 
      });
      toast.success('Budget copied');
      await fetchBudgets();
    } catch (error: any) { 
      toast.error('Copy failed'); 
    }
  };

  const addItem = () => {
    if (!selectedCategory) { toast.error('Select category'); return; }
    const amount = parseFloat(categoryAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter valid amount'); return; }
    const catMap = [...incomeCategories, ...expenseCategories];
    const cat = catMap.find(c => c.value === selectedCategory);
    if (!cat) return;
    if (items.find(i => i.category === selectedCategory && i.type === selectedType)) {
      toast.error('Category already exists'); return;
    }
    setItems([...items, { 
      category: selectedCategory, 
      category_name: cat.label, 
      type: selectedType, 
      planned_amount: amount 
    }]);
    setSelectedCategory('');
    setCategoryAmount('');
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  
  const updateItemAmount = (index: number, amount: number) => {
    const updated = [...items];
    updated[index].planned_amount = amount;
    setItems(updated);
  };

  const validateForm = () => {
    if (!formData.name.trim()) { setErrors({ name: 'Name required' }); return false; }
    if (items.length === 0) { setErrors({ items: 'Add at least one item' }); return false; }
    setErrors({});
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload: any = { 
        name: formData.name.trim(), 
        period: formData.period, 
        year: formData.year, 
        status: formData.status, 
        notes: formData.notes || '', 
        items: items.map(i => ({ 
          category: i.category, 
          category_name: i.category_name, 
          type: i.type, 
          planned_amount: i.planned_amount 
        }))
      };
      if (formData.period === 'monthly') { payload.month = formData.month; payload.quarter = 1; }
      if (formData.period === 'quarterly') { payload.quarter = formData.quarter; }
      if (formData.period === 'yearly') { payload.quarter = 1; }
      await financialsApi.createBudget(payload);
      toast.success('Budget created');
      resetForm();
      setViewMode('list');
      await fetchBudgets();
    } catch (error: any) { 
      toast.error('Creation failed'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedBudget) return;
    setIsSubmitting(true);
    try {
      const payload: any = { 
        name: formData.name.trim(), 
        period: formData.period, 
        year: formData.year, 
        status: formData.status, 
        notes: formData.notes || '', 
        items: items.map(i => ({ 
          category: i.category, 
          category_name: i.category_name, 
          type: i.type, 
          planned_amount: i.planned_amount 
        }))
      };
      if (formData.period === 'monthly') { payload.month = formData.month; payload.quarter = 1; }
      if (formData.period === 'quarterly') { payload.quarter = formData.quarter; }
      if (formData.period === 'yearly') { payload.quarter = 1; }
      await financialsApi.updateBudget(selectedBudget.id, payload);
      toast.success('Budget updated');
      resetForm();
      setViewMode('list');
      await fetchBudgets();
    } catch (error: any) { 
      toast.error('Update failed'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', period: 'monthly', year: new Date().getFullYear(), 
      month: new Date().getMonth() + 1, quarter: 1, status: 'draft', notes: '' 
    });
    setItems([]);
    setSelectedCategory('');
    setCategoryAmount('');
    setErrors({});
  };

  const openEditModal = (budget: BudgetType) => {
    setSelectedBudget(budget);
    setFormData({ 
      name: budget.name, period: budget.period as any, year: budget.year, 
      month: budget.month || 1, quarter: budget.quarter || 1, 
      status: budget.status as any, notes: budget.notes || '' 
    });
    setItems(budget.items.map(i => ({ 
      category: i.category, category_name: i.category_name, type: i.type, planned_amount: i.planned_amount 
    })));
    setViewMode('edit');
  };

  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({ ...prev, name: `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()} Budget` }));
    setViewMode('create');
  };

  const filteredBudgets = budgets.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalIncome = items.filter(i => i.type === 'income').reduce((s, i) => s + i.planned_amount, 0);
  const totalExpenses = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.planned_amount, 0);
  const plannedProfit = totalIncome - totalExpenses;

  // ========== LIST VIEW ==========
  if (viewMode === 'list') {
    return (
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <div><h1 className="text-2xl font-bold">Budgets</h1><p className="text-gray-500 text-sm">Plan and track financial goals</p></div>
          <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FiPlus /> New Budget</button>
        </div>
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative"><FiSearch className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Search budgets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <button onClick={fetchBudgets} className="p-2 border rounded-lg"><FiRefreshCw /></button>
          </div>
        </div>
        {isLoading ? <div className="text-center py-12">Loading...</div> : filteredBudgets.length === 0 ? (
          <div className="text-center py-12"><FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No budgets found</p><button onClick={openCreateModal} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Create Budget</button></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBudgets.map(b => (
              <div key={b.id} className="bg-white rounded-xl border p-5 hover:shadow-md cursor-pointer" onClick={() => fetchBudgetDetail(b.id)}>
                <div className="flex justify-between">
                  <div><h3 className="font-semibold text-lg">{b.name}</h3><div className="flex gap-2 mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>{b.status}</span><span className="text-xs text-gray-400">{b.period}</span></div></div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditModal(b)} className="p-1.5 text-gray-400 hover:text-amber-600"><FiEdit2 size={16} /></button>
                    {b.status !== 'archived' && <button onClick={() => { setSelectedBudget(b); setShowArchiveModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-600"><FiArchive size={16} /></button>}
                    <button onClick={() => { setSelectedBudget(b); setShowDeleteModal(true); }} className="p-1.5 text-gray-400 hover:text-red-600"><FiTrash2 size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t">
                  <div><p className="text-xs text-gray-500">Income</p><p className="font-semibold text-green-600">{formatCurrency(b.total_actual_income)}</p><p className="text-xs text-gray-400">Planned: {formatCurrency(b.total_planned_income)}</p></div>
                  <div><p className="text-xs text-gray-500">Expenses</p><p className="font-semibold text-red-600">{formatCurrency(b.total_actual_expenses)}</p><p className="text-xs text-gray-400">Planned: {formatCurrency(b.total_planned_expenses)}</p></div>
                  <div><p className="text-xs text-gray-500">Profit</p><p className={`font-semibold ${b.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(b.actual_profit)}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========== DETAIL VIEW ==========
  if (viewMode === 'detail' && selectedBudget) {
    const incomeItems = selectedBudget.items.filter(i => i.type === 'income');
    const expenseItems = selectedBudget.items.filter(i => i.type === 'expense');
    
    return (
      <div className="p-6">
        <button onClick={() => { setViewMode('list'); setSelectedBudget(null); }} className="flex items-center gap-2 text-gray-600 mb-4"><FiArrowLeft /> Back</button>
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold">{selectedBudget.name}</h1><span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedBudget.status)}`}>{selectedBudget.status}</span></div>
          <div className="flex gap-2">
            <button onClick={() => openEditModal(selectedBudget)} className="px-4 py-2 border rounded-lg"><FiEdit2 className="inline mr-1" /> Edit</button>
            <button onClick={handleCopy} className="px-4 py-2 border rounded-lg"><FiCopy className="inline mr-1" /> Copy</button>
            {selectedBudget.status === 'draft' && <button onClick={handleActivate} className="px-4 py-2 bg-green-600 text-white rounded-lg"><FiCheckCircle className="inline mr-1" /> Activate</button>}
            <button onClick={() => setShowArchiveModal(true)} className="px-4 py-2 border rounded-lg"><FiArchive className="inline mr-1" /> Archive</button>
            <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 border rounded-lg text-red-600"><FiTrash2 className="inline mr-1" /> Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 border rounded-xl"><p className="text-gray-500 text-sm">Total Income</p><p className="text-2xl font-bold text-green-600">{formatCurrency(selectedBudget.total_actual_income)}</p><p className="text-xs text-gray-400">Target: {formatCurrency(selectedBudget.total_planned_income)}</p></div>
          <div className="bg-white p-5 border rounded-xl"><p className="text-gray-500 text-sm">Total Expenses</p><p className="text-2xl font-bold text-red-600">{formatCurrency(selectedBudget.total_actual_expenses)}</p><p className="text-xs text-gray-400">Budget: {formatCurrency(selectedBudget.total_planned_expenses)}</p></div>
          <div className="bg-white p-5 border rounded-xl"><p className="text-gray-500 text-sm">Net Profit</p><p className={`text-2xl font-bold ${selectedBudget.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(selectedBudget.actual_profit)}</p><p className="text-xs text-gray-400">Target: {formatCurrency(selectedBudget.planned_profit)}</p></div>
          <div className="bg-white p-5 border rounded-xl"><p className="text-gray-500 text-sm">Profit Margin</p><p className="text-2xl font-bold text-blue-600">{selectedBudget.total_actual_income ? ((selectedBudget.actual_profit / selectedBudget.total_actual_income) * 100).toFixed(1) : 0}%</p></div>
        </div>
        
        {incomeItems.length > 0 && (
          <div className="bg-white rounded-xl border mb-6">
            <div className="px-6 py-3 bg-green-50 border-b"><FiTrendingUp className="inline text-green-600 mr-2" /> Income</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs">Category</th><th className="px-6 py-3 text-right text-xs">Planned</th><th className="px-6 py-3 text-right text-xs">Actual</th><th className="px-6 py-3 text-right text-xs">Variance</th></tr>
                </thead>
                <tbody className="divide-y">
                  {incomeItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">{item.category_name}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.planned_amount)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.actual_amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={item.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(selectedBudget.total_planned_income)}</td>
                    <td className="px-6 py-4 text-right text-green-600">{formatCurrency(selectedBudget.total_actual_income)}</td>
                    <td className="px-6 py-4 text-right">--</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {expenseItems.length > 0 && (
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-3 bg-red-50 border-b"><FiTrendingDown className="inline text-red-600 mr-2" /> Expenses</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs">Category</th><th className="px-6 py-3 text-right text-xs">Planned</th><th className="px-6 py-3 text-right text-xs">Actual</th><th className="px-6 py-3 text-right text-xs">Variance</th></tr>
                </thead>
                <tbody className="divide-y">
                  {expenseItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">{item.category_name}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.planned_amount)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.actual_amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={item.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(selectedBudget.total_planned_expenses)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(selectedBudget.total_actual_expenses)}</td>
                    <td className="px-6 py-4 text-right">--</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {selectedBudget.notes && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl"><h4 className="font-medium mb-2">Notes</h4><p className="text-gray-600">{selectedBudget.notes}</p></div>
        )}
      </div>
    );
  }

  // ========== CREATE/EDIT VIEW ==========
  if (viewMode === 'create' || viewMode === 'edit') {
    const isEdit = viewMode === 'edit';
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => { setViewMode('list'); resetForm(); }} className="flex items-center gap-2 text-gray-600 mb-4"><FiArrowLeft /> Back</button>
        <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Budget' : 'Create New Budget'}</h1>
        <p className="text-gray-500 mb-6">{isEdit ? 'Update your budget plan' : 'Plan your financial goals'}</p>
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {errors.name && <p className="text-red-600 text-sm">• {errors.name}</p>}
            {errors.items && <p className="text-red-600 text-sm">• {errors.items}</p>}
          </div>
        )}
        <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium mb-1">Budget Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Period</label><select value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Year</label><select value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              {formData.period === 'monthly' && <div><label className="block text-sm font-medium mb-1">Month</label><select value={formData.month} onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg">{monthNames.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>}
              {formData.period === 'quarterly' && <div><label className="block text-sm font-medium mb-1">Quarter</label><select value={formData.quarter} onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg"><option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option></select></div>}
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg"><option value="draft">Draft</option><option value="active">Active</option></select></div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Optional notes" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-4">Budget Items</h2>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="grid grid-cols-4 gap-4">
                <div><label className="text-sm font-medium mb-1 block">Type</label><div className="flex gap-2"><button type="button" onClick={() => setSelectedType('income')} className={`flex-1 py-2 rounded-lg text-sm ${selectedType === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Income</button><button type="button" onClick={() => setSelectedType('expense')} className={`flex-1 py-2 rounded-lg text-sm ${selectedType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Expense</button></div></div>
                <div><label className="text-sm font-medium mb-1 block">Category</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Select category</option>{(selectedType === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className="text-sm font-medium mb-1 block">Amount (TZS)</label><input type="number" value={categoryAmount} onChange={(e) => setCategoryAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="flex items-end"><button type="button" onClick={addItem} className="w-full bg-blue-600 text-white py-2 rounded-lg"><FiPlus className="inline mr-1" /> Add</button></div>
              </div>
            </div>
            {items.filter(i => i.type === 'income').length > 0 && (
              <div className="mb-6"><h3 className="font-medium mb-2"><FiTrendingUp className="inline text-green-600 mr-1" /> Income Items</h3>
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Category</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-center">Action</th></tr></thead>
                <tbody>{items.filter(i => i.type === 'income').map((item, idx) => (<tr key={idx}><td className="px-4 py-2">{item.category_name}</td><td className="px-4 py-2 text-right"><input type="number" value={item.planned_amount} onChange={(e) => updateItemAmount(idx, parseFloat(e.target.value) || 0)} className="w-32 px-2 py-1 text-right border rounded" /></td><td className="px-4 py-2 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-red-500"><FiTrash2 size={16} /></button></td></tr>))}</tbody></table></div>
              </div>
            )}
            {items.filter(i => i.type === 'expense').length > 0 && (
              <div className="mb-6"><h3 className="font-medium mb-2"><FiTrendingDown className="inline text-red-600 mr-1" /> Expense Items</h3>
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Category</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-center">Action</th></tr></thead>
                <tbody>{items.filter(i => i.type === 'expense').map((item, idx) => (<tr key={idx}><td className="px-4 py-2">{item.category_name}</td><td className="px-4 py-2 text-right"><input type="number" value={item.planned_amount} onChange={(e) => updateItemAmount(idx, parseFloat(e.target.value) || 0)} className="w-32 px-2 py-1 text-right border rounded" /></td><td className="px-4 py-2 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-red-500"><FiTrash2 size={16} /></button></td></tr>))}</tbody></table></div>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between"><span>Total Income:</span><span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span></div>
              <div className="flex justify-between"><span>Total Expenses:</span><span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="font-medium">Planned Profit:</span><span className={`font-bold ${plannedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(plannedProfit)}</span></div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setViewMode('list'); resetForm(); }} className="px-6 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting || items.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    );
  }

  // ========== MODALS ==========
  return (
    <>
      {showDeleteModal && selectedBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Budget</h3>
            <p className="mb-6">Delete <strong>"{selectedBudget.name}"</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white py-2 rounded-lg">{isDeleting ? 'Deleting...' : 'Delete'}</button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showArchiveModal && selectedBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Archive Budget</h3>
            <p className="mb-6">Archive <strong>"{selectedBudget.name}"</strong>?</p>
            <div className="flex gap-3">
              <button onClick={handleArchive} disabled={isArchiving} className="flex-1 bg-amber-600 text-white py-2 rounded-lg">{isArchiving ? 'Archiving...' : 'Archive'}</button>
              <button onClick={() => setShowArchiveModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}