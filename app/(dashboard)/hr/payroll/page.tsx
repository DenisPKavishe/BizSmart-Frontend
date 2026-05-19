// app/(dashboard)/hr/payroll/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiDollarSign,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiUsers,
  FiPrinter,
} from 'react-icons/fi';

// Helper functions
const toNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: string | number | undefined | null): string => {
  const num = toNumber(value);
  return `TZS ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const getMonthName = (month: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  commission_rate: number;
  is_active: boolean;
}


interface PayrollItem {
    id: number;
    employee: number;
    employee_name: string;
    employee_number: string;
    base_salary: string | number;  // API returns string
    total_allowances: string | number;
    commission_amount: string | number;
    gross_salary: string | number;
    total_deductions: string | number;
    net_salary: string | number;
    total_sales_for_month: string | number;
    total_transactions: number;
    payment_reference: string;
    paid_date: string;
    created_at: string;
    updated_at: string;
    payroll: number;
    salary: number;
    paid_by: number;
  }
  
  interface Payroll {
    id: number;
    month: number;
    year: number;
    business_name?: string;
    status_display?: string;
    processed_date: string;
    status: 'draft' | 'processed' | 'paid' | 'cancelled';
    total_base_salary: string | number;
    total_allowances: string | number;
    total_commission: string | number;
    total_deductions: string | number;
    total_net_salary: string | number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    business?: number;
    processed_by?: number;
    transaction?: number;
    items?: PayrollItem[];
  }


export default function PayrollPage() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(null);
  
  // Form state for processing payroll
  const [processData, setProcessData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    include_commission: true,
  });

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage, yearFilter, statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [payrollsRes, employeesRes] = await Promise.all([
        hrApi.getPayrolls(),
        hrApi.getEmployees(),
      ]);
      
      // Handle paginated response
      let payrollsData: Payroll[] = [];
      if (payrollsRes.data && typeof payrollsRes.data === 'object') {
        if (Array.isArray(payrollsRes.data.results)) {
          payrollsData = payrollsRes.data.results;
          setTotalItems(payrollsRes.data.count || payrollsData.length);
        } else if (Array.isArray(payrollsRes.data)) {
          payrollsData = payrollsRes.data;
          setTotalItems(payrollsData.length);
        }
      }
      
      // Filter by year
      if (yearFilter && payrollsData.length > 0) {
        payrollsData = payrollsData.filter((p: Payroll) => p.year === parseInt(yearFilter));
      }
      if (statusFilter && payrollsData.length > 0) {
        payrollsData = payrollsData.filter((p: Payroll) => p.status === statusFilter);
      }
      
      setPayrolls(payrollsData);
      setTotalPages(Math.max(1, Math.ceil(payrollsData.length / 20)));
      
      // Calculate total paid safely
      let paid = 0;
      for (let i = 0; i < payrollsData.length; i++) {
        if (payrollsData[i].status === 'paid') {
          paid += toNumber(payrollsData[i].total_net_salary);
        }
      }
      setTotalPaid(paid);
      
      // Handle employees data
      let employeesData: Employee[] = [];
      if (employeesRes.data && typeof employeesRes.data === 'object') {
        if (Array.isArray(employeesRes.data.results)) {
          employeesData = employeesRes.data.results;
        } else if (Array.isArray(employeesRes.data)) {
          employeesData = employeesRes.data;
        }
      }
      setEmployees(employeesData);
      
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setIsLoading(false);
    }
  };

  const processPayroll = async () => {
    setIsSubmitting(true);
    try {
      await hrApi.processPayroll(
        processData.month,
        processData.year,
        processData.include_commission
      );
      toast.success(`Payroll for ${getMonthName(processData.month)} ${processData.year} processed successfully`);
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to process payroll:', error);
      toast.error(error.response?.data?.error || 'Failed to process payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsPaid = async (payroll: Payroll) => {
    if (confirm(`Mark payroll for ${getMonthName(payroll.month)} ${payroll.year} as paid?`)) {
      try {
        await hrApi.markPayrollPaid(payroll.id);
        toast.success('Payroll marked as paid');
        fetchData();
      } catch (error) {
        console.error('Failed to mark payroll as paid:', error);
        toast.error('Failed to mark payroll as paid');
      }
    }
  };

  const viewPayrollDetails = async (payroll: Payroll) => {
    try {
      // Fetch fresh payroll data with items
      const response = await hrApi.getPayrolls();
      let allPayrolls: Payroll[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.results)) {
          allPayrolls = response.data.results;
        } else if (Array.isArray(response.data)) {
          allPayrolls = response.data;
        }
      }
      
      const detailedPayroll = allPayrolls.find((p: Payroll) => p.id === payroll.id);
      setSelectedPayroll(detailedPayroll || payroll);
      setShowPayrollModal(true);
    } catch (error) {
      console.error('Failed to fetch payroll details:', error);
      toast.error('Failed to load payroll details');
    }
  };

  const viewPayslip = (employee: Employee, payrollItem: PayrollItem) => {
    setSelectedEmployee(employee);
    setSelectedPayrollItem(payrollItem);
    setShowPayslipModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft', icon: FiClock },
      processed: { color: 'bg-blue-100 text-blue-700', label: 'Processed', icon: FiCheckCircle },
      paid: { color: 'bg-green-100 text-green-700', label: 'Paid', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled', icon: FiAlertTriangle },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const resetFilters = () => {
    setYearFilter(new Date().getFullYear().toString());
    setStatusFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Available years for filtering
  const availableYears = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  // Filter payrolls by search term
  const filteredPayrolls = payrolls.filter(payroll =>
    getMonthName(payroll.month).toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.year.toString().includes(searchTerm)
  );

  // Paginated payrolls
  const paginatedPayrolls = filteredPayrolls.slice(
    (currentPage - 1) * 20,
    currentPage * 20
  );

  if (isLoading && payrolls.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Process and manage employee salaries</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Process Payroll
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by month or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            onClick={fetchData}
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
              <label className="block text-sm text-gray-600 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Payrolls</p>
          <p className="text-2xl font-bold text-gray-900">{filteredPayrolls.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Active Employees</p>
          <p className="text-2xl font-bold text-blue-600">
            {employees.filter(e => e.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(payrolls.find(p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear())?.total_net_salary)}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payroll records found
                  </td>
                </tr>
              ) : (
                paginatedPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{getMonthName(payroll.month)} {payroll.year}</p>
                      <p className="text-xs text-gray-400">{formatDate(payroll.processed_date)}</p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(payroll.total_base_salary)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {formatCurrency(payroll.total_commission)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-red-600">
                      {formatCurrency(payroll.total_deductions)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                      {formatCurrency(payroll.total_net_salary)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewPayrollDetails(payroll)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        {payroll.status === 'processed' && (
                          <button
                            onClick={() => markAsPaid(payroll)}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition"
                            title="Mark as Paid"
                          >
                            <FiDollarSign size={16} />
                          </button>
                        )}
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

      {/* Process Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Process Payroll</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={processData.month}
                  onChange={(e) => setProcessData({ ...processData, month: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={processData.year}
                  onChange={(e) => setProcessData({ ...processData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include_commission"
                  checked={processData.include_commission}
                  onChange={(e) => setProcessData({ ...processData, include_commission: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                />
                <label htmlFor="include_commission" className="text-sm text-gray-700">
                  Include commission from sales
                </label>
              </div>

              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">
                <p>⚠️ This will calculate salaries for all active employees based on their salary structure.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={processPayroll}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Process Payroll'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Details Modal */}
      {showPayrollModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Payroll Details - {getMonthName(selectedPayroll.month)} {selectedPayroll.year}
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Employees</p>
                  <p className="text-xl font-bold text-gray-900">{selectedPayroll.items?.length || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Base Salary</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedPayroll.total_base_salary)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Allowances</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayroll.total_allowances)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPayroll.total_commission)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Net Pay</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayroll.total_net_salary)}</p>
                </div>
              </div>

              {/* Status Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="ml-2">{getStatusBadge(selectedPayroll.status)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Processed:</span>
                  <span className="ml-2 text-sm">{formatDate(selectedPayroll.processed_date)}</span>
                </div>
                {selectedPayroll.notes && (
                  <div>
                    <span className="text-sm text-gray-500">Notes:</span>
                    <span className="ml-2 text-sm">{selectedPayroll.notes}</span>
                  </div>
                )}
              </div>

              {/* Employees Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPayroll.items && selectedPayroll.items.length > 0 ? (
                      selectedPayroll.items.map((item) => {
                        const employee = employees.find(e => e.id === item.employee);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{item.employee_name}</p>
                              <p className="text-xs text-gray-500">{item.employee_number}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.base_salary)}</td>
                            <td className="px-4 py-3 text-right text-sm text-blue-600">{formatCurrency(item.total_allowances)}</td>
                            <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(item.commission_amount)}</td>
                            <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(item.total_deductions)}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.gross_salary)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">{formatCurrency(item.net_salary)}</td>
                            <td className="px-4 py-3 text-center">
                              {employee && (
                                <button
                                  onClick={() => viewPayslip(employee, item)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  Payslip
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No employee details available for this payroll
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {selectedPayroll.items && selectedPayroll.items.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedPayroll.total_base_salary)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedPayroll.total_allowances)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedPayroll.total_commission)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedPayroll.total_deductions)}</td>
                        <td className="px-4 py-3 text-right font-medium">-</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(selectedPayroll.total_net_salary)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedPayroll.status === 'processed' && (
                  <button
                    onClick={() => markAsPaid(selectedPayroll)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedEmployee && selectedPayrollItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payslip</h3>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-blue-900">PAYSLIP</h2>
                <p className="text-gray-500 text-sm">{selectedEmployee.employee_number}</p>
              </div>

              {/* Employee Info */}
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Employee Name</span>
                  <span className="text-sm font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Job Title</span>
                  <span className="text-sm">{selectedEmployee.job_title || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Period</span>
                  <span className="text-sm">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Payment Ref</span>
                  <span className="text-sm font-mono">{selectedPayrollItem.payment_reference || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Paid Date</span>
                  <span className="text-sm">{formatDate(selectedPayrollItem.paid_date)}</span>
                </div>
              </div>

              {/* Earnings */}
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <p className="font-medium text-gray-900">Earnings</p>
                <div className="flex justify-between text-sm">
                  <span>Base Salary</span>
                  <span>{formatCurrency(selectedPayrollItem.base_salary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Allowances</span>
                  <span>{formatCurrency(selectedPayrollItem.total_allowances)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Commission</span>
                  <span className="text-green-600">{formatCurrency(selectedPayrollItem.commission_amount)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-green-200">
                  <span>Gross Salary</span>
                  <span>{formatCurrency(selectedPayrollItem.gross_salary)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 rounded-lg p-3 space-y-2">
                <p className="font-medium text-gray-900">Deductions</p>
                <div className="flex justify-between text-sm">
                  <span>Total Deductions</span>
                  <span className="text-red-600">{formatCurrency(selectedPayrollItem.total_deductions)}</span>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Net Pay</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayrollItem.net_salary)}</p>
              </div>

              {/* Performance */}
              <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>Sales this month: {formatCurrency(selectedPayrollItem.total_sales_for_month)}</p>
                <p>Transactions: {selectedPayrollItem.total_transactions}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <FiPrinter size={16} />
                  Print Payslip
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}