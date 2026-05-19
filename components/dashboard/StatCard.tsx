// components/dashboard/StatCard.tsx
'use client';

import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-100', text: 'text-brand-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
};

const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    if (value >= 1000000) {
      return `TZS ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `TZS ${(value / 1000).toFixed(0)}k`;
    }
    return `TZS ${value.toLocaleString()}`;
  }
  return value;
};

export function StatCard({ title, value, change, icon, color, isLoading }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const colors = colorMap[color] || colorMap.brand;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-7 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate" title={title}>
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 break-words">
            {formatValue(value)}
          </p>
          {change !== undefined && change !== 0 && (
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive && <FiTrendingUp size={12} className="sm:w-4 sm:h-4" />}
              {isNegative && <FiTrendingDown size={12} className="sm:w-4 sm:h-4" />}
              {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 ${colors.bg} rounded-lg shrink-0 ml-2`}>
          <div className={`${colors.text} sm:w-5 sm:h-5 w-4 h-4`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}