// app/(dashboard)/inventory/suppliers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiTruck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiX,
  FiRefreshCw,
  FiUser,
  FiAlertTriangle,
  FiPackage,
  FiCalendar,
} from 'react-icons/fi';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  created_at: string;
  product_count?: number;
}

export default function SuppliersPage() {
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryApi.getSuppliers();
      const suppliersData = response.data.results || response.data;
      
      const productsResponse = await inventoryApi.getProducts();
      const products = productsResponse.data.results || productsResponse.data;
      
      const suppliersWithCount = suppliersData.map((supplier: Supplier) => ({
        ...supplier,
        product_count: products.filter((p: any) => p.supplier === supplier.id).length,
      }));
      
      setSuppliers(suppliersWithCount);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', tax_id: '' });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      tax_id: supplier.tax_id || '',
    });
    setShowModal(true);
  };

  const openDeleteModal = (supplier: Supplier) => {
    if (supplier.product_count && supplier.product_count > 0) {
      toast.error(`Cannot delete "${supplier.name}" because it has ${supplier.product_count} products.`);
      return;
    }
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    setIsDeleting(true);
    try {
      await inventoryApi.deleteSupplier(supplierToDelete.id);
      toast.success('Supplier deleted successfully');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSupplierToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingSupplier) {
        await inventoryApi.updateSupplier(editingSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await inventoryApi.createSupplier(formData);
        toast.success('Supplier created successfully');
      }

      setShowModal(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Failed to save supplier:', error);
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const totalProducts = suppliers.reduce((sum, s) => sum + (s.product_count || 0), 0);

  const getProductCountColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    if (count < 5) return 'bg-blue-100 text-blue-700';
    if (count < 20) return 'bg-green-100 text-green-700';
    return 'bg-purple-100 text-purple-700';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product suppliers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
        >
          <FiPlus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact person, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={fetchSuppliers}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
            </div>
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <FiTruck className="text-brand-600" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-brand-600">{totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiPackage className="text-green-600" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => (s.product_count || 0) > 0).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FiUser className="text-purple-600" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Grid - Responsive Cards with Full Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            <FiTruck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No suppliers found</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-brand-600 hover:text-brand-700"
            >
              Add your first supplier →
            </button>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const productCount = supplier.product_count || 0;
            const countColor = getProductCountColor(productCount);
            
            return (
              <div
                key={supplier.id}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Color bar based on product count */}
                <div className={`h-1 w-full ${productCount > 0 ? 'bg-brand-500' : 'bg-gray-300'}`}></div>
                
                <div className="p-4">
                  {/* Header with icon and actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-105 flex-shrink-0 ${
                        productCount > 0 ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <FiTruck className={`${productCount > 0 ? 'text-brand-600' : 'text-gray-400'}`} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 break-words">{supplier.name}</h3>
                        {supplier.contact_person && (
                          <div className="flex items-center gap-1 mt-1">
                            <FiUser className="text-gray-400" size={12} />
                            <p className="text-xs text-gray-500 break-words">{supplier.contact_person}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(supplier)}
                        className={`p-1.5 rounded-lg transition ${
                          productCount > 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={productCount > 0 ? 'Cannot delete supplier with products' : 'Delete'}
                        disabled={productCount > 0}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 mt-3">
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 break-words">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <FiMail size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 break-words">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <FiMapPin size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 break-words">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.tax_id && (
                      <div className="flex items-center gap-2">
                        <FiPackage size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">TIN: {supplier.tax_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FiPackage size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Products</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${countColor}`}>
                        <span>{productCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Since</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatDate(supplier.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Empty state message for suppliers with no products */}
                  {productCount === 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">No products from this supplier yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Supplier Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Natural Ingredients Ltd"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 0712345678"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="supplier@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Supplier address"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID / TIN (Optional)
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  placeholder="e.g., 123-456-789"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Create Supplier')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && supplierToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="text-red-600" size={18} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Supplier</h3>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this supplier?
              </p>
              <p className="font-semibold text-gray-900 mb-4 break-words">
                "{supplierToDelete.name}"
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
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