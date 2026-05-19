// components/dashboard/LowStockAlert.tsx
'use client';

import { FiAlertCircle, FiPackage, FiChevronRight } from 'react-icons/fi';

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  quantity_on_hand: number;
  reorder_level: number;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  isLoading?: boolean;
  onViewProduct?: (productId: number) => void;
  onReorder?: (productId: number) => void;
}

export function LowStockAlert({ products, isLoading, onViewProduct, onReorder }: LowStockAlertProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <FiPackage className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-green-600 font-medium">All products are well stocked!</p>
          <p className="text-sm text-gray-500 mt-1">No items below reorder level.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <FiAlertCircle className="w-4 h-4 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
        <span className="ml-auto px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          {products.length} items
        </span>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const stockPercentage = (product.quantity_on_hand / product.reorder_level) * 100;
          const isCritical = product.quantity_on_hand === 0;
          const isLow = product.quantity_on_hand <= product.reorder_level / 2;

          return (
            <div
              key={product.id}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              onClick={() => onViewProduct?.(product.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder?.(product.id);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap ml-2"
                >
                  Reorder
                </button>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Stock Level</span>
                  <span className={isCritical ? 'text-red-600 font-medium' : isLow ? 'text-orange-600' : ''}>
                    {product.quantity_on_hand} / {product.reorder_level}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isCritical ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-yellow-500'}`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
        View All Inventory
        <FiChevronRight size={14} />
      </button>
    </div>
  );
}