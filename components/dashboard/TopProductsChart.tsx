// components/dashboard/TopProductsChart.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TopProduct {
  name: string;
  revenue: number;
  quantity_sold?: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
}

const COLORS = ['#0077C0', '#00A896', '#00B464', '#F59E0B', '#EF4444', '#8B5CF6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const total = payload[0].payload.totalRevenue;
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

// Custom label renderer to avoid percent issues
const renderCustomLabel = ({ name, value, total }: any) => {
  const percentage = ((value / total) * 100).toFixed(0);
  return `${percentage}%`;
};

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
          <p className="text-sm text-gray-500 mt-1">Best performing products by revenue</p>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No product data available
        </div>
      </div>
    );
  }

  // Sort and take top 5, group rest as "Others"
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top5 = sorted.slice(0, 5);
  const others = sorted.slice(5);
  
  let chartData = [...top5];
  if (others.length > 0) {
    const othersRevenue = others.reduce((sum, p) => sum + p.revenue, 0);
    chartData.push({ name: 'Others', revenue: othersRevenue });
  }
  
  const total = chartData.reduce((sum, item) => sum + item.revenue, 0);
  
  // Add total to each item for percentage calculation
  chartData = chartData.map(item => ({ ...item, totalRevenue: total }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
        <p className="text-sm text-gray-500 mt-1">Best performing products by revenue</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        <ResponsiveContainer width="100%" height={280} className="lg:w-1/2">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="revenue"
              labelLine={false}
              label={({ name, percent }) => {
                const percentage = percent ? (percent * 100).toFixed(0) : '0';
                return `${percentage}%`;
              }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="lg:w-1/2 space-y-2">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">TZS {total.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {((item.revenue / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}