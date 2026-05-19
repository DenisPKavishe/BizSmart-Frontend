// app/(dashboard)/inventory/stock/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiPackage,
  FiAlertCircle,
  FiCheck,
  FiX,
} from 'react-icons/fi';

interface Product {
  id: number;
  name: string;
  sku: string;
  buying_price: number;
  selling_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  unit: string;
  is_low_stock: boolean;
}

export default function StockManagementPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryApi.getProducts();
      const productsData = response.data.results || response.data;
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQuantity(0);
    setAdjustType('in');
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    if (adjustQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      if (adjustType === 'in') {
        await inventoryApi.stockIn(
          selectedProduct.id,
          adjustQuantity,
          selectedProduct.buying_price,
          adjustReason || 'Stock adjustment'
        );
        toast.success(`Added ${adjustQuantity} ${selectedProduct.unit}(s) to ${selectedProduct.name}`);
      } else {
        await inventoryApi.stockOut(
          selectedProduct.id,
          adjustQuantity,
          'adjustment',
          adjustReason || 'Stock adjustment'
        );
        toast.success(`Removed ${adjustQuantity} ${selectedProduct.unit}(s) from ${selectedProduct.name}`);
      }
      setShowAdjustModal(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'TZS 0';
    return `TZS ${value.toLocaleString()}`;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = showLowStockOnly ? product.is_low_stock : true;
    return matchesSearch && matchesLowStock;
  });

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.quantity_on_hand * p.buying_price), 0);
  const lowStockCount = products.filter(p => p.is_low_stock).length;
  const outOfStockCount = products.filter(p => p.quantity_on_hand === 0).length;

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and adjust inventory levels</p>
        </div>
        <button
          onClick={fetchProducts}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showLowStockOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiAlertCircle size={16} />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buying Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Level</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockPercentage = Math.min((product.quantity_on_hand / product.reorder_level) * 100, 100);
                  const isCritical = product.quantity_on_hand === 0;
                  const isLow = product.is_low_stock && !isCritical;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                            <FiPackage className="text-brand-600" size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{formatCurrency(product.buying_price)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(product.selling_price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                              {product.quantity_on_hand}
                            </span>
                            <span className="text-xs text-gray-400">/ {product.reorder_level}</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCritical ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                        ) : isLow ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Low Stock</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openAdjustModal(product)}
                          className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Adjust Stock</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-xs text-gray-400">SKU: {selectedProduct.sku}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{selectedProduct.quantity_on_hand} {selectedProduct.unit}(s)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAdjustType('in')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                      adjustType === 'in'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiPlus size={16} />
                    Add Stock
                  </button>
                  <button
                    onClick={() => setAdjustType('out')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                      adjustType === 'out'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiMinus size={16} />
                    Remove Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to {adjustType === 'in' ? 'Add' : 'Remove'}
                </label>
                <input
                  type="number"
                  value={adjustQuantity || ''}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Physical count, Damaged items, Return from customer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAdjustStock}
                  disabled={isSubmitting || adjustQuantity <= 0}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Adjustment'}
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}