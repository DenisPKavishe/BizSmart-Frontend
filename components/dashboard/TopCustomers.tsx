// components/dashboard/TopCustomers.tsx
'use client';

import { FiAward, FiStar } from 'react-icons/fi';
import { FaTrophy, FaMedal } from 'react-icons/fa';

interface Customer {
  id: number;
  name: string;
  email: string;
  total_spent: number;
  total_visits: number;
}

interface TopCustomersProps {
  customers: Customer[];
  isLoading?: boolean;
  onViewCustomer?: (customerId: number) => void;
}

const rankIcons = {
  1: <FaTrophy className="w-5 h-5 text-yellow-500" />,
  2: <FaMedal className="w-5 h-5 text-gray-400" />,
  3: <FaMedal className="w-5 h-5 text-amber-600" />,
};

export function TopCustomers({ customers, isLoading, onViewCustomer }: TopCustomersProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          <FiAward className="w-5 h-5 text-brand-500" />
        </div>
        <div className="text-center py-6">
          <p className="text-gray-500">No customer data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
        <FiAward className="w-5 h-5 text-brand-500" />
      </div>

      <div className="space-y-4">
        {customers.map((customer, index) => (
          <div
            key={customer.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            onClick={() => onViewCustomer?.(customer.id)}
          >
            <div className="w-8 text-center">
              {index < 3 ? (
                rankIcons[index + 1 as keyof typeof rankIcons]
              ) : (
                <span className="text-sm text-gray-400">#{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
              <p className="text-xs text-gray-500 truncate">{customer.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">TZS {customer.total_spent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{customer.total_visits} visits</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium">
        View All Customers →
      </button>
    </div>
  );
}