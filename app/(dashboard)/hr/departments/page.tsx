// app/(dashboard)/hr/departments/page.tsx - WITHOUT AVATARS

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
  FiRefreshCw,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiX,
  FiCalendar,
  FiUser,
  FiBriefcase,
} from 'react-icons/fi';
import { FaBuilding, FaUserTie, FaChartLine } from 'react-icons/fa';

interface Department {
  id: number;
  name: string;
  description: string;
  manager_name: string | null;
  manager: number | null;
  business: number;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
}

// Delete Confirmation Modal
function DeleteDepartmentModal({ isOpen, onClose, onConfirm, departmentName, isDeleting }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiAlertCircle className="text-red-500" size={20} />
            Delete Department
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete department <span className="font-semibold text-gray-900">"{departmentName}"</span>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This action will remove the department. Employees in this department will need to be reassigned.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// View Department Modal
function ViewDepartmentModal({ isOpen, onClose, department, onEdit }: any) {
  if (!isOpen || !department) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Department Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6">
            {/* Header - No Avatar */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-purple-600">{department.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Department ID: {department.id}</p>
            </div>

            {/* Department Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaBuilding size={16} /> Department Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-900">{department.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department Manager</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <FaUserTie size={14} className="text-gray-400" />
                    {department.manager_name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employee Count</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <FiUsers size={14} className="text-gray-400" />
                    {department.employee_count || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiCalendar size={16} /> System Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="text-sm text-gray-900">{formatDate(department.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(department.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(department);
              }}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Edit Department
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Department Modal
function DepartmentModal({ isOpen, onClose, onSuccess, department, employees }: any) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    business: user?.business || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        manager: department.manager?.toString() || '',
        business: user?.business || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        manager: '',
        business: user?.business || 0,
      });
    }
  }, [department, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Department name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        business: formData.business,
        manager: formData.manager ? parseInt(formData.manager) : null,
      };

      if (department) {
        await hrApi.updateDepartment(department.id, submitData);
        toast.success('Department updated successfully');
      } else {
        await hrApi.createDepartment(submitData);
        toast.success('Department created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {department ? 'Edit Department' : 'Create New Department'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {department ? 'Update department information' : 'Add a new department to your organization'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Engineering, Sales, Marketing"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the department's responsibilities"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Manager
              </label>
              <select
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Manager</option>
                {employees?.map((emp: Employee) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || `${emp.first_name} ${emp.last_name}`} - {emp.job_title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Assign an employee as the department head
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <p className="flex items-center gap-1">
                <FaBuilding size={14} />
                This department will be associated with {user?.business_name || 'your business'}
              </p>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (department ? 'Update Department' : 'Create Department')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await hrApi.getDepartments();
      const departmentsData = response.data.results || response.data || [];
      setDepartments(departmentsData);
      setTotalItems(departmentsData.length);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await hrApi.getEmployees();
      const employeesData = response.data.results || response.data || [];
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    setIsSubmitting(true);
    
    try {
      await hrApi.deleteDepartment(selectedDepartment.id);
      toast.success(`Department "${selectedDepartment.name}" has been deleted`);
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const openCreateModal = () => {
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const openViewModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowViewModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter departments
  const filteredDepartments = departments.filter(department =>
    department.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get department statistics
  const getDepartmentStats = () => {
    const totalDepartments = departments.length;
    const departmentsWithManager = departments.filter(d => d.manager_name).length;
    const avgEmployeesPerDept = totalDepartments > 0 ? (totalItems / totalDepartments).toFixed(1) : 0;
    
    return { totalDepartments, departmentsWithManager, avgEmployeesPerDept };
  };

  const stats = getDepartmentStats();

  if (isLoading && departments.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization's departments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Add Department
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaBuilding className="text-purple-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">With Managers</p>
              <p className="text-2xl font-bold text-green-600">{stats.departmentsWithManager}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaUserTie className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Employees/Dept</p>
              <p className="text-2xl font-bold text-amber-600">{stats.avgEmployeesPerDept}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-amber-600" size={20} />
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
              placeholder="Search by department name, description, or manager..."
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
            onClick={fetchDepartments}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-blue-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDepartments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-purple-600">{department.name}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {department.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {department.manager_name ? (
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-gray-400" size={14} />
                          <span className="text-sm text-gray-900">{department.manager_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-md truncate">
                        {department.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(department.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(department)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(department)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(department)}
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
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Department Modal */}
      <DepartmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDepartment(null);
        }}
        onSuccess={fetchDepartments}
        department={selectedDepartment}
        employees={employees}
      />

      {/* View Department Modal */}
      <ViewDepartmentModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onEdit={openEditModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDepartmentModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleDelete}
        departmentName={selectedDepartment?.name || ''}
        isDeleting={isSubmitting}
      />
    </div>
  );
}