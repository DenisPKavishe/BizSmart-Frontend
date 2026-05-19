// components/dashboard/PerformanceMetrics.tsx
'use client';

import { FiTrendingUp, FiTrendingDown, FiTarget, FiAward } from 'react-icons/fi';

interface Metric {
  label: string;
  value: string | number;
  target?: string | number;
  change?: number;
  icon: React.ReactNode;
}

interface PerformanceMetricsProps {
  metrics: Metric[];
  isLoading?: boolean;
}

export function PerformanceMetrics({ metrics, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FiTarget className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  {metric.icon}
                </div>
                <span className="text-sm text-gray-600">{metric.label}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                {metric.change !== undefined && (
                  <span className={`ml-2 text-xs flex items-center gap-0.5 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                    {Math.abs(metric.change)}%
                  </span>
                )}
              </div>
            </div>
            {metric.target && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to target</span>
                  <span>{metric.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min((parseFloat(String(metric.value)) / parseFloat(String(metric.target))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}