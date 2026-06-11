// app/(dashboard)/inventory/categories/page.tsx
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
  FiGrid,
  FiX,
  FiSave,
  FiRefreshCw,
  FiAlertTriangle,
  FiPackage,
  FiCalendar,
  FiTag,
} from 'react-icons/fi';

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryApi.getCategories();
      const categoriesData = response.data.results || response.data;
      
      const productsResponse = await inventoryApi.getProducts();
      const products = productsResponse.data.results || productsResponse.data;
      
      const categoriesWithCount = categoriesData.map((cat: Category) => ({
        ...cat,
        product_count: products.filter((p: any) => p.category === cat.id).length,
      }));
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
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
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowModal(true);
  };

  const openDeleteModal = (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      toast.error(`Cannot delete "${category.name}" because it has ${category.product_count} products.`);
      return;
    }
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    try {
      await inventoryApi.deleteCategory(categoryToDelete.id);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await inventoryApi.updateCategory(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await inventoryApi.createCategory(formData);
        toast.success('Category created successfully');
      }

      setShowModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
        >
          <FiPlus size={18} />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={fetchCategories}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <FiTag className="text-brand-600" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-brand-600">
                {categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiPackage className="text-green-600" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Categories with Products</p>
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(cat => (cat.product_count || 0) > 0).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FiGrid className="text-purple-600" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid - Responsive Cards with Full Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            <FiGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No categories found</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-brand-600 hover:text-brand-700"
            >
              Create your first category →
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const productCount = category.product_count || 0;
            const countColor = getProductCountColor(productCount);
            
            return (
              <div
                key={category.id}
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
                        <FiGrid className={`${productCount > 0 ? 'text-brand-600' : 'text-gray-400'}`} size={18} />
                      </div>
                      <h3 className="font-semibold text-gray-900 break-words">{category.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(category)}
                        className={`p-1.5 rounded-lg transition ${
                          productCount > 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={productCount > 0 ? 'Cannot delete category with products' : 'Delete'}
                        disabled={productCount > 0}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description - full text without truncation */}
                  {category.description && (
                    <p className="text-sm text-gray-500 mb-3 break-words whitespace-normal">
                      {category.description}
                    </p>
                  )}

                  {/* Stats badges */}
                  <div className="space-y-2">
                    {/* Product count badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FiPackage size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Products</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${countColor}`}>
                        <span>{productCount}</span>
                      </div>
                    </div>

                    {/* Created date - always show */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Created</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {new Date(category.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Empty state message for categories with no products */}
                  {productCount === 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">No products in this category yet</p>
                    </div>
                  )}

                  {/* Quick stats for categories with many products */}
                  {productCount >= 10 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Popularity</span>
                        <div className="flex gap-0.5">
                          {[...Array(Math.min(5, Math.ceil(productCount / 10)))].map((_, i) => (
                            <div key={i} className="w-4 h-1.5 bg-brand-400 rounded-full"></div>
                          ))}
                          {[...Array(5 - Math.min(5, Math.ceil(productCount / 10)))].map((_, i) => (
                            <div key={i} className="w-4 h-1.5 bg-gray-200 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Electronics, Clothing, Food"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Brief description of this category"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
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
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="text-red-600" size={18} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
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
                Are you sure you want to delete the category?
              </p>
              <p className="font-semibold text-gray-900 mb-4 break-words">
                "{categoryToDelete.name}"
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