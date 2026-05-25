// app/(dashboard)/inventory/stock-movements/page.tsx - COMPLETE STOCK MOVEMENTS PAGE

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPackage,
  FiArrowDown,
  FiArrowUp,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiX,
  FiEye,
} from 'react-icons/fi';
import { FaBoxOpen, FaMoneyBillWave, FaBuilding, FaChartLine } from 'react-icons/fa';

interface StockMovement {
  id: number;
  product_name: string;
  movement_type_display: string;
  quantity: number;
  movement_type: string;
  unit_cost: string;
  total_cost: string;
  reference_id: string;
  reference_type: string;
  notes: string;
  previous_quantity: number;
  new_quantity: number;
  created_at: string;
  business: number;
  product: number;
  created_by: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
}

const movementColors: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
};

const movementIcons: Record<string, any> = {
  IN: FiArrowDown,
  OUT: FiArrowUp,
};

// View Movement Modal
function ViewMovementModal({ isOpen, onClose, movement }: any) {
  if (!isOpen || !movement) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const MovementIcon = movementIcons[movement.movement_type] || FiPackage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Stock Movement Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${movementColors[movement.movement_type]}`}>
                <MovementIcon size={14} />
                <span className="text-sm font-medium">{movement.movement_type_display}</span>
              </div>
              <p className="text-sm text-gray-500">Movement ID: {movement.id}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FaBoxOpen size={16} /> Product Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Product Name</p>
                <p className="text-sm font-medium text-gray-900">{movement.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product ID</p>
                <p className="text-sm text-gray-900">{movement.product}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiPackage size={16} /> Quantity Details
            </h4>
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Previous Quantity</p>
                <p className="text-sm font-medium text-gray-900">{movement.previous_quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Movement Quantity</p>
                <p className={`text-sm font-bold ${movement.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {movement.movement_type === 'IN' ? '+' : '-'}{movement.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">New Quantity</p>
                <p className="text-sm font-medium text-gray-900">{movement.new_quantity}</p>
              </div>
            </div>
          </div>

          {movement.unit_cost && parseFloat(movement.unit_cost) > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiDollarSign size={16} /> Financial Details
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Unit Cost</p>
                  <p className="text-sm text-gray-900">${parseFloat(movement.unit_cost).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-sm text-gray-900">${parseFloat(movement.total_cost).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {movement.reference_id && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFileText size={16} /> Reference Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Reference Type</p>
                  <p className="text-sm text-gray-900">{movement.reference_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reference ID</p>
                  <p className="text-sm text-gray-900">{movement.reference_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {movement.notes && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFileText size={16} /> Notes
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{movement.notes}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiCalendar size={16} /> System Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm text-gray-900">{formatDate(movement.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="text-sm text-gray-900">User ID: {movement.created_by}</p>
              </div>
            </div>
          </div>
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

export default function StockMovementsPage() {
  const { user } = useAuthStore();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [movementsRes, productsRes] = await Promise.all([
        inventoryApi.getStockMovements(),
        inventoryApi.getProducts(),
      ]);
      
      setMovements(movementsRes.data.results || movementsRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  const openViewModal = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setShowViewModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const resetFilters = () => {
    setMovementTypeFilter('all');
    setProductFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getMovementBadge = (type: string, display: string) => {
    const Icon = movementIcons[type] || FiPackage;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${movementColors[type]}`}>
        <Icon size={12} />
        {display}
      </span>
    );
  };

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = movementTypeFilter === 'all' || movement.movement_type === movementTypeFilter;
    const matchesProduct = productFilter === 'all' || movement.product === parseInt(productFilter);
    return matchesSearch && matchesType && matchesProduct;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = {
    total: movements.length,
    totalIn: movements.filter(m => m.movement_type === 'IN').length,
    totalOut: movements.filter(m => m.movement_type === 'OUT').length,
    totalValue: movements.reduce((sum, m) => sum + parseFloat(m.total_cost || '0'), 0),
  };

  if (isLoading && movements.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-sm text-gray-500 mt-1">Track all inventory movements</p>
        </div>
        <button
          onClick={fetchData}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Movements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock In</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalIn}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiArrowDown className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock Out</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalOut}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiArrowUp className="text-red-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.totalValue.toFixed(0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-purple-600" size={20} />
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
              placeholder="Search by product name or reference ID..."
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
              <label className="block text-sm text-gray-600 mb-1">Movement Type</label>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.current_stock})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{movement.product_name}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {movement.product}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getMovementBadge(movement.movement_type, movement.movement_type_display)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-semibold ${movement.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.movement_type === 'IN' ? '+' : '-'}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {movement.unit_cost ? `$${parseFloat(movement.unit_cost).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {movement.total_cost ? `$${parseFloat(movement.total_cost).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {movement.reference_id ? (
                        <div>
                          <p className="text-sm text-gray-600">{movement.reference_id}</p>
                          <p className="text-xs text-gray-400">{movement.reference_type || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openViewModal(movement)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
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
              Page {currentPage} of {totalPages} ({filteredMovements.length} movements)
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

      {/* View Movement Modal */}
      <ViewMovementModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
      />
    </div>
  );
}