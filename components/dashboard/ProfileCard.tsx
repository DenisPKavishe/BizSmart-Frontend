// components/dashboard/ProfileCard.tsx
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiHome, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

export function ProfileCard() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.updateProfile(formData);
      updateUser(response.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          <p className="text-sm text-gray-500 mt-1">Your personal information and role</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition"
          >
            <FiEdit2 size={16} />
            Edit
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiUser className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Full Name</p>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900 break-words">{user?.username || 'Not set'}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiMail className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Email Address</p>
            <p className="text-sm font-medium text-gray-900 break-words">{user?.email || 'Not set'}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiPhone className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Phone Number</p>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900 break-words">{user?.phone || 'Not set'}</p>
            )}
          </div>
        </div>

        {/* Role */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiBriefcase className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-sm font-medium text-gray-900 break-words capitalize">{user?.role_name || 'Not set'}</p>
          </div>
        </div>

        {/* Business - Using FiHome instead of FiBuilding */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiHome className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Business</p>
            <p className="text-sm font-medium text-gray-900 break-words">{user?.business_name || 'Not set'}</p>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : <><FiSave size={16} /> Save Changes</>}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              <FiX size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}