// app/(dashboard)/hr/payroll/components/PayrollPreviewTable.tsx
'use client';

import { useState } from 'react';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';

export interface PayrollPreviewItem {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  base_salary: number;
  allowances: number;
  commission: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  adjustment?: {
    bonus: number;
    penalty: number;
    notes: string;
  };
}

interface Props {
  data: PayrollPreviewItem[];
  onUpdateAdjustment: (employeeId: number, adjustment: any) => void;
  readOnly?: boolean;
}

export default function PayrollPreviewTable({ data, onUpdateAdjustment, readOnly = false }: Props) {
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<{[key: number]: any}>({});

  const formatCurrency = (value: number) => {
    return `TZS ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const startEditing = (employeeId: number, currentAdjustment?: any) => {
    setEditingEmployee(employeeId);
    setAdjustmentData({
      [employeeId]: currentAdjustment || { bonus: 0, penalty: 0, notes: '' }
    });
  };

  const saveAdjustment = (employeeId: number) => {
    const adjustment = adjustmentData[employeeId];
    onUpdateAdjustment(employeeId, adjustment);
    setEditingEmployee(null);
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setAdjustmentData({});
  };

  const totalBaseSalary = data.reduce((sum, item) => sum + item.base_salary, 0);
  const totalAllowances = data.reduce((sum, item) => sum + item.allowances, 0);
  const totalCommission = data.reduce((sum, item) => sum + item.commission, 0);
  const totalGross = data.reduce((sum, item) => sum + item.gross_salary, 0);
  const totalDeductions = data.reduce((sum, item) => sum + item.deductions, 0);
  const totalNet = data.reduce((sum, item) => sum + item.net_salary, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
            {!readOnly && (
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Adjustments</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => {
            const netWithAdjustment = item.net_salary + (item.adjustment?.bonus || 0) - (item.adjustment?.penalty || 0);
            const isEditing = editingEmployee === item.employee_id;
            
            return (
              <tr key={item.employee_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.employee_name}</p>
                  <p className="text-xs text-gray-500">{item.employee_number}</p>
                </td>
                <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.base_salary)}</td>
                <td className="px-4 py-3 text-right text-sm text-blue-600">{formatCurrency(item.allowances)}</td>
                <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(item.commission)}</td>
                <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(item.gross_salary)}</td>
                <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(item.deductions)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${netWithAdjustment !== item.net_salary ? 'text-purple-600' : 'text-green-600'}`}>
                    {formatCurrency(netWithAdjustment)}
                  </span>
                  {netWithAdjustment !== item.net_salary && (
                    <div className="text-xs text-gray-400 mt-1">
                      (Adjusted: {formatCurrency(item.net_salary)})
                    </div>
                  )}
                </td>
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Bonus (+)"
                          value={adjustmentData[item.employee_id]?.bonus || ''}
                          onChange={(e) => setAdjustmentData({
                            ...adjustmentData,
                            [item.employee_id]: {
                              ...adjustmentData[item.employee_id],
                              bonus: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="number"
                          placeholder="Penalty (-)"
                          value={adjustmentData[item.employee_id]?.penalty || ''}
                          onChange={(e) => setAdjustmentData({
                            ...adjustmentData,
                            [item.employee_id]: {
                              ...adjustmentData[item.employee_id],
                              penalty: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Notes"
                          value={adjustmentData[item.employee_id]?.notes || ''}
                          onChange={(e) => setAdjustmentData({
                            ...adjustmentData,
                            [item.employee_id]: {
                              ...adjustmentData[item.employee_id],
                              notes: e.target.value
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                        />
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => saveAdjustment(item.employee_id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <FiSave size={14} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(item.employee_id, item.adjustment)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Add Adjustment"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200 sticky bottom-0">
          <tr>
            <td className="px-4 py-3 font-bold text-gray-900">Total</td>
            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalBaseSalary)}</td>
            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalAllowances)}</td>
            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalCommission)}</td>
            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalGross)}</td>
            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalDeductions)}</td>
            <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(totalNet)}</td>
            {!readOnly && <td className="px-4 py-3"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}