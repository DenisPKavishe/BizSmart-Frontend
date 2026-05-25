// app/(dashboard)/admin/users/page.tsx - WITH PASSWORD CHANGE OPTION

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi, hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiX,
  FiShield,
  FiClock,
  FiUserPlus,
  FiUserCheck,
  FiLock,
  FiUnlock,
  FiKey,
} from 'react-icons/fi';
import { FaUserTag, FaBuilding, FaUserGraduate, FaUserClock } from 'react-icons/fa';

interface Employee {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  username: string;
  email: string;
  phone: string;
  job_title: string;
  department_name: string;
  is_active: boolean;
}

interface User {
  id: number;
  email: string;
  username: string;
  phone: string;
  role: number | null;
  role_name: string | null;
  business: number;
  business_name: string;
  business_city: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  employee_id?: number;
  employee_name?: string;
  employee_username?: string;
  employee_number?: string;
}

interface Role {
  id: number;
  name: string;
}

const roleOptions = [
  { id: 1, name: 'Owner' },
  { id: 2, name: 'Manager' },
  { id: 3, name: 'Accountant' },
  { id: 4, name: 'Auditor' },
  { id: 5, name: 'Cashier/Sales Rep' },
];

// Create User Modal - Scrollable
function CreateUserModal({ isOpen, onClose, onSuccess, employee }: any) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email || '',
        username: employee.username || employee.email?.split('@')[0] || employee.full_name?.toLowerCase().replace(/\s/g, '.') || '',
        password: '',
        role: '',
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password || !formData.role) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        phone: employee.phone || '',
        business: user?.business,
        role: parseInt(formData.role),
      });
      toast.success(`User account created for ${formData.username}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Create User Account</h3>
            <p className="text-xs text-gray-500 mt-1">For employee: {employee.full_name}</p>
            <p className="text-xs text-blue-600">Username: @{employee.username}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Suggested: {employee.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEye size={16} /> : <FiLock size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <p>This will create a system login account for {employee.full_name}.</p>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create User Account'}
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

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose, onSuccess, userEmail, userName }: any) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.current_password) {
      toast.error('Please enter current password');
      return;
    }
    
    if (!formData.new_password) {
      toast.error('Please enter new password');
      return;
    }
    
    if (formData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        email: userEmail,
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      toast.success('Password changed successfully');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password. Please check your current password.');
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
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiKey size={18} className="text-amber-600" />
              Change Password
            </h3>
            <p className="text-xs text-gray-500 mt-1">For user: @{userName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <FiEye size={16} /> : <FiLock size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Enter new password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEye size={16} /> : <FiLock size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEye size={16} /> : <FiLock size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
              <p className="flex items-center gap-1">
                <FiAlertCircle size={14} />
                Make sure to save your new password in a safe place.
              </p>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
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

// Edit User Modal - With Change Password Button
function EditUserModal({ isOpen, onClose, onSuccess, user: userData, onOpenChangePassword }: any) {
  const [formData, setFormData] = useState({
    role_id: '',
    is_active: true,
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        role_id: userData.role?.toString() || '',
        is_active: userData.is_active,
        phone: userData.phone || '',
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.updateUser(userData.id, {
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        is_active: formData.is_active,
        phone: formData.phone,
      });
      toast.success('User updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit User Access</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-sm font-medium text-blue-600">@{userData.employee_username || userData.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                {userData.email}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Account Active
              </label>
            </div>

            {/* Change Password Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenChangePassword(userData)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition"
              >
                <FiKey size={16} />
                Change Password
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                User will need to enter current password to set a new one
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
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

// View User Modal
function ViewUserModal({ isOpen, onClose, user: userData, onEdit, onChangePassword }: any) {
  if (!isOpen || !userData) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">User Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6">
            {/* Header with Username */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-blue-600">@{userData.employee_username || userData.username}</h2>
              <p className="text-sm text-gray-500 mt-1">User ID: {userData.id}</p>
              <div className="mt-2">
                {userData.is_active ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    <FiCheckCircle size={12} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                    <FiAlertCircle size={12} /> Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiUser size={16} /> Account Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{userData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm text-gray-900">{userData.role_name || 'No Role'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">System Username</p>
                  <p className="text-sm text-gray-900">{userData.username}</p>
                </div>
              </div>
            </div>

            {/* Employee Information (if available) */}
            {userData.employee_name && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaUserGraduate size={16} /> Employee Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-900">{userData.employee_name}</p>
                  </div>
                  {userData.employee_number && (
                    <div>
                      <p className="text-xs text-gray-500">Employee Number</p>
                      <p className="text-sm text-gray-900">#{userData.employee_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaBuilding size={16} /> Business Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Business Name</p>
                  <p className="text-sm text-gray-900">{userData.business_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm text-gray-900">{userData.business_city || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Login Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaUserClock size={16} /> Login Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm text-gray-900">{formatDate(userData.last_login)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Created</p>
                  <p className="text-sm text-gray-900">{formatDate(userData.created_at)}</p>
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
                if (onEdit) onEdit(userData);
              }}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Edit User
            </button>
            <button
              onClick={() => {
                onClose();
                if (onChangePassword) onChangePassword(userData);
              }}
              className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition"
            >
              Change Password
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

// Delete/Revoke Access Modal
function RevokeAccessModal({ isOpen, onClose, onConfirm, userName, isDeleting }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiAlertCircle className="text-red-500" size={20} />
            Revoke Access
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to revoke system access for <span className="font-semibold text-gray-900">"@{userName}"</span>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The user will no longer be able to log in.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Revoking...' : 'Yes, Revoke Access'}
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

// Select Employee Modal - Scrollable
function SelectEmployeeModal({ isOpen, onClose, onSelect, employees, isLoading }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter((emp: Employee) =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 flex flex-col max-h-[85vh]">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Select Employee</h3>
            <p className="text-xs text-gray-500 mt-1">Choose an employee to grant system access</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="sticky top-[73px] bg-white z-10 p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee number, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No employees found</p>
              <p className="text-xs mt-1">Please add employees first in HR module</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map((employee: Employee) => (
                <button
                  key={employee.id}
                  onClick={() => onSelect(employee)}
                  className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  <p className="font-medium text-gray-900">{employee.full_name}</p>
                  <p className="text-sm text-blue-600">@{employee.username}</p>
                  <p className="text-xs text-gray-500">#{employee.employee_number} • {employee.job_title}</p>
                  <p className="text-xs text-gray-400">{employee.department_name || 'No Department'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelectEmployeeModal, setShowSelectEmployeeModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getUsers();
      const usersData = response.data;
      
      const usersWithEmployee = usersData.map((userData: User) => {
        const matchingEmployee = employees.find(emp => emp.email === userData.email);
        return {
          ...userData,
          employee_id: matchingEmployee?.id,
          employee_name: matchingEmployee?.full_name,
          employee_username: matchingEmployee?.username,
          employee_number: matchingEmployee?.employee_number,
        };
      });
      
      setUsers(usersWithEmployee);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await hrApi.getEmployees();
      const employeesData = response.data.results || response.data || [];
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSelectEmployeeModal(false);
    setShowCreateUserModal(true);
  };

  const handleRevokeAccess = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      await authApi.deleteUser(selectedUser.id);
      toast.success(`Access revoked for @${selectedUser.employee_username || selectedUser.username}`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setIsDeleting(false);
    }
  };

  const openViewModal = (userData: User) => {
    setSelectedUser(userData);
    setShowViewModal(true);
  };

  const openEditModal = (userData: User) => {
    setSelectedUser(userData);
    setShowEditModal(true);
  };

  const openChangePasswordModal = (userData: User) => {
    setSelectedUser(userData);
    setShowChangePasswordModal(true);
  };

  const openRevokeModal = (userData: User) => {
    setSelectedUser(userData);
    setShowDeleteModal(true);
  };

  const getRoleBadge = (roleName: string | null) => {
    if (!roleName) return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">No Role</span>;
    
    const colors: Record<string, string> = {
      Owner: 'bg-purple-100 text-purple-700',
      Manager: 'bg-blue-100 text-blue-700',
      Accountant: 'bg-green-100 text-green-700',
      'Cashier/Sales Rep': 'bg-amber-100 text-amber-700',
      Auditor: 'bg-gray-100 text-gray-700',
    };
    const color = colors[roleName] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${color}`}>
        <FaUserTag size={10} />
        {roleName}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          <FiCheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
        <FiAlertCircle size={12} />
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const resetFilters = () => {
    setRoleFilter('');
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(userData => {
    const matchesSearch = 
      userData.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.employee_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || (userData.role === parseInt(roleFilter));
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? userData.is_active : !userData.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const usersEmails = new Set(users.map(u => u.email));
  const availableEmployees = employees.filter(emp => !usersEmails.has(emp.email) && emp.is_active);

  if (isLoading && users.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system access for employees</p>
        </div>
        <button
          onClick={() => setShowSelectEmployeeModal(true)}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <FiUserPlus size={18} />
          Grant Access
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUserCheck className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Employees without Access</p>
              <p className="text-2xl font-bold text-amber-600">{availableEmployees.length}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FaUserGraduate className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-purple-600">{employees.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-purple-600" size={20} />
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
              placeholder="Search by username or email..."
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
            onClick={() => {
              fetchUsers();
              fetchEmployees();
            }}
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
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                {roleOptions.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
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
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-blue-600">@{userData.employee_username || userData.username}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {userData.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FiMail size={14} /> {userData.email}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <FiPhone size={14} /> {userData.phone || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(userData.role_name)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(userData.is_active)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(userData.last_login)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(userData)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(userData)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                          title="Edit User"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => openChangePasswordModal(userData)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                          title="Change Password"
                        >
                          <FiKey size={16} />
                        </button>
                        {userData.role_name !== 'Owner' && (
                          <button
                            onClick={() => openRevokeModal(userData)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Revoke Access"
                          >
                            <FiTrash2 size={16} />
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

      {/* Modals */}
      <SelectEmployeeModal
        isOpen={showSelectEmployeeModal}
        onClose={() => setShowSelectEmployeeModal(false)}
        onSelect={handleSelectEmployee}
        employees={availableEmployees}
        isLoading={isLoadingEmployees}
      />

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
          setSelectedEmployee(null);
        }}
        onSuccess={() => {
          fetchUsers();
          fetchEmployees();
        }}
        employee={selectedEmployee}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
        onOpenChangePassword={openChangePasswordModal}
      />

      <ViewUserModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        onEdit={openEditModal}
        onChangePassword={openChangePasswordModal}
        user={selectedUser}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          // Refresh users if needed
          fetchUsers();
        }}
        userEmail={selectedUser?.email || ''}
        userName={selectedUser?.employee_username || selectedUser?.username || ''}
      />

      <RevokeAccessModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleRevokeAccess}
        userName={selectedUser?.employee_username || selectedUser?.username}
        isDeleting={isDeleting}
      />
    </div>
  );
}