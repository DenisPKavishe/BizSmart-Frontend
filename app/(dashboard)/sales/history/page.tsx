// app/(dashboard)/sales/history/page.tsx - COMPLETELY RESTRICTED FOR CASHIER

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiEye,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiX,
  FiPackage,
  FiRotateCcw,
  FiInfo,
  FiShield,
} from 'react-icons/fi';
import ProcessReturnModal from '@/components/sales/ProcessReturnModal';
import { getPagePermissions, getUserRole } from '@/lib/permissions';

interface SaleItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  returned_quantity?: number;
  is_fully_returned?: boolean;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_by: string;
  created_by_name?: string;
  items?: SaleItem[];
  has_returns?: boolean;
  total_returned_amount?: number;
}

export default function SalesHistoryPage() {
  const { user } = useAuthStore();
  const { isCashier, isManager } = getUserRole(user);
  const permissions = getPagePermissions(user);
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mySalesCount, setMySalesCount] = useState(0);
  
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

  useEffect(() => {
    fetchSales();
    fetchReturns();
  }, [currentPage, startDate, endDate, statusFilter, paymentMethodFilter]);

  const fetchReturns = async () => {
    try {
      const response = await salesApi.getReturns();
      const data = response.data;
      const rawData = data.results || data || [];
      
      const returnsData = rawData.map((item: any) => ({
        ...item,
        refund_amount: Number(item.refund_amount || 0),
        quantity_returned: Number(item.quantity_returned || 0),
      }));
      
      setReturns(returnsData);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    }
  };

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: 20,
      };
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status = statusFilter;
      if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
      
      // CRITICAL: For cashier, only fetch their own sales
      if (isCashier && user?.id) {
        params.created_by = user.id;
      }
      
      const response = await salesApi.getSales(params);
      const data = response.data;
      
      let salesData = data.results || data;
      
      // Convert numeric fields
      salesData = salesData.map((sale: any) => ({
        ...sale,
        subtotal: Number(sale.subtotal || 0),
        discount_amount: Number(sale.discount_amount || 0),
        total_amount: Number(sale.total_amount || 0),
        amount_paid: Number(sale.amount_paid || 0),
        change_amount: Number(sale.change_amount || 0),
      }));
      
      // Add return information
      const salesWithReturnInfo = salesData.map((sale: Sale) => {
        const saleReturns = returns.filter(r => r.sale === sale.id);
        
        const totalReturnedAmount = saleReturns.reduce((sum, r) => {
          const refundAmount = Number(r.refund_amount || 0);
          return sum + refundAmount;
        }, 0);
        
        const hasReturns = saleReturns.length > 0;
        
        const itemsWithReturnInfo = sale.items?.map(item => {
          const itemReturns = saleReturns.filter(r => r.sale_item === item.id);
          const returnedQuantity = itemReturns.reduce((sum, r) => {
            const qty = Number(r.quantity_returned || 0);
            return sum + qty;
          }, 0);
          return {
            ...item,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            total_price: Number(item.total_price || 0),
            returned_quantity: returnedQuantity,
            is_fully_returned: returnedQuantity >= Number(item.quantity || 0),
          };
        });
        
        return {
          ...sale,
          has_returns: hasReturns,
          total_returned_amount: totalReturnedAmount,
          items: itemsWithReturnInfo,
        };
      });
      
      setSales(salesWithReturnInfo);
      setTotalPages(Math.ceil((data.count || salesWithReturnInfo.length) / 20));
      
      // For cashier, only count their own sales
      if (isCashier) {
        setMySalesCount(data.count || salesWithReturnInfo.length);
      }
      
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to load sales history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSales();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setPaymentMethodFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const viewSaleDetails = async (saleId: number) => {
    try {
      const response = await salesApi.getSale(saleId);
      const saleData = response.data;
      
      const normalizedSaleData = {
        ...saleData,
        subtotal: Number(saleData.subtotal || 0),
        discount_amount: Number(saleData.discount_amount || 0),
        total_amount: Number(saleData.total_amount || 0),
        amount_paid: Number(saleData.amount_paid || 0),
        change_amount: Number(saleData.change_amount || 0),
      };
      
      const saleReturns = returns.filter(r => r.sale === saleId);
      const itemsWithReturnInfo = normalizedSaleData.items?.map((item: any) => {
        const itemReturns = saleReturns.filter(r => r.sale_item === item.id);
        const returnedQuantity = itemReturns.reduce((sum, r) => {
          const qty = Number(r.quantity_returned || 0);
          return sum + qty;
        }, 0);
        return {
          ...item,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          returned_quantity: returnedQuantity,
          is_fully_returned: returnedQuantity >= Number(item.quantity || 0),
        };
      });
      
      const totalReturnedAmount = saleReturns.reduce((sum, r) => {
        const refund = Number(r.refund_amount || 0);
        return sum + refund;
      }, 0);
      
      setSelectedSale({
        ...normalizedSaleData,
        has_returns: saleReturns.length > 0,
        total_returned_amount: totalReturnedAmount,
        items: itemsWithReturnInfo,
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch sale details:', error);
      toast.error('Failed to load sale details');
    }
  };

  const openReturnModal = async (saleId: number) => {
    if (!permissions.canProcessReturns) {
      toast.error('Only managers can process returns');
      return;
    }
    
    try {
      const response = await salesApi.getSale(saleId);
      const saleData = response.data;
      
      const normalizedSaleData = {
        ...saleData,
        subtotal: Number(saleData.subtotal || 0),
        discount_amount: Number(saleData.discount_amount || 0),
        total_amount: Number(saleData.total_amount || 0),
        amount_paid: Number(saleData.amount_paid || 0),
        change_amount: Number(saleData.change_amount || 0),
      };
      
      if (!normalizedSaleData.items) {
        normalizedSaleData.items = [];
      }
      normalizedSaleData.items = normalizedSaleData.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        total_price: Number(item.total_price || 0),
        product_sku: item.product_sku || item.sku || `SKU-${item.id}`
      }));
      
      setSelectedSaleForReturn(normalizedSaleData);
      setShowReturnModal(true);
    } catch (error) {
      console.error('Failed to fetch sale details:', error);
      toast.error('Failed to load sale details');
    }
  };

  const printReceipt = (sale: Sale) => {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        toast.error('Please allow popups to print receipt');
        return;
      }
      
      const formatCurrencyPrint = (value: number) => {
        const num = Number(value) || 0;
        return `TZS ${num.toLocaleString()}`;
      };
      
      const cashierName = sale.created_by_name || user?.username || sale.created_by || 'N/A';
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${sale.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
            .business-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .receipt-title { font-size: 14px; font-weight: bold; margin: 10px 0; text-align: center; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .items-table { width: 100%; margin: 15px 0; border-collapse: collapse; }
            .items-table th, .items-table td { text-align: left; padding: 4px 0; }
            .items-table th { border-bottom: 1px dashed #000; font-weight: bold; }
            .items-table td:last-child, .items-table th:last-child { text-align: right; }
            .totals { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .capitalize { text-transform: capitalize; }
            .return-badge { background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-name">${user?.business_name || 'BizSmart'}</div>
            <div>${(user as any)?.business_city || ''}</div>
            <div>Tel: ${user?.phone || ''}</div>
          </div>
          
          <div class="receipt-title">SALES RECEIPT</div>
          
          <div class="info-row"><span>Invoice No:</span><span><strong>${sale.invoice_number}</strong></span></div>
          <div class="info-row"><span>Date:</span><span>${new Date(sale.sale_date).toLocaleString()}</span></div>
          <div class="info-row"><span>Cashier:</span><span>${cashierName}</span></div>
          <div class="info-row"><span>Customer:</span><span>${sale.customer_name || 'Walk-in Customer'}</span></div>
          ${sale.customer_phone ? `<div class="info-row"><span>Phone:</span><span>${sale.customer_phone}</span></div>` : ''}
          
          <div class="divider"></div>
          
          <table class="items-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${sale.items?.map((item: SaleItem) => `
                <tr>
                  <td>${item.product_name}${item.is_fully_returned ? ' (Returned)' : ''}${item.returned_quantity && !item.is_fully_returned ? ' (Partial Return)' : ''}</td>
                  <td>${item.quantity}${item.returned_quantity ? ` (${item.returned_quantity} returned)` : ''}</td>
                  <td>${formatCurrencyPrint(item.unit_price)}</td>
                  <td>${formatCurrencyPrint(item.total_price)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td</td>'}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="info-row"><span>Subtotal:</span><span>${formatCurrencyPrint(sale.subtotal)}</span></div>
            ${sale.discount_amount > 0 ? `<div class="info-row"><span>Discount:</span><span>-${formatCurrencyPrint(sale.discount_amount)}</span></div>` : ''}
            <div class="total-row"><span>TOTAL:</span><span>${formatCurrencyPrint(sale.total_amount)}</span></div>
            <div class="info-row"><span>Payment Method:</span><span class="capitalize">${sale.payment_method}</span></div>
            <div class="info-row"><span>Amount Paid:</span><span>${formatCurrencyPrint(sale.amount_paid)}</span></div>
            ${sale.change_amount > 0 ? `<div class="info-row"><span>Change:</span><span>${formatCurrencyPrint(sale.change_amount)}</span></div>` : ''}
          </div>
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div>${sale.status === 'completed' ? '✓ Payment Completed' : 'Status: ' + sale.status}</div>
            <div style="margin-top: 5px;">${new Date().toLocaleString()}</div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  const formatCurrency = (value: number) => {
    const num = Number(value) || 0;
    if (num === 0) return 'TZS 0';
    return `TZS ${num.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
      refunded: { color: 'bg-gray-100 text-gray-700', label: 'Refunded' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', label: status };
    return <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>{config.label}</span>;
  };

  const filteredSales = sales.filter(sale =>
    sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && sales.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // RESTRICTED VIEW FOR CASHIER
  if (isCashier) {
    return (
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Sales</h1>
            <p className="text-sm text-gray-500 mt-1">View your transaction history</p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={16} />
              Filters
            </button>
            <button
              onClick={fetchSales}
              className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Simple Stats for Cashier */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">My Sales</p>
            <p className="text-2xl font-bold text-gray-900">{mySalesCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">My Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {sales.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600">Reset All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table - Simple view for cashier */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No sales found</td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-600">{sale.invoice_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{sale.customer_name || 'Walk-in Customer'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">{sale.payment_method}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => viewSaleDetails(sale.id)} 
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition" 
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button 
                            onClick={() => printReceipt(sale)} 
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition" 
                            title="Print Receipt"
                          >
                            <FiPrinter size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <FiChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sale Detail Modal - Simplified for Cashier */}
        {showDetailModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
              <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sale Details</h3>
                <button onClick={() => setShowDetailModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="font-semibold text-brand-600">{selectedSale.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm">{formatDate(selectedSale.sale_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cashier</p>
                    <p className="text-sm">{selectedSale.created_by_name || user?.username || 'You'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs">Product</th>
                          <th className="px-4 py-2 text-center text-xs">Qty</th>
                          <th className="px-4 py-2 text-right text-xs">Price</th>
                          <th className="px-4 py-2 text-right text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedSale.items && selectedSale.items.length > 0 ? (
                          selectedSale.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{item.product_name}</td>
                              <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                              <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No items available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold text-brand-600">{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span>{formatCurrency(selectedSale.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="capitalize">{selectedSale.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span>{getStatusBadge(selectedSale.status)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => printReceipt(selectedSale)} 
                    className="flex-1 border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                  >
                    <FiPrinter size={16} /> Print Receipt
                  </button>
                  <button 
                    onClick={() => setShowDetailModal(false)} 
                    className="flex-1 bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MANAGER/ADMIN FULL VIEW
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all transactions</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-brand-50 border-brand-300 text-brand-600' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FiFilter size={16} />
            Filters
          </button>
          <button
            onClick={fetchSales}
            className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200 hover:border-brand-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Manager Stats - Full Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(sales.reduce((sum, s) => sum + s.total_amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Average Order</p>
          <p className="text-2xl font-bold text-brand-600">
            {formatCurrency(sales.length > 0 ? sales.reduce((sum, s) => sum + s.total_amount, 0) / sales.length : 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {sales.filter(s => s.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Full Sales Table for Managers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No sales found</td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-brand-600">{sale.invoice_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{sale.customer_name || 'Walk-in Customer'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{sale.payment_method}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => viewSaleDetails(sale.id)} 
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition" 
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button 
                          onClick={() => printReceipt(sale)} 
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition" 
                          title="Print Receipt"
                        >
                          <FiPrinter size={16} />
                        </button>
                        {sale.status === 'completed' && (
                          <button 
                            onClick={() => openReturnModal(sale.id)} 
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition" 
                            title="Process Return"
                          >
                            <FiPackage size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <FiChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal for Managers */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sale Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="font-semibold text-brand-600">{selectedSale.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm">{formatDate(selectedSale.sale_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cashier</p>
                  <p className="text-sm">{selectedSale.created_by_name || selectedSale.created_by || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Product</th>
                        <th className="px-4 py-2 text-center text-xs">Qty</th>
                        <th className="px-4 py-2 text-right text-xs">Price</th>
                        <th className="px-4 py-2 text-right text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSale.items && selectedSale.items.length > 0 ? (
                        selectedSale.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">{item.product_name}</td>
                            <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No items available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-brand-600">{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Paid</span>
                  <span>{formatCurrency(selectedSale.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="capitalize">{selectedSale.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span>{getStatusBadge(selectedSale.status)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => printReceipt(selectedSale)} 
                  className="flex-1 border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <FiPrinter size={16} /> Print Receipt
                </button>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Return Modal */}
      {showReturnModal && selectedSaleForReturn && (
        <ProcessReturnModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedSaleForReturn(null);
          }}
          sale={selectedSaleForReturn}
          onSuccess={() => {
            fetchSales();
            fetchReturns();
          }}
        />
      )}
    </div>
  );
}