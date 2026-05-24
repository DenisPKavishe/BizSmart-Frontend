// app/(dashboard)/reports/page.tsx - FIXED VERSION

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, financialsApi, salesApi, inventoryApi, hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  FiEye,
  FiX,
  FiFileText,
  FiRefreshCw,
  FiDownload,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

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
  if (num >= 1000000) return `TZS ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `TZS ${(num / 1000).toFixed(0)}k`;
  return `TZS ${num.toLocaleString()}`;
};

const formatPercent = (value: any): string => {
  const num = toNumber(value);
  return `${num.toFixed(1)}%`;
};

// ==================== CUSTOM TOOLTIP ====================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== REPORT COMPONENTS ====================

function ProfitLossReport({ data, period }: { data: any; period: any }) {
  if (!data) return <div className="text-center py-8 text-gray-500">No data available</div>;
  
  const isNetProfitNegative = toNumber(data.profit?.net_profit) < 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200" id="pnl-report">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
        <p className="text-sm text-gray-500">{period?.start_date || 'N/A'} to {period?.end_date || 'N/A'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.income?.total)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses?.total)}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${isNetProfitNegative ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${isNetProfitNegative ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(data.profit?.net_profit)}
          </p>
          <p className="text-xs mt-1">Margin: {formatPercent(data.profit?.net_margin)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Income Sources</h3>
          <div className="space-y-2">
            {data.income?.breakdown?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm border-b pb-2">
                <span className="capitalize">{item.category?.replace('_', ' ')}</span>
                <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Expense Categories</h3>
          <div className="space-y-2">
            {data.expenses?.breakdown?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm border-b pb-2">
                <span className="capitalize">{item.category?.replace('_', ' ')}</span>
                <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function CashFlowReport({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-gray-500">No data available</div>;
  
  const isNegative = toNumber(data.current_balance) < 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cash Flow Forecast</h2>
        <p className="text-sm text-gray-500">30-day projection</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-xl p-4 text-center ${isNegative ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-500">Current Balance</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(data.current_balance)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">Avg Daily Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.avg_daily_income)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">Avg Daily Expense</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(data.avg_daily_expense)}</p>
        </div>
      </div>
      
      {data.forecast_30_days && data.forecast_30_days.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.forecast_30_days.slice(0, 30)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(v) => `TZS ${toNumber(v)/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="projected_balance" stroke={isNegative ? "#EF4444" : "#10B981"} fill={isNegative ? "#EF4444" : "#10B981"} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      
      {data.warning && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-800">
          Warning: {data.warning}
        </div>
      )}
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function TopProductsReport({ products }: { products: any[] }) {
  if (!products || products.length === 0) return <div className="text-center py-8 text-gray-500">No product data available</div>;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Top Products Report</h2>
        <p className="text-sm text-gray-500">Best selling items by revenue</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Qty Sold</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Revenue</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Profit</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-right">{toNumber(product.quantity_sold)}</td>
                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(product.revenue)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(product.profit)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(product.profit_margin)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 font-bold">Total</td>
              <td className="px-4 py-3 text-right font-bold text-green-600">
                {formatCurrency(products.reduce((sum, p) => sum + toNumber(p.revenue), 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-600">
                {formatCurrency(products.reduce((sum, p) => sum + toNumber(p.profit), 0))}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function TopCustomersReport({ customers }: { customers: any[] }) {
  if (!customers || customers.length === 0) return <div className="text-center py-8 text-gray-500">No customer data available</div>;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Top Customers Report</h2>
        <p className="text-sm text-gray-500">Highest spending customers</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total Spent</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Visits</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Avg Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(customer.total_spent)}</td>
                <td className="px-4 py-3 text-right">{toNumber(customer.total_visits)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(toNumber(customer.total_spent) / (toNumber(customer.total_visits) || 1))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 font-bold">Total</td>
              <td className="px-4 py-3 text-right font-bold text-green-600">
                {formatCurrency(customers.reduce((sum, c) => sum + toNumber(c.total_spent), 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold">
                {customers.reduce((sum, c) => sum + toNumber(c.total_visits), 0)}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function LowStockReport({ products }: { products: any[] }) {
  if (!products || products.length === 0) return <div className="text-center py-8 text-gray-500">No low stock items</div>;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Low Stock Report</h2>
        <p className="text-sm text-gray-500">Products needing reorder</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Current Stock</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Reorder Level</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Investment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-red-600">{toNumber(product.quantity_on_hand)}</span>
                </td>
                <td className="px-4 py-3 text-right">{toNumber(product.reorder_level)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(toNumber(product.total_investment))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function ReportsPage() {
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewElement, setPreviewElement] = useState<HTMLElement | null>(null);
  
  // Data states
  const [pnlData, setPnlData] = useState<any>(null);
  const [pnlPeriod, setPnlPeriod] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        pnlRes,
        cashFlowRes,
        topProductsRes,
        lowStockRes,
        customersRes,
      ] = await Promise.all([
        biApi.getProfitLoss().catch(() => ({ data: null })),
        financialsApi.getCashFlow().catch(() => ({ data: null })),
        biApi.getTopProducts().catch(() => ({ data: null })),
        inventoryApi.getLowStockProducts().catch(() => ({ data: null })),
        biApi.getCustomerInsights().catch(() => ({ data: null })),
      ]);

      if (pnlRes?.data) {
        setPnlData(pnlRes.data);
        setPnlPeriod(pnlRes.data.period);
      }
      if (cashFlowRes?.data) setCashFlowData(cashFlowRes.data);
      if (topProductsRes?.data?.top_products) setTopProducts(topProductsRes.data.top_products);
      if (lowStockRes?.data?.products) setLowStockProducts(lowStockRes.data.products);
      if (customersRes?.data?.top_customers) setTopCustomers(customersRes.data.top_customers);

    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async (elementId: string, title: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Cannot generate preview');
      return;
    }

    setIsExporting(true);
    setPreviewTitle(title);
    setPreviewElement(element);
    setShowPreview(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      setPreviewImage(imgData);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate preview');
      setShowPreview(false);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDownload = async () => {
    if (!previewElement || !previewImage) return;

    setIsExporting(true);
    toast.loading(`Downloading ${previewTitle}...`, { id: 'pdf-export' });

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const img = new Image();
      img.src = previewImage;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const imgWidth = 190;
      const imgHeightMM = (img.height * imgWidth) / img.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeightMM;
      let position = 0;
      
      pdf.addImage(previewImage, 'PNG', 10, position, imgWidth, imgHeightMM);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeightMM;
        pdf.addPage();
        pdf.addImage(previewImage, 'PNG', 10, position, imgWidth, imgHeightMM);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${previewTitle.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`${previewTitle} downloaded!`, { id: 'pdf-export' });
      setShowPreview(false);
      setPreviewImage('');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Failed to download ${previewTitle}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
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
          <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
          <p className="text-sm text-gray-500 mt-1">Preview and download business reports</p>
        </div>
        <button
          onClick={fetchAllData}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiRefreshCw size={16} />
          Refresh All
        </button>
      </div>

      {/* Report Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        {pnlData && (
          <button
            onClick={() => generatePreview('pnl-report', 'Profit-Loss-Report')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiEye size={16} />
            Preview P&L Report
          </button>
        )}
        {cashFlowData && (
          <button
            onClick={() => generatePreview('cashflow-report', 'Cash-Flow-Report')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiEye size={16} />
            Preview Cash Flow
          </button>
        )}
        {topProducts.length > 0 && (
          <button
            onClick={() => generatePreview('products-report', 'Top-Products-Report')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiEye size={16} />
            Preview Top Products
          </button>
        )}
        {topCustomers.length > 0 && (
          <button
            onClick={() => generatePreview('customers-report', 'Top-Customers-Report')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <FiEye size={16} />
            Preview Top Customers
          </button>
        )}
        {lowStockProducts.length > 0 && (
          <button
            onClick={() => generatePreview('lowstock-report', 'Low-Stock-Report')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FiEye size={16} />
            Preview Low Stock
          </button>
        )}
      </div>

      {/* Report Sections (Visible for capture) */}
      <div className="space-y-8">
        {pnlData && (
          <div id="pnl-report">
            <ProfitLossReport data={pnlData} period={pnlPeriod} />
          </div>
        )}
        
        {cashFlowData && (
          <div id="cashflow-report">
            <CashFlowReport data={cashFlowData} />
          </div>
        )}
        
        {topProducts.length > 0 && (
          <div id="products-report">
            <TopProductsReport products={topProducts} />
          </div>
        )}
        
        {topCustomers.length > 0 && (
          <div id="customers-report">
            <TopCustomersReport customers={topCustomers} />
          </div>
        )}
        
        {lowStockProducts.length > 0 && (
          <div id="lowstock-report">
            <LowStockReport products={lowStockProducts} />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Preview: {previewTitle.replace(/-/g, ' ')}</h3>
                <p className="text-xs text-gray-500">Review before downloading</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              {previewImage ? (
                <div className="flex justify-center">
                  <img src={previewImage} alt="Report Preview" className="max-w-full shadow-lg rounded-lg" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                disabled={isExporting || !previewImage}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiDownload size={16} />
                )}
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!pnlData && !cashFlowData && topProducts.length === 0 && topCustomers.length === 0 && lowStockProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FiFileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Reports Available</h3>
          <p className="text-gray-500 mt-2">Start adding transactions, products, and customers to generate reports.</p>
        </div>
      )}
    </div>
  );
}