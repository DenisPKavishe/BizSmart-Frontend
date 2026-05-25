// app/(dashboard)/sales/returns/page.tsx - CORRECTED VERSION

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiEye,
  FiTrash2,
  FiFilter,
  FiRefreshCw,
  FiX,
  FiArrowLeft,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi';

interface ReturnItem {
  id: number;
  sale_invoice: string;
  product_name: string;
  reason: string;
  quantity_returned: number;
  refund_amount: number;
  notes: string;
  created_at: string;
  sale: number;
  sale_item: number;
  created_by: number;
}

// Return Reasons Configuration (without emojis)
const returnReasons = [
  { value: 'damaged', label: 'Damaged Product', color: 'bg-red-100 text-red-700' },
  { value: 'wrong_item', label: 'Wrong Item Sent', color: 'bg-orange-100 text-orange-700' },
  { value: 'defective', label: 'Defective/Not Working', color: 'bg-red-100 text-red-700' },
  { value: 'wrong_size', label: 'Wrong Size/Fit', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'customer_request', label: 'Customer Changed Mind', color: 'bg-blue-100 text-blue-700' },
  { value: 'expired', label: 'Expired Product', color: 'bg-red-100 text-red-700' },
  { value: 'other', label: 'Other Reason', color: 'bg-gray-100 text-gray-700' },
];

const getReasonBadge = (reason: string) => {
  const reasonConfig = returnReasons.find(r => r.value === reason);
  if (!reasonConfig) {
    return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{reason}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${reasonConfig.color}`}>
      {reasonConfig.label}
    </span>
  );
};

const formatCurrency = (value: number) => {
  const num = value || 0;
  if (num === 0) return 'TZS 0';
  return `TZS ${num.toLocaleString()}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Delete Confirmation Modal
function DeleteReturnModal({ isOpen, onClose, onConfirm, returnInfo, isDeleting }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiAlertCircle className="text-red-500" size={20} />
            Delete Return
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete this return for <span className="font-semibold text-gray-900">"{returnInfo?.product_name}"</span>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Invoice: {returnInfo?.sale_invoice}<br />
            Quantity: {returnInfo?.quantity_returned}<br />
            Refund Amount: {formatCurrency(returnInfo?.refund_amount || 0)}
          </p>
          <p className="text-sm text-red-600 mb-6">Warning: This action cannot be undone.</p>
          
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

// View Return Modal
function ViewReturnModal({ isOpen, onClose, returnItem }: any) {
  if (!isOpen || !returnItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Return Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Invoice Number</span>
              <span className="text-sm font-medium text-brand-600">{returnItem.sale_invoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Product</span>
              <span className="text-sm font-medium">{returnItem.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Quantity Returned</span>
              <span className="text-sm font-medium">{returnItem.quantity_returned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Refund Amount</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(returnItem.refund_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Return Date</span>
              <span className="text-sm">{formatDate(returnItem.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Reason</span>
              <span>{getReasonBadge(returnItem.reason)}</span>
            </div>
            {returnItem.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-white p-2 rounded">{returnItem.notes}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-full border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const { user } = useAuthStore();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);

  useEffect(() => {
    fetchReturns();
  }, [currentPage, startDate, endDate, reasonFilter]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, page_size: 20 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (reasonFilter) params.reason = reasonFilter;
      
      const response = await salesApi.getReturns(params);
      const data = response.data;
      
      const returnsData = data.results || data || [];
      setReturns(returnsData);
      setTotalPages(Math.ceil((data.count || returnsData.length) / 20));
      setTotalItems(data.count || returnsData.length);
      
      const totalRefund = returnsData.reduce((sum: number, r: ReturnItem) => sum + (r.refund_amount || 0), 0);
      setTotalRefundAmount(totalRefund);
      
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast.error('Failed to load returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReturn) return;
    setIsDeleting(true);
    
    try {
      await salesApi.deleteReturn(selectedReturn.id);
      toast.success('Return deleted successfully');
      setShowDeleteModal(false);
      setSelectedReturn(null);
      fetchReturns();
    } catch (error: any) {
      console.error('Failed to delete return:', error);
      toast.error(error.response?.data?.message || 'Failed to delete return');
    } finally {
      setIsDeleting(false);
    }
  };

  const openViewModal = (returnItem: ReturnItem) => {
    setSelectedReturn(returnItem);
    setShowViewModal(true);
  };

  const openDeleteModal = (returnItem: ReturnItem) => {
    setSelectedReturn(returnItem);
    setShowDeleteModal(true);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setReasonFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredReturns = returns.filter(returnItem =>
    returnItem.sale_invoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedReturns = filteredReturns.slice((currentPage - 1) * 20, currentPage * 20);

  if (isLoading && returns.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage product returns</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FiFilter size={16} />
            Filters
          </button>
          <button
            onClick={fetchReturns}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Returns</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Refunded</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRefundAmount)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Unique Products</p>
          <p className="text-2xl font-bold text-brand-600">
            {new Set(returns.map(r => r.product_name)).size}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-purple-600">
            {returns.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Return Reason</label>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Reasons</option>
                {returnReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Refund Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No returns found
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-brand-600">{returnItem.sale_invoice}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{returnItem.product_name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium">{returnItem.quantity_returned}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(returnItem.refund_amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getReasonBadge(returnItem.reason)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(returnItem.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(returnItem)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(returnItem)}
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
                <FiArrowLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <FiArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Return Modal */}
      <ViewReturnModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReturn(null);
        }}
        returnItem={selectedReturn}
      />

      {/* Delete Confirmation Modal */}
      <DeleteReturnModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReturn(null);
        }}
        onConfirm={handleDelete}
        returnInfo={selectedReturn}
        isDeleting={isDeleting}
      />
    </div>
  );
}