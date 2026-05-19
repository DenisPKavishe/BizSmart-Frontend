// components/dashboard/ActivityTimeline.tsx
'use client';

import { FiClock, FiCheckCircle, FiAlertCircle, FiShoppingCart, FiPackage, FiUsers } from 'react-icons/fi';

interface Activity {
  id: number;
  type: 'sale' | 'stock' | 'customer' | 'payment';
  title: string;
  description: string;
  amount?: number;
  time: string;
  status: 'success' | 'pending' | 'warning';
}

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading?: boolean;
}

const activityIcons = {
  sale: <FiShoppingCart className="w-4 h-4" />,
  stock: <FiPackage className="w-4 h-4" />,
  customer: <FiUsers className="w-4 h-4" />,
  payment: <FiCheckCircle className="w-4 h-4" />,
};

const activityColors = {
  sale: 'bg-blue-100 text-blue-600',
  stock: 'bg-orange-100 text-orange-600',
  customer: 'bg-green-100 text-green-600',
  payment: 'bg-purple-100 text-purple-600',
};

const statusColors = {
  success: 'text-green-600',
  pending: 'text-yellow-600',
  warning: 'text-red-600',
};

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="relative flex gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
                  {activityIcons[activity.type]}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 break-words">{activity.description}</p>
                  {activity.amount && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      TZS {activity.amount.toLocaleString()}
                    </p>
                  )}
                  <div className={`mt-1 text-xs ${statusColors[activity.status]}`}>
                    {activity.status === 'success' && '✓ Completed'}
                    {activity.status === 'pending' && '⏳ Pending'}
                    {activity.status === 'warning' && '⚠️ Action needed'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}