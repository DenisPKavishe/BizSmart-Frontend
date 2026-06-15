// app/(dashboard)/inventory/dashboard/page.tsx - FIXED VERSION

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, inventoryApi, salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiAlertCircle,
  FiUsers,
  FiRefreshCw,
  FiDownload,
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiArrowRight,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
  FiCalendar,
  FiShoppingCart,
  FiAward,
  FiStar,
  FiAlertTriangle,
  FiBox,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== INTERFACES ====================
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  selling_price: number;
  buying_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  unit: string;
  category_name?: string;
  supplier_name?: string;
  is_active: boolean;
  total_investment: number;
}

interface StockMovement {
  id: number;
  product_name: string;
  quantity: number;
  movement_type: string;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
}

interface CategoryStock {
  name: string;
  value: number;
  quantity: number;
}

interface SlowMovingProduct {
  id: number;
  name: string;
  sku: string;
  quantity_on_hand: number;
  investment: number;
}

// ==================== HELPER FUNCTIONS ====================

const toNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: any): string => {
  const num = toNumber(value);
  if (num === 0) return 'TZS 0';
  return `TZS ${num.toLocaleString()}`;
};

const formatNumber = (value: any): string => {
  const num = toNumber(value);
  return num.toLocaleString();
};

const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ==================== CUSTOM TOOLTIP ====================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm py-1">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">
              {item.name === 'Quantity' || item.name === 'Products'
                ? formatNumber(item.value)
                : formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== COMPONENTS ====================

function InventoryMetricCard({ title, value, change, icon: Icon, isNegative, subtext, alert }: any) {
  const isPositive = toNumber(change) > 0;
  const isNegativeChange = toNumber(change) < 0;
  
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          {change !== undefined && change !== null && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={14} /> : isNegativeChange ? <FiArrowDown size={14} /> : null}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
          {alert && alert > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
              <FiAlertCircle size={12} />
              <span>{alert} items low on stock</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isNegative ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} group-hover:scale-110 transition`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="text-blue-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function LowStockItem({ product }: { product: Product }) {
  return (
    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
          <FiPackage size={18} />
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-red-600 text-sm">Stock: {product.quantity_on_hand}</p>
        <p className="text-xs text-gray-400">Reorder at: {product.reorder_level}</p>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function InventoryDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  
  // Inventory Data
  const [products, setProducts] = useState<Product[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  
  // Top Products
  const [topSellingProducts, setTopSellingProducts] = useState<TopProduct[]>([]);
  const [slowMovingProducts, setSlowMovingProducts] = useState<SlowMovingProduct[]>([]);
  
  // Stock Movements
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  
  // Category Distribution
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryStock[]>([]);
  
  // Stock Turnover
  const [stockTurnover, setStockTurnover] = useState(0);

  // Fetch available months
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchInventoryData();
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const res = await biApi.getAvailableMonths();
      setAvailableMonths(res.data.months || []);
      setSelectedMonth(res.data.current_month || '');
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const fetchInventoryData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch all products
      const productsRes = await inventoryApi.getProducts();
      const productsList = productsRes.data.results || productsRes.data || [];
      setProducts(productsList);
      
      // Calculate inventory metrics
      let totalValue = 0;
      let lowStock = 0;
      let outOfStock = 0;
      const lowStockItems: Product[] = [];
      const outOfStockItems: Product[] = [];
      
      productsList.forEach((product: Product) => {
        const investment = toNumber(product.total_investment);
        totalValue += investment;
        
        if (product.quantity_on_hand <= 0) {
          outOfStock++;
          outOfStockItems.push(product);
        } else if (product.quantity_on_hand <= product.reorder_level) {
          lowStock++;
          lowStockItems.push(product);
        }
      });
      
      setTotalStockValue(totalValue);
      setTotalProducts(productsList.length);
      setLowStockCount(lowStock);
      setOutOfStockCount(outOfStock);
      setLowStockProducts(lowStockItems);
      setOutOfStockProducts(outOfStockItems);
      
      // Fetch top selling products
      const topProductsRes = await biApi.getTopProducts({ limit: 10 });
      setTopSellingProducts(topProductsRes.data.top_products || []);
      
      // Fetch slow moving products - Fixed: Remove parameters
      try {
        const slowProductsRes = await inventoryApi.getSlowMovingProducts();
        setSlowMovingProducts(slowProductsRes.data.slow_moving_products || []);
      } catch (err) {
        console.error('Failed to fetch slow moving products:', err);
        setSlowMovingProducts([]);
      }
      
      // Fetch stock movements for the selected month
      try {
        const movementsRes = await inventoryApi.getStockMovements({
          start_date: startDateStr,
          end_date: endDateStr,
          page_size: 100
        });
        const movementsList = movementsRes.data.results || movementsRes.data || [];
        setRecentMovements(movementsList.slice(0, 10));
        
        // Calculate stock turnover (COGS / Average Inventory)
        const cogs = movementsList
          .filter((m: StockMovement) => m.movement_type === 'OUT' || m.movement_type === 'DAMAGED')
          .reduce((sum: number, m: StockMovement) => sum + toNumber(m.total_cost), 0);
        const avgInventory = totalValue / (productsList.length || 1);
        const turnover = avgInventory > 0 ? cogs / avgInventory : 0;
        setStockTurnover(turnover);
      } catch (err) {
        console.error('Failed to fetch stock movements:', err);
        setRecentMovements([]);
      }
      
      // Calculate category distribution
      const categoryMap: Record<string, { value: number; quantity: number }> = {};
      productsList.forEach((product: Product) => {
        const category = product.category_name || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = { value: 0, quantity: 0 };
        }
        categoryMap[category].value += toNumber(product.total_investment);
        categoryMap[category].quantity += product.quantity_on_hand;
      });
      setCategoryDistribution(Object.entries(categoryMap).map(([name, data]) => ({
        name,
        value: data.value,
        quantity: data.quantity
      })));
      
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const getMonthDisplay = (monthValue: string) => {
    if (!monthValue) return '';
    const [year, month] = monthValue.split('-');
    return `${fullMonthNames[parseInt(month) - 1]} ${year}`;
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, product performance, and inventory value</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {availableMonths.length > 0 && (
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month: any) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchInventoryData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={18} />
          </button>
          <Link
            href="/inventory/products"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPackage size={16} />
            Manage Products
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <InventoryMetricCard
          title="Total Stock Value"
          value={formatCurrency(totalStockValue)}
          change={5.2}
          icon={FiDollarSign}
          isNegative={false}
          subtext="Based on average cost"
        />
        <InventoryMetricCard
          title="Total Products"
          value={formatNumber(totalProducts)}
          change={3.1}
          icon={FiBox}
          isNegative={false}
          subtext="Active products"
        />
        <InventoryMetricCard
          title="Stock Turnover"
          value={stockTurnover.toFixed(1)}
          change={-0.5}
          icon={FiTrendingUp}
          isNegative={stockTurnover < 2}
          subtext="Times inventory sold per period"
          alert={lowStockCount}
        />
        <InventoryMetricCard
          title="Low Stock Alerts"
          value={formatNumber(lowStockCount)}
          change={12.5}
          icon={FiAlertTriangle}
          isNegative={true}
          subtext={`${outOfStockCount} out of stock`}
        />
      </div>

      {/* Alerts Section */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" size={14} />
            Stock Alerts
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lowStockProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-4 py-2 bg-red-50 border-b border-red-200">
                  <h3 className="font-medium text-red-700 text-sm">Low Stock ({lowStockProducts.length})</h3>
                </div>
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <LowStockItem key={product.id} product={product} />
                  ))}
                  {lowStockProducts.length > 5 && (
                    <p className="text-xs text-center text-gray-400 pt-2">
                      +{lowStockProducts.length - 5} more items
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {outOfStockProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-4 py-2 bg-red-50 border-b border-red-200">
                  <h3 className="font-medium text-red-700 text-sm">Out of Stock ({outOfStockProducts.length})</h3>
                </div>
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {outOfStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600 text-sm">Stock: 0</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Distribution & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <Section title="Stock by Category" icon={FiPieChart}>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No category data available</div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryDistribution.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{cat.name}</p>
                <p className="text-sm font-semibold text-blue-600">{formatCurrency(cat.value)}</p>
                <p className="text-xs text-gray-400">{formatNumber(cat.quantity)} units</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Top Selling Products */}
        <Section title="Top Selling Products" icon={FiStar}>
          {topSellingProducts.length > 0 ? (
            <div className="space-y-3">
              {topSellingProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-400">{product.quantity_sold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No sales data available</div>
          )}
        </Section>
      </div>

      {/* Slow Moving Products & Stock Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Slow Moving Products */}
        <Section title="Slow Moving Products" icon={FiClock}>
          {slowMovingProducts.length > 0 ? (
            <div className="space-y-3">
              {slowMovingProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-700 text-sm">{formatNumber(product.quantity_on_hand)} in stock</p>
                    <p className="text-xs text-gray-400">Investment: {formatCurrency(product.investment)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No slow moving products</div>
          )}
        </Section>

        {/* Stock Turnover Chart */}
        <Section title="Stock Turnover Analysis" icon={FiTrendingUp}>
          <div className="text-center mb-4">
            <div className={`text-4xl font-bold ${stockTurnover >= 2 ? 'text-green-600' : 'text-red-600'}`}>
              {stockTurnover.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Inventory turnover rate</p>
            <p className="text-xs text-gray-400 mt-2">
              {stockTurnover >= 2 
                ? '✓ Healthy turnover - products selling well' 
                : '⚠️ Low turnover - consider promotions or price adjustments'}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${stockTurnover >= 2 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min((stockTurnover / 5) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Poor (0)</span>
            <span>Good (2-4)</span>
            <span>Excellent (5+)</span>
          </div>
        </Section>
      </div>

      {/* Recent Stock Movements */}
      <Section title="Recent Stock Movements" icon={FiActivity}>
        {recentMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{movement.product_name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        movement.movement_type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {movement.movement_type === 'IN' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      <span className={movement.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                        {movement.movement_type === 'IN' ? '+' : '-'}{formatNumber(movement.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(movement.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No stock movements recorded</div>
        )}
      </Section>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span>Data as of {getMonthDisplay(selectedMonth)}</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/inventory/products" className="hover:text-blue-600">Manage Inventory →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}