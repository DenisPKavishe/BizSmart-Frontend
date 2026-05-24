// app/(dashboard)/hr/components/EmployeePaymentHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import { hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle, FiClock, FiAlertCircle, FiDownload, FiPrinter, FiCalendar } from 'react-icons/fi';

interface PaymentRecord {
  id: number;
  month: number;
  year: number;
  month_name: string;
  base_salary: number;
  allowances: number;
  commission: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  payment_reference: string;
  paid_date: string;
  status: 'paid' | 'pending' | 'draft';
  payroll_id: number;
}

interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  department_name?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const formatCurrency = (value: number) => {
  return `TZS ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

export default function EmployeePaymentHistory({ isOpen, onClose, employee }: Props) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPending: 0,
    averageSalary: 0,
    paidMonths: 0,
  });

  useEffect(() => {
    if (isOpen && employee) {
      fetchPaymentHistory();
    }
  }, [isOpen, employee, selectedYear]);

  const fetchPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const payrollsRes = await hrApi.getPayrolls();
      let payrollsData = [];
      if (payrollsRes.data && typeof payrollsRes.data === 'object') {
        if (Array.isArray(payrollsRes.data.results)) {
          payrollsData = payrollsRes.data.results;
        } else if (Array.isArray(payrollsRes.data)) {
          payrollsData = payrollsRes.data;
        }
      }

      const filteredPayrolls = selectedYear 
        ? payrollsData.filter((p: any) => p.year === selectedYear)
        : payrollsData;

      const payments: PaymentRecord[] = [];
      
      for (const payroll of filteredPayrolls) {
        try {
          const payrollDetailRes = await hrApi.getPayroll(payroll.id);
          const payrollDetail = payrollDetailRes.data;
          
          if (payrollDetail.items && payrollDetail.items.length > 0) {
            const employeePayment = payrollDetail.items.find(
              (item: any) => item.employee === employee?.id || item.employee_number === employee?.employee_number
            );
            
            if (employeePayment) {
              payments.push({
                id: employeePayment.id,
                month: payroll.month,
                year: payroll.year,
                month_name: getMonthName(payroll.month),
                base_salary: parseFloat(employeePayment.base_salary) || 0,
                allowances: parseFloat(employeePayment.total_allowances) || 0,
                commission: parseFloat(employeePayment.commission_amount) || 0,
                gross_salary: parseFloat(employeePayment.gross_salary) || 0,
                deductions: parseFloat(employeePayment.total_deductions) || 0,
                net_salary: parseFloat(employeePayment.net_salary) || 0,
                payment_reference: employeePayment.payment_reference,
                paid_date: employeePayment.paid_date,
                status: employeePayment.payment_reference && employeePayment.paid_date ? 'paid' : 
                        payroll.status === 'processed' ? 'pending' : 'draft',
                payroll_id: payroll.id,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch payroll ${payroll.id}:`, error);
        }
      }

      payments.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setPaymentHistory(payments);

      const paidPayments = payments.filter(p => p.status === 'paid');
      const totalPaid = paidPayments.reduce((sum, p) => sum + p.net_salary, 0);
      const totalPending = payments.filter(p => p.status === 'pending').length;
      
      setSummary({
        totalPaid: totalPaid,
        totalPending: totalPending,
        averageSalary: paidPayments.length > 0 ? totalPaid / paidPayments.length : 0,
        paidMonths: paidPayments.length,
      });

    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
            <FiCheckCircle size={12} />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            <FiClock size={12} />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            <FiAlertCircle size={12} />
            Not Processed
          </span>
        );
    }
  };

  const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Payment History
            </h3>
            {employee && (
              <p className="text-sm text-gray-500 mt-1">
                {employee.first_name} {employee.last_name} - {employee.employee_number}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Summary Card */}
          {employee && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Employee Details</p>
                  <h2 className="text-2xl font-bold mt-1">{employee.first_name} {employee.last_name}</h2>
                  <p className="text-blue-100 mt-1">#{employee.employee_number}</p>
                  <p className="text-blue-100 text-sm mt-2">{employee.job_title}</p>
                  {employee.department_name && (
                    <p className="text-blue-100 text-sm">{employee.department_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Total Paid to Date</p>
                  <p className="text-3xl font-bold">{formatCurrency(summary.totalPaid)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Months Paid</p>
              <p className="text-2xl font-bold text-green-600">{summary.paidMonths}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.totalPending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Average Monthly Salary</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.averageSalary)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Year Filter</p>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      <div className="animate-pulse">Loading payment history...</div>
                    </td>
                  </tr>
                ) : paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No payment records found for this employee
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((payment) => (
                    <tr key={`${payment.year}-${payment.month}`} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{payment.month_name} {payment.year}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(payment.base_salary)}</td>
                      <td className="px-4 py-3 text-right text-sm text-blue-600">{formatCurrency(payment.allowances)}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(payment.commission)}</td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(payment.deductions)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-blue-600">{formatCurrency(payment.net_salary)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(payment.status)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500">{payment.payment_reference || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(payment.paid_date) || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {!isLoading && paymentHistory.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200 sticky bottom-0">
                  <tr>
                    <td className="px-4 py-3 font-bold text-gray-900">Totals</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.base_salary, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.allowances, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.commission, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.deductions, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.net_salary, 0))}
                    </td>
                    <td colSpan={3} className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Status Legend:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Paid - Payment has been processed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Pending - Payroll processed but payment pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                <span className="text-sm text-gray-600">Not Processed - Employee not included in payroll</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => window.print()}
              className="flex-1 border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
            >
              <FiPrinter size={16} /> Print History
            </button>
            <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}