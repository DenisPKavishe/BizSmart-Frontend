// app/(dashboard)/audit-logs/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auditApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiActivity,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiClock,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlusCircle,
  FiLogIn,
  FiLogOut,
  FiFileText,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiBarChart2,
  FiUsers,
} from 'react-icons/fi';

// ==================== INTERFACES ====================

interface AuditLog {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  action: string;
  action_display: string;
  module: string;
  module_display: string;
  description: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

interface AuditStats {
  total_logs: number;
  today_logs: number;
  this_week_logs: number;
  this_month_logs: number;
  unique_users: number;
  unique_actions: number;
  top_users: Array<{ username: string; count: number }>;
  top_actions: Array<{ action: string; count: number }>;
}

interface AuditFilters {
  start_date?: string;
  end_date?: string;
  action?: string;
  module?: string;
  page: number;
  page_size: number;
}

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  switch (actionLower) {
    case 'create':
      return <FiPlusCircle className="text-green-500" />;
    case 'update':
      return <FiEdit className="text-blue-500" />;
    case 'delete':
      return <FiTrash2 className="text-red-500" />;
    case 'login':
      return <FiLogIn className="text-teal-500" />;
    case 'logout':
      return <FiLogOut className="text-orange-500" />;
    case 'export':
      return <FiDownload className="text-indigo-500" />;
    default:
      return <FiActivity className="text-gray-500" />;
  }
};

const getModuleIcon = (module: string) => {
  const moduleLower = module.toLowerCase();
  switch (moduleLower) {
    case 'inventory':
      return <FiBox className="text-blue-500" />;
    case 'sales':
      return <FiShoppingCart className="text-green-500" />;
    case 'financials':
      return <FiDollarSign className="text-red-500" />;
    case 'hr':
      return <FiUsers className="text-purple-500" />;
    case 'bi':
      return <FiBarChart2 className="text-teal-500" />;
    case 'auth':
      return <FiUser className="text-gray-500" />;
    default:
      return <FiActivity className="text-gray-500" />;
  }
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  switch (actionLower) {
    case 'create':
      return 'bg-green-100 text-green-700';
    case 'update':
      return 'bg-blue-100 text-blue-700';
    case 'delete':
      return 'bg-red-100 text-red-700';
    case 'login':
      return 'bg-teal-100 text-teal-700';
    case 'logout':
      return 'bg-orange-100 text-orange-700';
    case 'export':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ==================== COMPONENTS ====================

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function FilterBar({ filters, onFilterChange, onReset, onExport, modules, actions, isLoading }: any) {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FiFilter size={16} />
            Filters
            {(filters.start_date || filters.end_date || filters.action || filters.module) && (
              <span className="ml-1 w-2 h-2 bg-teal-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FiRefreshCw size={16} />
            Reset
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('csv')}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FiDownload size={16} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <FiPrinter size={16} />
            Print
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date || ''}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date || ''}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              name="action"
              value={filters.action || ''}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Actions</option>
              {actions.map((action: any) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Module</label>
            <select
              name="module"
              value={filters.module || ''}
              onChange={onFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Modules</option>
              {modules.map((module: any) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [filters, setFilters] = useState<AuditFilters>({
    start_date: '',
    end_date: '',
    action: '',
    module: '',
    page: 1,
    page_size: 50,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchModulesAndActions();
    fetchAuditLogs();
    fetchStats();
  }, [filters]);

  const fetchModulesAndActions = async () => {
    try {
      const [modulesRes, actionsRes] = await Promise.all([
        auditApi.getModules(),
        auditApi.getActions(),
      ]);
      setModules(modulesRes.data);
      setActions(actionsRes.data);
    } catch (error) {
      console.error('Failed to fetch modules/actions:', error);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const response = await auditApi.getAuditLogs(filters);
      setLogs(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditApi.getAuditStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      action: '',
      module: '',
      page: 1,
      page_size: 50,
    });
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    toast.loading('Exporting audit logs...');
    try {
      const response = await auditApi.exportAuditLogs({
        start_date: filters.start_date,
        end_date: filters.end_date,
        action: filters.action,
        module: filters.module,
        format,
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.dismiss();
      toast.error('Failed to export');
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(totalCount / (filters.page_size || 50));

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard
          title="Total Events"
          value={stats?.total_logs}
          icon={FiActivity}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Today"
          value={stats?.today_logs}
          icon={FiCalendar}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="This Week"
          value={stats?.this_week_logs}
          icon={FiClock}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="This Month"
          value={stats?.this_month_logs}
          icon={FiCalendar}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Active Users"
          value={stats?.unique_users}
          icon={FiUser}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Top Users & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiUser className="text-teal-600" />
            Most Active Users
          </h3>
          <div className="space-y-2">
            {stats?.top_users?.length ? (
              stats.top_users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  <span className="text-sm text-gray-500">{user.count} actions</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">No user activity yet</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiActivity className="text-teal-600" />
            Most Common Actions
          </h3>
          <div className="space-y-2">
            {stats?.top_actions?.length ? (
              stats.top_actions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getActionIcon(action.action)}
                    <span className="text-sm font-medium text-gray-700 capitalize">{action.action}</span>
                  </div>
                  <span className="text-sm text-gray-500">{action.count} times</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">No actions recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onExport={handleExport}
        modules={modules}
        actions={actions}
        isLoading={isLoading}
      />

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <div className="animate-pulse">Loading audit logs...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                          <FiUser size={12} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action_display}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(log.module)}
                        <span className="text-sm text-gray-700">{log.module_display}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(filters.page - 1) * (filters.page_size || 50) + 1} to{' '}
              {Math.min(filters.page * (filters.page_size || 50), totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Log Details */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Timestamp</label>
                  <p className="text-sm font-medium">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">User</label>
                  <p className="text-sm font-medium">{selectedLog.user_email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Action</label>
                  <p className="text-sm font-medium">{selectedLog.action_display}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Module</label>
                  <p className="text-sm font-medium">{selectedLog.module_display}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">IP Address</label>
                  <p className="text-sm font-medium font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-700">{selectedLog.description}</p>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Details</label>
                <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}