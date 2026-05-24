// app/(dashboard)/hr/payroll/page.tsx - COMPLETE WORKING VERSION

'use client';

import { useState, useEffect, useRef } from 'react';
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
  FiCalendar,
  FiCheck,
} from 'react-icons/fi';
import EmployeePaymentHistory from '@/components/hr/EmployeePaymentHistory';

const toNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-' || stringValue === 'N/A' || stringValue === 'NaN' || stringValue === 'null') return 0;
  const cleanedValue = stringValue.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: string | number | undefined | null): string => {
  const num = toNumber(value);
  return `TZS ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return '';
  }
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
  full_name: string;
  email: string;
  job_title: string;
  commission_rate: string;
  is_active: boolean;
  department_name?: string;
  bank_name?: string;
  bank_account_number?: string;
}

interface SalaryStructure {
  id: number;
  employee: number;
  employee_name: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  meal_allowance: number;
  communication_allowance: number;
  risk_allowance: number;
  other_allowance: number;
  total_allowances: number;
  paye_tax: number;
  sdl: number;
  wcf: number;
  pension_contribution: number;
  health_insurance: number;
  loan_deduction: number;
  other_deduction: number;
  total_deductions: number;
  gross_salary: number;
  net_salary: number;
}

interface EmployeePayrollSelection {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  job_title: string;
  base_salary: number;
  allowances: number;
  commission: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  isSelected: boolean;
  bank_name?: string;
  bank_account?: string;
}

interface PayrollItem {
  id: number;
  employee: number;
  employee_name: string;
  employee_number: string;
  base_salary: string | number;
  total_allowances: string | number;
  commission_amount: string | number;
  gross_salary: string | number;
  total_deductions: string | number;
  net_salary: string | number;
  payment_reference: string;
  paid_date: string;
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
  items?: PayrollItem[];
}

interface EmployeePaymentSummary {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  job_title: string;
  department: string;
  monthly_payments: {
    [key: string]: {
      status: 'paid' | 'pending' | 'not_processed';
      amount: number;
      payment_reference?: string;
      paid_date?: string;
      payroll_id?: number;
    }
  };
  total_paid: number;
  total_pending: number;
  last_payment_date?: string;
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            {confirmText}
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ onConfirm: () => void; title: string; message: string } | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<PayrollItem | null>(null);
  const [selectedEmployeeForPayment, setSelectedEmployeeForPayment] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayrollForPayslip, setSelectedPayrollForPayslip] = useState<PayrollItem | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<Employee | null>(null);
  
  const [employeeSelections, setEmployeeSelections] = useState<EmployeePayrollSelection[]>([]);
  const [processData, setProcessData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [paymentData, setPaymentData] = useState({
    payment_reference: '',
    paid_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [filterType, setFilterType] = useState<'month' | 'range'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaid, setTotalPaid] = useState(0);
  const [showEmployeeOverview, setShowEmployeeOverview] = useState(true);
  const [employeePayments, setEmployeePayments] = useState<EmployeePaymentSummary[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const payslipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [currentPage, yearFilter, statusFilter, startDate, endDate, filterType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [payrollsRes, employeesRes, salariesRes] = await Promise.all([
        hrApi.getPayrolls(),
        hrApi.getEmployees(),
        hrApi.getSalaries(),
      ]);
      
      let payrollsData: Payroll[] = [];
      if (payrollsRes.data && typeof payrollsRes.data === 'object') {
        if (Array.isArray(payrollsRes.data.results)) {
          payrollsData = payrollsRes.data.results;
        } else if (Array.isArray(payrollsRes.data)) {
          payrollsData = payrollsRes.data;
        }
      }
      
      const detailedPayrolls: Payroll[] = [];
      for (const payroll of payrollsData) {
        try {
          const detailRes = await hrApi.getPayroll(payroll.id);
          detailedPayrolls.push(detailRes.data);
        } catch (error) {
          detailedPayrolls.push(payroll);
        }
      }
      
      let filteredPayrolls = detailedPayrolls;
      
      if (filterType === 'month') {
        if (yearFilter) {
          filteredPayrolls = filteredPayrolls.filter((p) => p.year === parseInt(yearFilter));
        }
      } else if (filterType === 'range') {
        if (startDate) {
          const start = new Date(startDate);
          filteredPayrolls = filteredPayrolls.filter((p) => {
            const payrollDate = new Date(p.year, p.month - 1, 1);
            return payrollDate >= start;
          });
        }
        if (endDate) {
          const end = new Date(endDate);
          filteredPayrolls = filteredPayrolls.filter((p) => {
            const payrollDate = new Date(p.year, p.month - 1, 1);
            return payrollDate <= end;
          });
        }
      }
      
      if (statusFilter) {
        filteredPayrolls = filteredPayrolls.filter((p) => p.status === statusFilter);
      }
      
      setPayrolls(filteredPayrolls);
      setTotalPages(Math.max(1, Math.ceil(filteredPayrolls.length / 20)));
      
      let paid = 0;
      filteredPayrolls.forEach((p) => {
        if (p.status === 'paid') {
          paid += toNumber(p.total_net_salary);
        }
      });
      setTotalPaid(paid);
      
      let employeesData: Employee[] = [];
      if (employeesRes.data && typeof employeesRes.data === 'object') {
        if (Array.isArray(employeesRes.data.results)) {
          employeesData = employeesRes.data.results;
        } else if (Array.isArray(employeesRes.data)) {
          employeesData = employeesRes.data;
        }
      }
      setEmployees(employeesData);
      
      let salariesData: SalaryStructure[] = [];
      if (salariesRes.data && typeof salariesRes.data === 'object') {
        if (Array.isArray(salariesRes.data.results)) {
          salariesData = salariesRes.data.results;
        } else if (Array.isArray(salariesRes.data)) {
          salariesData = salariesRes.data;
        }
      }
      setSalaries(salariesData);
      
      const monthsSet = new Set<string>();
      filteredPayrolls.forEach(p => {
        monthsSet.add(`${p.year}-${String(p.month).padStart(2, '0')}`);
      });
      const sortedMonths = Array.from(monthsSet).sort();
      setAvailableMonths(sortedMonths);
      
      const paymentMap = new Map<number, EmployeePaymentSummary>();
      employeesData.forEach(emp => {
        paymentMap.set(emp.id, {
          employee_id: emp.id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          employee_number: emp.employee_number,
          job_title: emp.job_title,
          department: emp.department_name || 'N/A',
          monthly_payments: {},
          total_paid: 0,
          total_pending: 0,
        });
      });
      
      filteredPayrolls.forEach(payroll => {
        const monthKey = `${payroll.year}-${String(payroll.month).padStart(2, '0')}`;
        if (payroll.items) {
          payroll.items.forEach(item => {
            const empSummary = paymentMap.get(item.employee);
            if (empSummary) {
              const isPaid = item.payment_reference && item.paid_date;
              const amount = toNumber(item.net_salary);
              empSummary.monthly_payments[monthKey] = {
                status: isPaid ? 'paid' : payroll.status === 'processed' ? 'pending' : 'not_processed',
                amount: amount,
                payment_reference: item.payment_reference,
                paid_date: item.paid_date,
                payroll_id: payroll.id,
              };
              if (isPaid) {
                empSummary.total_paid += amount;
              } else if (payroll.status === 'processed') {
                empSummary.total_pending += amount;
              }
            }
          });
        }
      });
      setEmployeePayments(Array.from(paymentMap.values()));
      
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareEmployeeSelection = () => {
    const activeEmployees = employees.filter(e => e.is_active);
    const employeeSalaryMap = new Map();
    salaries.forEach(salary => {
      employeeSalaryMap.set(salary.employee, salary);
    });
    
    const selections: EmployeePayrollSelection[] = activeEmployees.map(emp => {
      const salary = employeeSalaryMap.get(emp.id);
      const baseSalary = salary?.base_salary || 0;
      const allowances = (salary?.housing_allowance || 0) + (salary?.transport_allowance || 0) + 
                        (salary?.meal_allowance || 0) + (salary?.communication_allowance || 0) + 
                        (salary?.risk_allowance || 0) + (salary?.other_allowance || 0);
      const deductions = (salary?.paye_tax || 0) + (salary?.sdl || 0) + (salary?.wcf || 0) + 
                        (salary?.pension_contribution || 0) + (salary?.health_insurance || 0) + 
                        (salary?.loan_deduction || 0) + (salary?.other_deduction || 0);
      const grossSalary = baseSalary + allowances;
      const netSalary = grossSalary - deductions;
      
      return {
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_number: emp.employee_number,
        job_title: emp.job_title,
        base_salary: baseSalary,
        allowances: allowances,
        commission: 0,
        gross_salary: grossSalary,
        deductions: deductions,
        net_salary: netSalary,
        isSelected: true,
        bank_name: emp.bank_name,
        bank_account: emp.bank_account_number,
      };
    });
    setEmployeeSelections(selections);
  };

  const updateEmployeeSelection = (employeeId: number, isSelected: boolean) => {
    setEmployeeSelections(prev => prev.map(emp => emp.employee_id === employeeId ? { ...emp, isSelected } : emp));
  };

  const selectAllEmployees = () => {
    setEmployeeSelections(prev => prev.map(emp => ({ ...emp, isSelected: true })));
  };

  const deselectAllEmployees = () => {
    setEmployeeSelections(prev => prev.map(emp => ({ ...emp, isSelected: false })));
  };

  const openProcessPayroll = async () => {
    await prepareEmployeeSelection();
    setShowProcessModal(true);
  };

  const processPayroll = async () => {
    const selectedEmployees = employeeSelections.filter(emp => emp.isSelected);
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await hrApi.processPayroll(processData.month, processData.year);
      toast.success(`Payroll for ${getMonthName(processData.month)} ${processData.year} processed for ${selectedEmployees.length} employees`);
      setShowProcessModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to process payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to process payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmMarkAllAsPaid = (payroll: Payroll) => {
    setConfirmAction({
      title: 'Mark All as Paid',
      message: `Are you sure you want to mark all employees in ${getMonthName(payroll.month)} ${payroll.year} as paid?`,
      onConfirm: async () => {
        try {
          await hrApi.markPayrollPaid(payroll.id);
          toast.success('All payments marked as paid');
          fetchData();
          setShowConfirmModal(false);
          setConfirmAction(null);
        } catch (error) {
          console.error('Failed to mark as paid:', error);
          toast.error('Failed to mark as paid');
        }
      }
    });
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    if (!paymentData.payment_reference) {
      toast.error('Please enter a payment reference');
      return;
    }
    setIsSubmitting(true);
    try {
      await hrApi.markPayrollPaid(selectedPayroll!.id);
      toast.success(`Payment confirmed`);
      setShowPaymentConfirmationModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPayrollDetails = async (payroll: Payroll) => {
    try {
      const response = await hrApi.getPayroll(payroll.id);
      setSelectedPayroll(response.data);
      setShowPayrollModal(true);
    } catch (error) {
      setSelectedPayroll(payroll);
      setShowPayrollModal(true);
    }
  };

  const viewPayslip = (employee: Employee, payrollItem: PayrollItem) => {
    setSelectedEmployee(employee);
    setSelectedPayrollForPayslip(payrollItem);
    setShowPayslipModal(true);
  };

  const viewPaymentHistory = (employee: Employee) => {
    setSelectedEmployeeForHistory(employee);
    setShowPaymentHistory(true);
  };

  const getEmployeeById = (employeeId: number): Employee | undefined => {
    return employees.find(e => e.id === employeeId);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft', icon: FiClock },
      processed: { color: 'bg-blue-100 text-blue-700', label: 'Processed', icon: FiCheckCircle },
      paid: { color: 'bg-green-100 text-green-700', label: 'Paid', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled', icon: FiAlertTriangle },
    };
    const c = config[status] || config.draft;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${c.color}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <FiCheckCircle size={14} />;
      case 'pending': return <FiClock size={14} />;
      default: return <FiAlertTriangle size={14} />;
    }
  };

  const resetFilters = () => {
    setYearFilter(new Date().getFullYear().toString());
    setStatusFilter('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setFilterType('month');
    setCurrentPage(1);
  };

  const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredPayrolls = payrolls.filter(payroll =>
    getMonthName(payroll.month).toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.year.toString().includes(searchTerm)
  );

  const paginatedPayrolls = filteredPayrolls.slice((currentPage - 1) * 20, currentPage * 20);

  const selectedCount = employeeSelections.filter(emp => emp.isSelected).length;
  const totalNetPay = employeeSelections.filter(emp => emp.isSelected).reduce((sum, emp) => sum + emp.net_salary, 0);

  const filteredEmployees = employeePayments.filter(emp =>
    emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && payrolls.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
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
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1">Process, manage and confirm employee salary payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmployeeOverview(!showEmployeeOverview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            {showEmployeeOverview ? <FiEye size={16} /> : <FiUsers size={16} />}
            {showEmployeeOverview ? 'Hide Overview' : 'Show Overview'}
          </button>
          <button
            onClick={openProcessPayroll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus size={18} />
            Process Payroll
          </button>
        </div>
      </div>

      {/* Employee Payment Overview Table */}
      {showEmployeeOverview && availableMonths.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Employee Payment Overview</h2>
            <div className="text-sm text-gray-500">
              {filteredEmployees.length} employees • {availableMonths.length} months
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
                    {availableMonths.map(month => (
                      <th key={month} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                        {getMonthName(parseInt(month.split('-')[1]))} {month.split('-')[0]}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.slice(0, 50).map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 sticky left-0 bg-white border-r">
                        <p className="font-medium text-gray-900">{emp.employee_name}</p>
                        <p className="text-xs text-gray-500">{emp.employee_number}</p>
                        <p className="text-xs text-gray-400">{emp.job_title}</p>
                      </td>
                      {availableMonths.map(month => {
                        const payment = emp.monthly_payments[month];
                        return (
                          <td key={month} className="px-3 py-3 text-center">
                            {payment ? (
                              <div className="flex flex-col items-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(payment.status)}`}>
                                  {getPaymentStatusIcon(payment.status)}
                                  {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Not Processed'}
                                </span>
                                {payment.status === 'paid' && (
                                  <span className="text-xs text-gray-500 mt-1">{formatCurrency(payment.amount)}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(emp.total_paid)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">{formatCurrency(emp.total_pending)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => viewPaymentHistory({
                            id: emp.employee_id,
                            employee_number: emp.employee_number,
                            first_name: emp.employee_name.split(' ')[0],
                            last_name: emp.employee_name.split(' ').slice(1).join(' '),
                            full_name: emp.employee_name,
                            email: '',
                            job_title: emp.job_title,
                            commission_rate: '0',
                            is_active: true,
                            department_name: emp.department,
                          } as Employee)}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                    {availableMonths.map(month => {
                      const monthTotal = employeePayments.reduce((sum, emp) => {
                        const payment = emp.monthly_payments[month];
                        return sum + (payment?.status === 'paid' ? payment.amount : 0);
                      }, 0);
                      return (
                        <td key={month} className="px-3 py-3 text-center font-medium text-green-600">
                          {formatCurrency(monthTotal)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(employeePayments.reduce((sum, emp) => sum + emp.total_paid, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {formatCurrency(employeePayments.reduce((sum, emp) => sum + emp.total_pending, 0))}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
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
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg border border-gray-200">
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600">Reset All</button>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Filter By</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFilterType('month')}
                className={`px-4 py-2 rounded-lg border transition ${filterType === 'month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <FiCalendar size={16} className="inline mr-2" /> Month / Year
              </button>
              <button
                onClick={() => setFilterType('range')}
                className={`px-4 py-2 rounded-lg border transition ${filterType === 'range' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <FiCalendar size={16} className="inline mr-2" /> Date Range
              </button>
            </div>
          </div>
          {filterType === 'month' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Year</label>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">All Years</option>
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          )}
          {filterType === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          )}
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
          <p className="text-2xl font-bold text-blue-600">{employees.filter(e => e.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(payrolls.find(p => p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear())?.total_net_salary)}
          </p>
        </div>
      </div>

      {/* Payroll History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Payroll History</h3>
        </div>
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
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payroll records found</td></tr>
              ) : (
                paginatedPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{getMonthName(payroll.month)} {payroll.year}</p>
                      <p className="text-xs text-gray-400">{formatDate(payroll.processed_date)}</p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{formatCurrency(payroll.total_base_salary)}</td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">{formatCurrency(payroll.total_commission)}</td>
                    <td className="px-6 py-4 text-right text-sm text-red-600">{formatCurrency(payroll.total_deductions)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{formatCurrency(payroll.total_net_salary)}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(payroll.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => viewPayrollDetails(payroll)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="View Details">
                          <FiEye size={16} />
                        </button>
                        {payroll.status === 'processed' && (
                          <button onClick={() => confirmMarkAllAsPaid(payroll)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50" title="Mark All as Paid">
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Process Payroll</h3>
              <button onClick={() => setShowProcessModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Month/Year Selection */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select value={processData.month} onChange={(e) => setProcessData({ ...processData, month: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg">
                    {months.map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select value={processData.year} onChange={(e) => setProcessData({ ...processData, year: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">Select Employees to Pay</h4>
                  <div className="flex gap-2">
                    <button onClick={selectAllEmployees} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"><FiCheck size={14} /> Select All</button>
                    <button onClick={deselectAllEmployees} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><FiX size={14} /> Deselect All</button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Selected Employees:</span><span className="font-semibold text-blue-600">{selectedCount} / {employeeSelections.length}</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Total Net Pay:</span><span className="font-semibold text-green-600">{formatCurrency(totalNetPay)}</span></div>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left w-12"><input type="checkbox" checked={selectedCount === employeeSelections.length && employeeSelections.length > 0} onChange={(e) => e.target.checked ? selectAllEmployees() : deselectAllEmployees()} className="w-4 h-4 text-blue-600 rounded" /></th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employeeSelections.map((emp) => (
                        <tr key={emp.employee_id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2"><input type="checkbox" checked={emp.isSelected} onChange={(e) => updateEmployeeSelection(emp.employee_id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /></td>
                          <td className="px-4 py-2"><p className="font-medium text-gray-900">{emp.employee_name}</p><p className="text-xs text-gray-500">{emp.employee_number}</p></td>
                          <td className="px-4 py-2 text-sm text-gray-600">{emp.job_title || '-'}</td>
                          <td className="px-4 py-2 text-right text-sm">{formatCurrency(emp.base_salary)}</td>
                          <td className="px-4 py-2 text-right text-sm text-green-600">{formatCurrency(emp.allowances)}</td>
                          <td className="px-4 py-2 text-right text-sm text-red-600">{formatCurrency(emp.deductions)}</td>
                          <td className="px-4 py-2 text-right font-bold text-blue-600">{formatCurrency(emp.net_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 sticky bottom-0">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 font-bold text-gray-900">Total</td>
                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(employeeSelections.reduce((s, e) => s + (e.isSelected ? e.base_salary : 0), 0))}</td>
                        <td className="px-4 py-2 text-right font-bold text-green-600">{formatCurrency(employeeSelections.reduce((s, e) => s + (e.isSelected ? e.allowances : 0), 0))}</td>
                        <td className="px-4 py-2 text-right font-bold text-red-600">{formatCurrency(employeeSelections.reduce((s, e) => s + (e.isSelected ? e.deductions : 0), 0))}</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-600">{formatCurrency(totalNetPay)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p>ℹ️ Only selected employees will be included in this payroll run.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={processPayroll} disabled={isSubmitting || selectedCount === 0} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : `Process Payroll for ${selectedCount} Employee${selectedCount !== 1 ? 's' : ''}`}
                </button>
                <button onClick={() => setShowProcessModal(false)} className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Details Modal */}
      {showPayrollModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payroll Details - {getMonthName(selectedPayroll.month)} {selectedPayroll.year}</h3>
              <button onClick={() => setShowPayrollModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Employees</p><p className="text-xl font-bold">{selectedPayroll.items?.length || 0}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Base Salary</p><p className="text-xl font-bold">{formatCurrency(selectedPayroll.total_base_salary)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Allowances</p><p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayroll.total_allowances)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Commission</p><p className="text-xl font-bold text-green-600">{formatCurrency(selectedPayroll.total_commission)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Net Pay</p><p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayroll.total_net_salary)}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-right">Base Salary</th><th className="px-4 py-3 text-right">Allowances</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Deductions</th><th className="px-4 py-3 text-right">Net Pay</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
                  <tbody>
                    {selectedPayroll.items?.map((item) => {
                      const employee = getEmployeeById(item.employee);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><p className="font-medium">{item.employee_name}</p><p className="text-xs text-gray-500">{item.employee_number}</p></td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.base_salary)}</td>
                          <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(item.total_allowances)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(item.commission_amount)}</td>
                          <td className="px-4 py-3 text-right text-red-600">{formatCurrency(item.total_deductions)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(item.net_salary)}</td>
                          <td className="px-4 py-3 text-center">{employee && <div className="flex gap-2 justify-center"><button onClick={() => viewPayslip(employee, item)} className="text-blue-600 text-sm">Payslip</button><button onClick={() => viewPaymentHistory(employee)} className="text-purple-600 text-sm">History</button></div>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowPayrollModal(false)} className="w-full border py-2 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedEmployee && selectedPayrollForPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payslip</h3>
              <button onClick={() => setShowPayslipModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b"><h2 className="text-xl font-bold text-blue-900">PAYSLIP</h2><p className="text-gray-500 text-sm">{selectedEmployee.employee_number}</p></div>
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between"><span className="text-sm text-gray-500">Employee Name</span><span className="text-sm font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Job Title</span><span className="text-sm">{selectedEmployee.job_title || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">Payment Ref</span><span className="text-sm font-mono">{selectedPayrollForPayslip.payment_reference || '-'}</span></div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <p className="font-medium text-gray-900">Earnings</p>
                <div className="flex justify-between text-sm"><span>Base Salary</span><span>{formatCurrency(selectedPayrollForPayslip.base_salary)}</span></div>
                <div className="flex justify-between text-sm"><span>Allowances</span><span>{formatCurrency(selectedPayrollForPayslip.total_allowances)}</span></div>
                <div className="flex justify-between text-sm"><span>Commission</span><span className="text-green-600">{formatCurrency(selectedPayrollForPayslip.commission_amount)}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t"><span>Gross Salary</span><span>{formatCurrency(selectedPayrollForPayslip.gross_salary)}</span></div>
              </div>
              <div className="bg-red-50 rounded-lg p-3"><div className="flex justify-between"><span className="text-sm font-medium">Total Deductions</span><span className="text-red-600">{formatCurrency(selectedPayrollForPayslip.total_deductions)}</span></div></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-sm text-gray-600">Net Pay</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayrollForPayslip.net_salary)}</p></div>
              <div className="flex gap-3 pt-2"><button onClick={() => window.print()} className="flex-1 border py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50"><FiPrinter size={16} /> Print</button><button onClick={() => setShowPayslipModal(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Close</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmationModal && selectedEmployeeForPayment && selectedPayrollItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Confirm Payment</h3>
              <button onClick={() => setShowPaymentConfirmationModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 rounded-lg p-3"><p className="text-sm text-gray-600">Employee</p><p className="font-semibold">{selectedEmployeeForPayment.first_name} {selectedEmployeeForPayment.last_name}</p><p className="text-xs text-gray-500">#{selectedEmployeeForPayment.employee_number}</p></div>
              <div className="bg-blue-50 rounded-lg p-3"><p className="text-sm text-gray-600">Amount to Pay</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(toNumber(selectedPayrollItem.net_salary))}</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference *</label><input type="text" value={paymentData.payment_reference} onChange={(e) => setPaymentData({...paymentData, payment_reference: e.target.value})} placeholder="e.g., BANK-TRANSFER-001" className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label><input type="date" value={paymentData.paid_date} onChange={(e) => setPaymentData({...paymentData, paid_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-3 pt-4"><button onClick={confirmPayment} disabled={isSubmitting || !paymentData.payment_reference} className="flex-1 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50">Confirm Payment</button><button onClick={() => setShowPaymentConfirmationModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedEmployeeForHistory && (
        <EmployeePaymentHistory isOpen={showPaymentHistory} onClose={() => { setShowPaymentHistory(false); setSelectedEmployeeForHistory(null); }} employee={selectedEmployeeForHistory} />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => { setShowConfirmModal(false); setConfirmAction(null); }} onConfirm={() => confirmAction?.onConfirm()} title={confirmAction?.title || ''} message={confirmAction?.message || ''} />
    </div>
  );
}