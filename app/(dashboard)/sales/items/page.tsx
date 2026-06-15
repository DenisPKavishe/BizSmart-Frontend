// app/(dashboard)/sales/items/page.tsx - WITH CASHIER RESTRICTIONS

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiDollarSign,
  FiBox,
  FiHash,
  FiCalendar,
  FiUser,
  FiShoppingCart,
} from 'react-icons/fi';
import { FaMoneyBillWave, FaBoxOpen, FaChartLine } from 'react-icons/fa';
import { getPagePermissions, getUserRole } from '@/lib/permissions';

interface SaleItem {
  id: number;
  sale: number;
  product: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  cost_price: string;
  total_price: string;
  discount_amount: string;
}

// View Sale Item Modal - Hide cost/profit for cashier
function ViewSaleItemModal({ isOpen, onClose, saleItem, canViewProfit }: any) {
  if (!isOpen || !saleItem) return null;

  const profit = parseFloat(saleItem.total_price) - (parseFloat(saleItem.cost_price) * saleItem.quantity);
  const profitMargin = (profit / parseFloat(saleItem.total_price)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sale Item Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-6 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{saleItem.product_name}</h2>
                <p className="text-sm text-gray-500">SKU: {saleItem.product_sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Item ID</p>
                <p className="text-sm font-medium">#{saleItem.id}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiShoppingCart size={16} /> Sale Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Sale ID</p>
                <p className="text-sm text-gray-900">{saleItem.sale}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product ID</p>
                <p className="text-sm text-gray-900">{saleItem.product}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaBoxOpen size={16} /> Quantity & Pricing
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="text-sm font-medium text-gray-900">{saleItem.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit Price</p>
                <p className="text-sm text-gray-900">TZS {parseFloat(saleItem.unit_price).toLocaleString()}</p>
              </div>
              {canViewProfit && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Cost Price</p>
                    <p className="text-sm text-gray-900">TZS {parseFloat(saleItem.cost_price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Discount</p>
                    <p className="text-sm text-gray-900">TZS {parseFloat(saleItem.discount_amount).toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {canViewProfit && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaMoneyBillWave size={16} /> Financial Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Total Price</p>
                  <p className="text-lg font-bold text-blue-600">TZS {parseFloat(saleItem.total_price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-sm text-gray-900">TZS {(parseFloat(saleItem.cost_price) * saleItem.quantity).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    TZS {profit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Profit Margin</p>
                  <p className={`text-sm font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesItemsPage() {
  const { user } = useAuthStore();
  const permissions = getPagePermissions(user);
  const { isCashier } = getUserRole(user);
  
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchSaleItems();
  }, []);

  const fetchSaleItems = async () => {
    setIsLoading(true);
    try {
      const response = await salesApi.getSaleItems();
      setSaleItems(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch sale items:', error);
      toast.error('Failed to load sale items');
    } finally {
      setIsLoading(false);
    }
  };

  const openViewModal = (item: SaleItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const formatCurrency = (amount: string) => {
    return `TZS ${parseFloat(amount).toLocaleString()}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredItems = saleItems.filter(item => {
    const matchesSearch = 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm);
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats - only for non-cashier
  let stats = { total: 0, totalQuantity: 0, totalRevenue: 0, totalCost: 0 };
  let totalProfit = 0;
  let profitMargin = 0;

  if (permissions.canViewAnalytics) {
    stats = {
      total: saleItems.length,
      totalQuantity: saleItems.reduce((sum, item) => sum + item.quantity, 0),
      totalRevenue: saleItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0),
      totalCost: saleItems.reduce((sum, item) => sum + (parseFloat(item.cost_price) * item.quantity), 0),
    };
    totalProfit = stats.totalRevenue - stats.totalCost;
    profitMargin = (totalProfit / stats.totalRevenue) * 100;
  }

  if (isLoading && saleItems.length === 0) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Items</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCashier ? 'View sold items' : 'Track all sold items and profitability'}
          </p>
        </div>
        <button
          onClick={fetchSaleItems}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Summary - HIDDEN FOR CASHIER */}
      {permissions.canViewAnalytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiBox className="text-blue-600" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalQuantity}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-green-600" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">
                    TZS {stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-purple-600" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Profit</p>
                  <p className="text-2xl font-bold text-amber-600">
                    TZS {totalProfit.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="text-amber-600" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Overall Profit Margin</p>
                <p className="text-3xl font-bold">{profitMargin.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Profit</p>
                <p className="text-xl font-bold">TZS {totalProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cashier Simple Info */}
      {isCashier && (
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Viewing all sales items. Financial details are restricted.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or item ID..."
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
            onClick={fetchSaleItems}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-blue-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Price</th>
                {permissions.canViewProfit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sale ID</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={permissions.canViewProfit ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    No sale items found
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const profit = parseFloat(item.total_price) - (parseFloat(item.cost_price) * item.quantity);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-600">{formatCurrency(item.unit_price)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(item.total_price)}</span>
                      </td>
                      {permissions.canViewProfit && (
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            TZS {profit.toLocaleString()}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">#{item.sale}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} ({filteredItems.length} items)
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

      <ViewSaleItemModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        saleItem={selectedItem}
        canViewProfit={permissions.canViewProfit}
      />
    </div>
  );
}