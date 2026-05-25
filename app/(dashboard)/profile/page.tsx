// app/(dashboard)/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiSave,
  FiEdit2,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { FaBuilding, FaUserTag } from 'react-icons/fa';

interface Profile {
  id: number;
  email: string;
  username: string;
  phone: string;
  role: number;
  role_name: string;
  business: number;
  business_name: string;
  business_city: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getProfile();
      setProfile(response.data);
      setFormData({
        username: response.data.username || '',
        phone: response.data.phone || '',
      });
      
      // Update auth store if needed
      if (updateUser) {
        updateUser({
          ...user,
          username: response.data.username,
          phone: response.data.phone,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await authApi.updateProfile({
        username: formData.username,
        phone: formData.phone,
      });
      
      setProfile(response.data);
      
      // Update auth store
      if (updateUser) {
        updateUser({
          ...user,
          username: response.data.username,
          phone: response.data.phone,
        });
      }
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadge = (roleName: string) => {
    const colors: Record<string, string> = {
      Owner: 'bg-purple-100 text-purple-700',
      Manager: 'bg-blue-100 text-blue-700',
      Accountant: 'bg-green-100 text-green-700',
      Cashier: 'bg-amber-100 text-amber-700',
      Auditor: 'bg-gray-100 text-gray-700',
    };
    const color = colors[roleName] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${color}`}>
        <FaUserTag size={12} />
        {roleName}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">Failed to load profile</p>
          <button onClick={fetchProfile} className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
            >
              <FiEdit2 size={16} />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  username: profile.username || '',
                  phone: profile.phone || '',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <FiX size={16} />
              Cancel
            </button>
          )}
          <button
            onClick={fetchProfile}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-brand-50 to-white p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.username?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.username || profile.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getRoleBadge(profile.role_name)}
                <span className={`text-xs px-2 py-1 rounded-full ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Member since {formatDate(profile.created_at).split(',')[0]}</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email (Read-only) */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiMail size={16} />
                  Email Address
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {profile.email}
                </div>
                <p className="text-xs text-gray-400">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiUser size={16} />
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter username"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {profile.username || 'Not set'}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiPhone size={16} />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {profile.phone || 'Not set'}
                  </div>
                )}
              </div>

              {/* Business Name */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaBuilding size={16} />
                  Business Name
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {profile.business_name}
                </div>
              </div>

              {/* Business City */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiMapPin size={16} />
                  Business City
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {profile.business_city || 'Not set'}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiBriefcase size={16} />
                  Role
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {getRoleBadge(profile.role_name)}
                </div>
              </div>

              {/* Last Login */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiCalendar size={16} />
                  Last Login
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {formatDate(profile.last_login)}
                </div>
              </div>

              {/* Member Since */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiCalendar size={16} />
                  Member Since
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {formatDate(profile.created_at)}
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: profile.username || '',
                      phone: profile.phone || '',
                    });
                  }}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiSave size={16} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Account Security Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <FiCheckCircle className="text-blue-500 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-blue-800">Account Security</p>
            <p className="text-xs text-blue-600 mt-1">
              For security reasons, email address cannot be changed. If you need to update your email, please contact system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}