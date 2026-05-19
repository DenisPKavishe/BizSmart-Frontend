// components/dashboard/CategoryChart.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DEFAULT_DATA = [
  { name: 'No Data', value: 1, color: '#E5E7EB' },
];

const COLORS = ['#0077C0', '#00A896', '#00B464', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface CategoryChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  const hasData = data && data.length > 0 && data[0].value > 0;
  const chartData = hasData ? data : DEFAULT_DATA;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && hasData) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">TZS {payload[0].value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales by Category</h3>
        <p className="text-sm text-gray-500 mt-1">Revenue distribution across categories</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {!hasData && (
        <div className="text-center mt-4 text-sm text-gray-500">
          No category data available. Add transactions to see insights.
        </div>
      )}

      {hasData && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total Sales</span>
            <span className="text-xl font-bold text-gray-900">TZS {total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}