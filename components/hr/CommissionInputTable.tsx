// app/(dashboard)/hr/payroll/components/CommissionInputTable.tsx
'use client';

import { useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiInfo } from 'react-icons/fi';

interface Employee {
  id: number;
  full_name: string;
  employee_number: string;
  commission_rate: number;
  base_salary: number;
}

interface CommissionInput {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  commission_rate: number;
  monthly_sales: number;
  calculated_commission: number;
}

interface Props {
  employees: Employee[];
  onDataChange: (data: CommissionInput[]) => void;
  initialData?: CommissionInput[];
}

export default function CommissionInputTable({ employees, onDataChange, initialData }: Props) {
  const [salesData, setSalesData] = useState<CommissionInput[]>(() => {
    if (initialData) return initialData;
    
    return employees.map(emp => ({
      employee_id: emp.id,
      employee_name: emp.full_name,
      employee_number: emp.employee_number,
      commission_rate: emp.commission_rate,
      monthly_sales: 0,
      calculated_commission: 0,
    }));
  });

  const updateSales = (employeeId: number, sales: number) => {
    const updated = salesData.map(item => {
      if (item.employee_id === employeeId) {
        const calculatedCommission = (sales * item.commission_rate) / 100;
        return {
          ...item,
          monthly_sales: sales,
          calculated_commission: calculatedCommission,
        };
      }
      return item;
    });
    setSalesData(updated);
    onDataChange(updated);
  };

  const formatCurrency = (value: number) => {
    return `TZS ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const totalCommission = salesData.reduce((sum, item) => sum + item.calculated_commission, 0);
  const totalSales = salesData.reduce((sum, item) => sum + item.monthly_sales, 0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiInfo className="text-blue-500 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-blue-800 font-medium">Commission Calculation</p>
            <p className="text-xs text-blue-600 mt-1">
              Commission = Monthly Sales × (Commission Rate ÷ 100)
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly Sales (TZS)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {salesData.map((item) => (
              <tr key={item.employee_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.employee_name}</p>
                  <p className="text-xs text-gray-500">{item.employee_number}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <FiTrendingUp size={12} />
                    {item.commission_rate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={item.monthly_sales || ''}
                    onChange={(e) => updateSales(item.employee_id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-40 px-3 py-1 text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-green-600">
                    {formatCurrency(item.calculated_commission)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900" colSpan={2}>Totals</td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {formatCurrency(totalSales)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-600">
                {formatCurrency(totalCommission)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}