// app/(dashboard)/financials/loans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { financialsApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from 'react-icons/fi';

interface Loan {
  id: number;
  lender_name: string;
  loan_type: string;
  loan_type_display: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  amount_paid: number;
  balance_remaining: number;
  start_date: string;
  next_payment_date: string;
  status: string;
  created_at: string;
}

export default function LoansPage() {
  const { user } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    lender_name: '',
    loan_type: 'bank',
    principal_amount: '',
    interest_rate: '',
    term_months: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: 'active',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

  useEffect(() => {
    fetchLoans();
  }, [currentPage, statusFilter, loanTypeFilter]);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: 20,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (loanTypeFilter) params.loan_type = loanTypeFilter;
      
      const response = await financialsApi.getLoans(params);
      const loansData = response.data.results || response.data;
      setLoans(loansData);
      setTotalPages(Math.ceil((response.data.count || loansData.length) / 20));
      setTotalItems(response.data.count || loansData.length);
      
      // Calculate totals
      let principal = 0;
      let remaining = 0;
      for (let i = 0; i < loansData.length; i++) {
        principal = principal + (parseFloat(loansData[i].principal_amount) || 0);
        remaining = remaining + (parseFloat(loansData[i].balance_remaining) || 0);
      }
      setTotalPrincipal(principal);
      setTotalRemaining(remaining);
      
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-calculate monthly payment if principal, interest, and term are provided
    if (name === 'principal_amount' || name === 'interest_rate' || name === 'term_months') {
      const principal = parseFloat(name === 'principal_amount' ? value : formData.principal_amount);
      const rate = parseFloat(name === 'interest_rate' ? value : formData.interest_rate);
      const months = parseInt(name === 'term_months' ? value : formData.term_months);
      
      if (principal && rate && months && principal > 0 && rate > 0 && months > 0) {
        const monthlyRate = rate / 100 / 12;
        const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        if (isFinite(payment)) {
          setFormData(prev => ({ ...prev, monthly_payment: Math.round(payment).toString() }));
        }
      }
    }
  };

  const openCreateModal = () => {
    setEditingLoan(null);
    setFormData({
      lender_name: '',
      loan_type: 'bank',
      principal_amount: '',
      interest_rate: '',
      term_months: '',
      monthly_payment: '',
      start_date: new Date().toISOString().split('T')[0],
      next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      lender_name: loan.lender_name,
      loan_type: loan.loan_type,
      principal_amount: loan.principal_amount.toString(),
      interest_rate: loan.interest_rate.toString(),
      term_months: loan.term_months.toString(),
      monthly_payment: loan.monthly_payment.toString(),
      start_date: loan.start_date,
      next_payment_date: loan.next_payment_date,
      status: loan.status,
    });
    setShowModal(true);
  };

  const openPaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.monthly_payment);
    setShowPaymentModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lender_name) {
      toast.error('Please enter lender name');
      return;
    }
    
    if (!formData.principal_amount || parseFloat(formData.principal_amount) <= 0) {
      toast.error('Please enter a valid principal amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        lender_name: formData.lender_name,
        loan_type: formData.loan_type,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: parseFloat(formData.interest_rate) || 0,
        term_months: parseInt(formData.term_months) || 0,
        monthly_payment: parseFloat(formData.monthly_payment) || 0,
        start_date: formData.start_date,
        next_payment_date: formData.next_payment_date,
        status: formData.status,
        business: user?.business,
      };

      if (editingLoan) {
        await financialsApi.updateLoan(editingLoan.id, submitData);
        toast.success('Loan updated successfully');
      } else {
        await financialsApi.createLoan(submitData);
        toast.success('Loan created successfully');
      }

      setShowModal(false);
      fetchLoans();
    } catch (error: any) {
      console.error('Failed to save loan:', error);
      toast.error(error.response?.data?.message || 'Failed to save loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedLoan) return;
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (paymentAmount > selectedLoan.balance_remaining) {
      toast.error('Payment amount exceeds remaining balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const newAmountPaid = selectedLoan.amount_paid + paymentAmount;
      const updateData = {
        amount_paid: newAmountPaid,
        status: newAmountPaid >= selectedLoan.principal_amount ? 'completed' : 'active',
      };
      
      await financialsApi.updateLoan(selectedLoan.id, updateData);
      toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded successfully`);
      setShowPaymentModal(false);
      fetchLoans();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (loan: Loan) => {
    setLoanToDelete(loan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!loanToDelete) return;
    
    setIsSubmitting(true);
    try {
      await financialsApi.deleteLoan(loanToDelete.id);
      toast.success(`Loan from ${loanToDelete.lender_name} deleted successfully`);
      setShowDeleteModal(false);
      setLoanToDelete(null);
      fetchLoans();
    } catch (error: any) {
      console.error('Failed to delete loan:', error);
      toast.error(error.response?.data?.message || 'Failed to delete loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return 'TZS 0';
    return `TZS ${value.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      active: { color: 'bg-blue-100 text-blue-700', label: 'Active', icon: FiClock },
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed', icon: FiCheckCircle },
      defaulted: { color: 'bg-red-100 text-red-700', label: 'Defaulted', icon: FiAlertTriangle },
    };
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getLoanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      bank: 'Bank Loan',
      sacco: 'SACCO',
      microfinance: 'Microfinance',
      family: 'Family/Friends',
      other: 'Other',
    };
    return types[type] || type;
  };

  const resetFilters = () => {
    setStatusFilter('');
    setLoanTypeFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter loans by search term
  const filteredLoans = loans.filter(loan =>
    loan.lender_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && loans.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage business loans</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
        >
          <FiPlus size={18} />
          Add Loan
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by lender name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FiFilter size={16} />
            Filters
          </button>
          <button
            onClick={fetchLoans}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
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
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Loan Type</label>
              <select
                value={loanTypeFilter}
                onChange={(e) => setLoanTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All</option>
                <option value="bank">Bank Loan</option>
                <option value="sacco">SACCO</option>
                <option value="microfinance">Microfinance</option>
                <option value="family">Family/Friends</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Loans</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Principal</p>
          <p className="text-2xl font-bold text-brand-600">{formatCurrency(totalPrincipal)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Remaining Balance</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Paid Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPrincipal - totalRemaining)}</p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Payment</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{loan.lender_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getLoanTypeLabel(loan.loan_type)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(loan.principal_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-amber-600">
                      {formatCurrency(loan.balance_remaining)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(loan.monthly_payment)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(loan.next_payment_date)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(loan)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        {loan.status === 'active' && (
                          <button
                            onClick={() => openPaymentModal(loan)}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition"
                            title="Record Payment"
                          >
                            <FiDollarSign size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(loan)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && loanToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" size={20} />
                Confirm Delete
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the loan from <span className="font-semibold">{loanToDelete.lender_name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Lender</p>
                <p className="font-medium text-gray-900">{selectedLoan.lender_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining Balance</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(selectedLoan.balance_remaining)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Payment</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedLoan.monthly_payment)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRecordPayment}
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Record Payment'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingLoan ? 'Edit Loan' : 'Add New Loan'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Hidden business field */}
              <input type="hidden" name="business" value={user?.business} />
              
              {/* Business info display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Business</p>
                <p className="text-sm font-medium text-gray-900">{user?.business_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lender Name *
                </label>
                <input
                  type="text"
                  name="lender_name"
                  value={formData.lender_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CRDB Bank, SACCO, Family"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Type *
                </label>
                <select
                  name="loan_type"
                  value={formData.loan_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="bank">Bank Loan</option>
                  <option value="sacco">SACCO</option>
                  <option value="microfinance">Microfinance</option>
                  <option value="family">Family/Friends</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal Amount (TZS) *
                  </label>
                  <input
                    type="number"
                    name="principal_amount"
                    value={formData.principal_amount}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    placeholder="e.g., 12"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term (Months) *
                  </label>
                  <input
                    type="number"
                    name="term_months"
                    value={formData.term_months}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 12"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Payment (TZS)
                  </label>
                  <input
                    type="number"
                    name="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Payment Date *
                  </label>
                  <input
                    type="date"
                    name="next_payment_date"
                    value={formData.next_payment_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingLoan ? 'Update Loan' : 'Create Loan')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}