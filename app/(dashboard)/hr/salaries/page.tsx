// app/(dashboard)/hr/salaries/page.tsx - CORRECTED

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiEye,
  FiHome,
  FiFileText,
} from 'react-icons/fi';
import { FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import DeleteConfirmationModal from '@/components/hr/DeleteConfirmationModal';


interface Salary {
  id: number;
  employee_name: string;
  gross_salary: string;
  net_salary: string;
  total_allowances: string;
  total_deductions: string;
  effective_date: string;
  base_salary: string;
  housing_allowance: string;
  transport_allowance: string;
  meal_allowance: string;
  communication_allowance: string;
  risk_allowance: string;
  other_allowance: string;
  paye_tax: string;
  sdl: string;
  wcf: string;
  pension_contribution: string;
  health_insurance: string;
  loan_deduction: string;
  other_deduction: string;
  created_at: string;
  updated_at: string;
  employee: number;
  employee_id?: number; // Backend uses employee_id
}

interface Employee {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  job_title: string;
}

export default function SalariesPage() {
  const { user } = useAuthStore();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    employee_id: '',  // CHANGED: from 'employee' to 'employee_id'
    effective_date: new Date().toISOString().split('T')[0],
    base_salary: '',
    housing_allowance: '0',
    transport_allowance: '0',
    meal_allowance: '0',
    communication_allowance: '0',
    risk_allowance: '0',
    other_allowance: '0',
    paye_tax: '0',
    sdl: '0',
    wcf: '0',
    pension_contribution: '0',
    health_insurance: '0',
    loan_deduction: '0',
    other_deduction: '0',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalGrossSalary, setTotalGrossSalary] = useState(0);
  const [totalNetSalary, setTotalNetSalary] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [salariesRes, employeesRes] = await Promise.all([
        hrApi.getSalaries(),
        hrApi.getEmployees(),
      ]);
      
      const salariesData = salariesRes.data.results || salariesRes.data || [];
      const employeesData = employeesRes.data.results || employeesRes.data || [];
      
      setSalaries(salariesData);
      setTotalItems(salariesData.length);
      setTotalPages(Math.ceil(salariesData.length / 20));
      setEmployees(employeesData);
      
      let gross = 0;
      let net = 0;
      for (let i = 0; i < salariesData.length; i++) {
        gross = gross + (parseFloat(salariesData[i].gross_salary) || 0);
        net = net + (parseFloat(salariesData[i].net_salary) || 0);
      }
      setTotalGrossSalary(gross);
      setTotalNetSalary(net);
      
    } catch (error) {
      console.error('Failed to fetch salaries:', error);
      toast.error('Failed to load salaries');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const housing = parseFloat(formData.housing_allowance) || 0;
    const transport = parseFloat(formData.transport_allowance) || 0;
    const meal = parseFloat(formData.meal_allowance) || 0;
    const communication = parseFloat(formData.communication_allowance) || 0;
    const risk = parseFloat(formData.risk_allowance) || 0;
    const otherAllowance = parseFloat(formData.other_allowance) || 0;
    
    const totalAllowances = housing + transport + meal + communication + risk + otherAllowance;
    const grossSalary = base + totalAllowances;
    
    const paye = parseFloat(formData.paye_tax) || 0;
    const sdl = parseFloat(formData.sdl) || 0;
    const wcf = parseFloat(formData.wcf) || 0;
    const pension = parseFloat(formData.pension_contribution) || 0;
    const health = parseFloat(formData.health_insurance) || 0;
    const loan = parseFloat(formData.loan_deduction) || 0;
    const otherDeduction = parseFloat(formData.other_deduction) || 0;
    
    const totalDeductions = paye + sdl + wcf + pension + health + loan + otherDeduction;
    const netSalary = grossSalary - totalDeductions;
    
    return { grossSalary, netSalary, totalAllowances, totalDeductions };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.base_salary) {
      toast.error('Please select employee and enter base salary');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send employee_id instead of employee
      const submitData = {
        employee_id: parseInt(formData.employee_id),  // CHANGED: send as employee_id
        effective_date: formData.effective_date,
        base_salary: parseFloat(formData.base_salary) || 0,
        housing_allowance: parseFloat(formData.housing_allowance) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        meal_allowance: parseFloat(formData.meal_allowance) || 0,
        communication_allowance: parseFloat(formData.communication_allowance) || 0,
        risk_allowance: parseFloat(formData.risk_allowance) || 0,
        other_allowance: parseFloat(formData.other_allowance) || 0,
        paye_tax: parseFloat(formData.paye_tax) || 0,
        sdl: parseFloat(formData.sdl) || 0,
        wcf: parseFloat(formData.wcf) || 0,
        pension_contribution: parseFloat(formData.pension_contribution) || 0,
        health_insurance: parseFloat(formData.health_insurance) || 0,
        loan_deduction: parseFloat(formData.loan_deduction) || 0,
        other_deduction: parseFloat(formData.other_deduction) || 0,
        business: user?.business,
      };

      console.log('Submitting salary with employee_id:', submitData);

      if (selectedSalary) {
        await hrApi.updateSalary(selectedSalary.id, submitData);
        toast.success('Salary updated successfully');
      } else {
        await hrApi.createSalary(submitData);
        toast.success('Salary created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save salary:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || Object.values(error.response?.data || {}).join(', ') || 'Failed to save salary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSalary) return;
    setIsSubmitting(true);
    
    try {
      await hrApi.deleteSalary(selectedSalary.id);
      toast.success('Salary deleted successfully');
      setShowDeleteModal(false);
      setSelectedSalary(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete salary:', error);
      toast.error(error.response?.data?.message || 'Failed to delete salary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setSelectedSalary(null);
    setSelectedEmployeeForSalary(null);
    setFormData({
      employee_id: '',  // CHANGED
      effective_date: new Date().toISOString().split('T')[0],
      base_salary: '',
      housing_allowance: '0',
      transport_allowance: '0',
      meal_allowance: '0',
      communication_allowance: '0',
      risk_allowance: '0',
      other_allowance: '0',
      paye_tax: '0',
      sdl: '0',
      wcf: '0',
      pension_contribution: '0',
      health_insurance: '0',
      loan_deduction: '0',
      other_deduction: '0',
    });
    setShowModal(true);
  };

  const openEditModal = (salary: Salary) => {
    setSelectedSalary(salary);
    const employee = employees.find(e => e.id === salary.employee);
    setSelectedEmployeeForSalary(employee || null);
    setFormData({
      employee_id: salary.employee?.toString() || salary.employee_id?.toString() || '',  // CHANGED
      effective_date: salary.effective_date?.split('T')[0] || '',
      base_salary: salary.base_salary?.toString() || '0',
      housing_allowance: salary.housing_allowance?.toString() || '0',
      transport_allowance: salary.transport_allowance?.toString() || '0',
      meal_allowance: salary.meal_allowance?.toString() || '0',
      communication_allowance: salary.communication_allowance?.toString() || '0',
      risk_allowance: salary.risk_allowance?.toString() || '0',
      other_allowance: salary.other_allowance?.toString() || '0',
      paye_tax: salary.paye_tax?.toString() || '0',
      sdl: salary.sdl?.toString() || '0',
      wcf: salary.wcf?.toString() || '0',
      pension_contribution: salary.pension_contribution?.toString() || '0',
      health_insurance: salary.health_insurance?.toString() || '0',
      loan_deduction: salary.loan_deduction?.toString() || '0',
      other_deduction: salary.other_deduction?.toString() || '0',
    });
    setShowModal(true);
  };

  const openViewModal = (salary: Salary) => {
    setSelectedSalary(salary);
    const employee = employees.find(e => e.id === salary.employee);
    setSelectedEmployeeForSalary(employee || null);
    setShowViewModal(true);
  };

  const openDeleteModal = (salary: Salary) => {
    setSelectedSalary(salary);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setSelectedSalary(null);
    setSelectedEmployeeForSalary(null);
    setFormData({
      employee_id: '',
      effective_date: new Date().toISOString().split('T')[0],
      base_salary: '',
      housing_allowance: '0',
      transport_allowance: '0',
      meal_allowance: '0',
      communication_allowance: '0',
      risk_allowance: '0',
      other_allowance: '0',
      paye_tax: '0',
      sdl: '0',
      wcf: '0',
      pension_contribution: '0',
      health_insurance: '0',
      loan_deduction: '0',
      other_deduction: '0',
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'TZS 0';
    return `TZS ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name || `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredSalaries = salaries.filter(salary =>
    getEmployeeName(salary.employee).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSalaries = filteredSalaries.slice(
    (currentPage - 1) * 20,
    currentPage * 20
  );

  const calculated = calculateTotals();

  if (isLoading && salaries.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
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
          <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee salary structures</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Add Salary Structure
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Salaries</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Gross Salary</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGrossSalary)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Net Salary</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNetSalary)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalGrossSalary - totalNetSalary)}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name..."
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

      {/* Salaries Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSalaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No salary records found
                  </td>
                </tr>
              ) : (
                paginatedSalaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getEmployeeName(salary.employee).charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getEmployeeName(salary.employee)}</p>
                          <p className="text-xs text-gray-500">ID: {salary.employee}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatCurrency(salary.base_salary)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {formatCurrency(salary.total_allowances)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-red-600">
                      {formatCurrency(salary.total_deductions)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">
                      {formatCurrency(salary.gross_salary)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      {formatCurrency(salary.net_salary)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(salary.effective_date)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(salary)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(salary)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(salary)}
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

      {/* Create/Edit Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedSalary ? 'Edit Salary Structure' : 'Add Salary Structure'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg mb-2">
                <p className="text-xs text-gray-500">Business</p>
                <p className="text-sm font-medium text-gray-900">{user?.business_name || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || `${emp.first_name} ${emp.last_name}`} - {emp.employee_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    name="effective_date"
                    value={formData.effective_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Base Salary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Salary *
                    </label>
                    <input
                      type="number"
                      name="base_salary"
                      value={formData.base_salary}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiHome size={16} /> Allowances
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Housing Allowance</label>
                    <input
                      type="number"
                      name="housing_allowance"
                      value={formData.housing_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                    <input
                      type="number"
                      name="transport_allowance"
                      value={formData.transport_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Allowance</label>
                    <input
                      type="number"
                      name="meal_allowance"
                      value={formData.meal_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Allowance</label>
                    <input
                      type="number"
                      name="communication_allowance"
                      value={formData.communication_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Allowance</label>
                    <input
                      type="number"
                      name="risk_allowance"
                      value={formData.risk_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowance</label>
                    <input
                      type="number"
                      name="other_allowance"
                      value={formData.other_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiFileText size={16} /> Deductions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAYE Tax</label>
                    <input
                      type="number"
                      name="paye_tax"
                      value={formData.paye_tax}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SDL (Skills Levy)</label>
                    <input
                      type="number"
                      name="sdl"
                      value={formData.sdl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WCF</label>
                    <input
                      type="number"
                      name="wcf"
                      value={formData.wcf}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pension Contribution</label>
                    <input
                      type="number"
                      name="pension_contribution"
                      value={formData.pension_contribution}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Health Insurance</label>
                    <input
                      type="number"
                      name="health_insurance"
                      value={formData.health_insurance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Deduction</label>
                    <input
                      type="number"
                      name="loan_deduction"
                      value={formData.loan_deduction}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction</label>
                    <input
                      type="number"
                      name="other_deduction"
                      value={formData.other_deduction}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Calculation Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Allowances</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(calculated.totalAllowances)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Deductions</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(calculated.totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gross Salary</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(calculated.grossSalary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Salary</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(calculated.netSalary)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (selectedSalary ? 'Update Salary' : 'Create Salary')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Salary Modal - Keep as is */}
      {showViewModal && selectedSalary && selectedEmployeeForSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Salary Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedEmployeeForSalary.full_name?.charAt(0) || selectedEmployeeForSalary.first_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEmployeeForSalary.full_name || `${selectedEmployeeForSalary.first_name} ${selectedEmployeeForSalary.last_name}`}</h2>
                  <p className="text-gray-500">{selectedEmployeeForSalary.employee_number}</p>
                  <p className="text-sm text-gray-600">{selectedEmployeeForSalary.job_title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Net Salary</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSalary.net_salary)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Gross Salary</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedSalary.gross_salary)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Allowances</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(selectedSalary.total_allowances)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Deductions</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(selectedSalary.total_deductions)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedSalary);
                  }}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition"
                >
                  Edit Salary
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Salary Structure"
        message="Are you sure you want to delete the salary record for"
        itemName={selectedSalary ? getEmployeeName(selectedSalary.employee) : ''}
        isDeleting={isSubmitting}
      />
    </div>
  );
}