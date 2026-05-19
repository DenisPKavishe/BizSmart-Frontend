// components/dashboard/QuickActions.tsx
'use client';

import { FiPlus, FiSearch, FiUsers, FiFileText, FiShoppingCart, FiBarChart2 } from 'react-icons/fi';

interface Action {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const actions: Action[] = [
  { id: 'new-sale', name: 'New Sale', icon: <FiShoppingCart size={20} />, href: '/sales/pos', color: 'brand' },
  { id: 'add-product', name: 'Add Product', icon: <FiPlus size={20} />, href: '/inventory/products/add', color: 'green' },
  { id: 'add-customer', name: 'Add Customer', icon: <FiUsers size={20} />, href: '/sales/customers/add', color: 'blue' },
  { id: 'create-invoice', name: 'Create Invoice', icon: <FiFileText size={20} />, href: '/financials/invoices/create', color: 'purple' },
  { id: 'check-stock', name: 'Check Stock', icon: <FiSearch size={20} />, href: '/inventory/products', color: 'orange' },
  { id: 'view-reports', name: 'View Reports', icon: <FiBarChart2 size={20} />, href: '/reports', color: 'teal' },
];

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
}

const colorClasses = {
  brand: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
  green: 'bg-green-50 text-green-600 hover:bg-green-100',
  blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
};

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500 mt-1">Frequently used operations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition ${colorClasses[action.color as keyof typeof colorClasses]}`}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}