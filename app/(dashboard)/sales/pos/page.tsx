// app/(dashboard)/sales/pos/page.tsx - CAMERA WITHOUT EXPLICIT PERMISSION REQUEST

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi, salesApi } from '@/services/api';
import toast from 'react-hot-toast';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiShoppingCart,
  FiUser,
  FiCreditCard,
  FiSmartphone,
  FiDollarSign,
  FiPrinter,
  FiCheck,
  FiX,
  FiPackage,
  FiUsers,
  FiCamera,
  FiRefreshCw,
  FiRotateCcw,
  FiAlertCircle,
} from 'react-icons/fi';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  selling_price: number | string;
  quantity_on_hand: number;
  buying_price?: number;
  category_name?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_spent: number;
  total_visits: number;
}

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  total: number;
  barcode?: string;
}

const SCANNER_ELEMENT_ID = 'barcode-scanner';

export default function POSPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [quickAmounts] = useState([5000, 10000, 20000, 50000, 100000]);

  // Overpayment options
  const [overpaymentAction, setOverpaymentAction] = useState<'return' | 'tip'>('return');

  // Barcode scanning state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const cartEndRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const isHandlingScanRef = useRef(false);

  // Helper function to convert price to number
  const parsePrice = (price: number | string): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Filter products and customers
  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    product.quantity_on_hand > 0
  );

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = typeof item.total === 'number' ? item.total : parseFloat(String(item.total)) || 0;
    return sum + itemTotal;
  }, 0);

  const total = subtotal;
  const itemCount = cart.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0);

  // Calculate overpayment amount
  const overpaymentAmount = amountPaid > total ? amountPaid - total : 0;

  // Final amount to record
  const finalAmountPaid = overpaymentAction === 'tip' ? total : amountPaid;

  // Fetch products and customers
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    cartEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cart]);

  // Focus barcode input when component loads / scanner closes
  useEffect(() => {
    if (barcodeInputRef.current && !isScannerOpen) {
      barcodeInputRef.current.focus();
    }
  }, [isScannerOpen]);

  // Scanner lifecycle - starts automatically when modal opens
  useEffect(() => {
    if (isScannerOpen) {
      isHandlingScanRef.current = false;
      setHasPermission(null);
      setCameraError(null);
      // Try to start scanner immediately without asking permission first
      startScanner(useFrontCamera);
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScannerOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, customersRes] = await Promise.all([
        inventoryApi.getProducts(),
        salesApi.getCustomers(),
      ]);

      let productsData = productsRes.data.results || productsRes.data || [];
      const customersData = customersRes.data.results || customersRes.data || [];

      productsData = productsData.map((product: any) => ({
        ...product,
        selling_price: parsePrice(product.selling_price),
        buying_price: parsePrice(product.buying_price || 0)
      }));

      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Map getUserMedia errors to friendly messages
  const describeCameraError = (err: any): string => {
    const name = err?.name || '';
    const message = String(err?.message || err || '');

    if (name === 'NotAllowedError' || /permission denied/i.test(message)) {
      return 'Camera permission denied. Please allow camera access in your browser settings.';
    }
    if (name === 'NotFoundError' || /no camera/i.test(message)) {
      return 'No camera found on this device.';
    }
    if (name === 'NotReadableError') {
      return 'Camera is already in use by another application.';
    }
    if (name === 'OverconstrainedError') {
      return 'The requested camera is not available on this device.';
    }
    return 'Failed to access camera. Please check your camera settings.';
  };

  // Start the scanner - tries to start without asking permission first
  const startScanner = async (frontCamera: boolean) => {
    if (!scannerContainerRef.current) return;

    setCameraError(null);
    setIsCameraStarting(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
      }

      await scannerRef.current.start(
        { facingMode: frontCamera ? 'user' : 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.7777778,
          disableFlip: false,
        },
        onScanSuccess,
        onScanError
      );
      
      // Scanner started successfully
      setHasPermission(true);
      
    } catch (err: any) {
      console.error('Scanner start failed:', err);
      setHasPermission(false);
      setCameraError(describeCameraError(err));
      
      // If error is NotAllowedError, show user friendly message
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // Don't automatically retry - let user click "Try Again"
        toast.error('Camera access denied. Click "Try Again" to request permission.');
      }
    } finally {
      setIsCameraStarting(false);
    }
  };

  // Stop the scanner
  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    }
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  // Switch camera
  const switchCamera = async () => {
    if (isSwitchingCamera || isCameraStarting) return;

    setIsSwitchingCamera(true);
    const newFacing = !useFrontCamera;

    try {
      await stopScanner();
      setUseFrontCamera(newFacing);
      // Reset permission state for retry
      setHasPermission(null);
      await startScanner(newFacing);
    } catch (err) {
      console.error('Camera switch failed:', err);
      toast.error('Failed to switch camera.');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;

    // Pause scanning
    try {
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.pause(true);
      }
    } catch {
      // ignore
    }

    try {
      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => {});
    } catch {
      // ignore
    }

    await findProductByBarcode(decodedText);
    closeScanner();

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const onScanError = (_errorMessage: string) => {};

  // Manual barcode input
  const handleBarcodeSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput) {
      e.preventDefault();
      await findProductByBarcode(barcodeInput);
      setBarcodeInput('');
    }
  };

  // Find product by barcode
  const findProductByBarcode = async (barcodeRaw: string) => {
    const barcode = barcodeRaw.trim();
    const product = products.find(p => p.barcode?.trim() === barcode);

    if (product && product.quantity_on_hand > 0) {
      addToCart(product);
    } else if (product && product.quantity_on_hand === 0) {
      toast.error(`${product.name} is out of stock`);
    } else {
      try {
        const response = await inventoryApi.getProductByBarcode(barcode);
        if (response.data && response.data.quantity_on_hand > 0) {
          const newProduct = {
            ...response.data,
            selling_price: parsePrice(response.data.selling_price)
          };
          setProducts(prev => [...prev, newProduct]);
          addToCart(newProduct);
        } else if (response.data && response.data.quantity_on_hand === 0) {
          toast.error(`${response.data.name} is out of stock`);
        } else {
          toast.error('Product not found');
        }
      } catch (error) {
        console.error('Barcode scan failed:', error);
        toast.error(`Product with barcode "${barcode}" not found`);
      }
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    const price = parsePrice(product.selling_price);

    if (price === 0) {
      toast.error('Invalid product price');
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity_on_hand) {
        toast.error(`Only ${product.quantity_on_hand} items in stock`);
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        price: price,
        quantity: 1,
        stock: product.quantity_on_hand,
        total: price,
        barcode: product.barcode
      }]);
    }
    toast.success(`${product.name} added`, { duration: 1500 });
  };

  // Update quantity
  const updateQuantity = (itemId: number, newQuantity: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    if (newQuantity > item.stock) {
      toast.error(`Only ${item.stock} items in stock`);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success('Item removed', { duration: 1500 });
  };

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowCustomerModal(false);
    toast.success(`Customer selected: ${customer.name}`);
  };

  const clearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Set exact amount
  const setExactAmount = () => {
    setAmountPaid(total);
    setOverpaymentAction('return');
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const amountPaidValue = Number(amountPaid) || 0;

    if (amountPaidValue < total && paymentMethod !== 'credit') {
      toast.error(`Amount paid (TZS ${amountPaidValue.toLocaleString()}) is less than total (TZS ${total.toLocaleString()})`);
      return;
    }

    setIsProcessing(true);

    try {
      let finalAmount = amountPaidValue;
      let tipAmount = 0;

      if (amountPaidValue > total) {
        if (overpaymentAction === 'tip') {
          finalAmount = total;
          tipAmount = amountPaidValue - total;
        } else {
          finalAmount = amountPaidValue;
        }
      }

      const saleData: any = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_paid: finalAmount,
        discount_amount: 0,
        discount_percentage: 0,
        notes: tipAmount > 0 ? `Tip included: TZS ${tipAmount.toLocaleString()}` : '',
        tip_amount: tipAmount
      };

      if (selectedCustomerId) {
        saleData.customer_id = selectedCustomerId;
      }

      const response = await salesApi.processSale(saleData);

      setLastSale({
        ...response.data,
        amountPaidEntered: amountPaidValue,
        actualAmountPaid: finalAmount,
        overpaymentAmount: overpaymentAmount,
        overpaymentAction: overpaymentAction,
        tipAmount: tipAmount,
        total: total
      });

      toast.success(`Sale completed! Invoice: ${response.data.sale.invoice_number}`);

      setCart([]);
      setAmountPaid(0);
      setOverpaymentAction('return');
      fetchData();
      setShowReceipt(true);

    } catch (error: any) {
      console.error('Sale failed:', error);
      toast.error(error.response?.data?.error || 'Sale failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear entire cart?')) {
      setCart([]);
      setAmountPaid(0);
      toast.success('Cart cleared');
    }
  };

  const quickAddAmount = (amount: number) => {
    setAmountPaid(prev => prev + amount);
    if ((amountPaid + amount) > total) {
      setOverpaymentAction('return');
    }
  };

  const handleAmountPaidChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setAmountPaid(0);
    } else {
      setAmountPaid(numValue);
    }
    if (numValue > total) {
      setOverpaymentAction('return');
    }
  };

  const printReceipt = () => {
    if (!lastSale) return;

    const sale = lastSale.sale;
    const formatCurrencyPrint = (value: number) => {
      if (!value && value !== 0) return 'TZS 0';
      return `TZS ${value.toLocaleString()}`;
    };

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }

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
        <div class="info-row"><span>Cashier:</span><span>${user?.username || 'N/A'}</span></div>
        <div class="info-row"><span>Customer:</span><span>${sale.customer_name || 'Walk-in Customer'}</span></div>
        ${sale.customer_phone ? `<div class="info-row"><span>Phone:</span><span>${sale.customer_phone}</span></div>` : ''}

        <div class="divider"></div>

        <table class="items-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            ${sale.items?.map((item: any) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrencyPrint(item.unit_price)}</td>
                <td>${formatCurrencyPrint(item.total_price)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No items</td></tr>'}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="info-row"><span>Subtotal:</span><span>${formatCurrencyPrint(sale.subtotal)}</span></div>
          ${sale.discount_amount > 0 ? `<div class="info-row"><span>Discount:</span><span>-${formatCurrencyPrint(sale.discount_amount)}</span></div>` : ''}
          <div class="total-row"><span>TOTAL:</span><span>${formatCurrencyPrint(lastSale.total)}</span></div>
          <div class="info-row"><span>Payment Method:</span><span class="capitalize">${sale.payment_method}</span></div>
          <div class="info-row"><span>Amount Paid:</span><span>${formatCurrencyPrint(lastSale.actualAmountPaid)}</span></div>
          ${lastSale.tipAmount > 0 ? `<div class="info-row"><span>Tip:</span><span>${formatCurrencyPrint(lastSale.tipAmount)}</span></div>` : ''}
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
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-sm text-gray-500 mt-1">Scan barcode or search products</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="p-2 text-gray-500 hover:text-brand-600 rounded-lg border border-gray-200"
        >
          <FiRefreshCw size={18} />
        </button>
      </div>

      {/* Barcode Scanner Row */}
      <div className="mb-6 bg-gradient-to-r from-brand-50 to-white rounded-2xl p-4 border border-brand-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Enter barcode manually and press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSubmit}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-lg"
            />
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-2 font-medium shadow-md"
          >
            <FiCamera size={20} />
            Scan Barcode with Camera
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Items in Cart</p>
          <p className="text-2xl font-bold text-brand-600">{itemCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Subtotal</p>
          <p className="text-2xl font-bold text-gray-900">TZS {subtotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-green-600">TZS {total.toLocaleString()}</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product: Product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity_on_hand === 0}
                className="group bg-white border border-gray-200 rounded-xl p-3 text-left hover:shadow-lg hover:border-brand-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center group-hover:bg-brand-500 transition">
                    <FiPackage className="text-brand-600 group-hover:text-white" size={18} />
                  </div>
                  {product.quantity_on_hand <= 5 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Low</span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                <p className="text-brand-600 font-bold mt-2">TZS {parsePrice(product.selling_price).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Stock: {product.quantity_on_hand}</p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? 'No products found' : 'No products available'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Shopping Cart Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiShoppingCart className="text-brand-500" size={20} />
            <h2 className="font-semibold text-gray-900">Shopping Cart</h2>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{cart.length} items</span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
              <FiTrash2 size={14} /> Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Cart is empty</p>
            <p className="text-sm mt-1">Scan barcode or search products to add items</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((item: CartItem) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                            <FiMinus size={12} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                            <FiPlus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">TZS {item.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold">TZS {item.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div ref={cartEndRef} />
          </>
        )}

        {/* Checkout Section */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Customer Info & Payment */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-3">
                    <h3 className="font-medium">Customer Information</h3>
                    <button onClick={() => setShowCustomerModal(true)} className="text-sm text-brand-600">Select Customer</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-2"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                  {selectedCustomerId && (
                    <div className="mt-2 text-sm text-green-600 flex justify-between items-center">
                      <span>✓ Customer selected</span>
                      <button onClick={clearCustomer} className="text-red-500 text-xs">Clear</button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-3">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: FiDollarSign },
                      { value: 'mpesa', label: 'M-Pesa', icon: FiSmartphone },
                      { value: 'card', label: 'Card', icon: FiCreditCard },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition ${
                          paymentMethod === method.value
                            ? 'border-brand-500 bg-brand-50 text-brand-600'
                            : 'border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <method.icon size={14} />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Payment */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">TZS {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-brand-600">TZS {total.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-gray-900">Amount Paid</label>
                    <button
                      onClick={setExactAmount}
                      className="px-3 py-1 text-sm bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-200 transition"
                    >
                      Exact Amount
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => quickAddAmount(amount)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        +TZS {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amountPaid || ''}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    className="w-full p-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />

                  {/* Overpayment Options */}
                  {overpaymentAmount > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 mb-3">
                        Customer overpaid by: TZS {overpaymentAmount.toLocaleString()}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setOverpaymentAction('return')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            overpaymentAction === 'return'
                              ? 'bg-brand-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          💵 Return Change
                        </button>
                        <button
                          onClick={() => setOverpaymentAction('tip')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            overpaymentAction === 'tip'
                              ? 'bg-brand-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          🎁 Keep as Tip
                        </button>
                      </div>
                      {overpaymentAction === 'return' && (
                        <p className="text-xs text-gray-600 mt-3">
                          Change to return: TZS {overpaymentAmount.toLocaleString()}
                        </p>
                      )}
                      {overpaymentAction === 'tip' && (
                        <p className="text-xs text-gray-600 mt-3">
                          Tip amount: TZS {overpaymentAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Short payment warning */}
                  {amountPaid > 0 && amountPaid < total && paymentMethod !== 'credit' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">
                        Amount short by: TZS {(total - amountPaid).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={processSale}
                    disabled={isProcessing || (amountPaid < total && paymentMethod !== 'credit')}
                    className="w-full mt-4 bg-brand-500 text-white p-3 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isProcessing ? 'Processing...' : 'Complete Sale'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal - Starts camera without asking permission first */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex justify-between items-center text-white">
                <div>
                  <h3 className="text-lg font-semibold">Scan Barcode</h3>
                  <p className="text-xs text-gray-300">
                    {useFrontCamera ? 'FRONT' : 'BACK'} camera
                    {isCameraStarting && ' (starting...)'}
                    {!isCameraStarting && !cameraError && hasPermission !== false && ' ✓ Ready'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={switchCamera}
                    disabled={isSwitchingCamera || isCameraStarting}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition disabled:opacity-50"
                  >
                    {isSwitchingCamera ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiRotateCcw size={20} />
                    )}
                  </button>
                  <button onClick={closeScanner} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                    <FiX size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scanner Element */}
            <div id={SCANNER_ELEMENT_ID} ref={scannerContainerRef} className="w-full min-h-[500px] bg-black"></div>

            {/* Camera Error - Shows when permission denied */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center text-white p-6 max-w-sm">
                  <FiAlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
                  <p className="text-gray-300 mb-4">{cameraError}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => startScanner(useFrontCamera)}
                      className="w-full px-6 py-3 bg-brand-600 rounded-lg hover:bg-brand-700 transition font-medium"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={closeScanner} 
                      className="w-full px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isCameraStarting && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}

            {/* Scanner Overlay - Only show when scanner is running */}
            {!cameraError && !isCameraStarting && hasPermission !== false && (
              <>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                  <div className="text-center text-white text-sm">
                    <p>📷 Point camera at product barcode</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Supports EAN-13, Code 128, UPC-A, QR Code
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-green-500 rounded-lg shadow-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="p-1"><FiX size={20} /></button>
            </div>
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredCustomers.map((customer: Customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full text-left p-4 border rounded-xl mb-2 hover:bg-gray-50 transition"
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No customers found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-bold mb-2">Transaction Successful!</h4>
            <p className="text-gray-500 mb-4">Invoice: {lastSale.sale.invoice_number}</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-brand-600">TZS {lastSale.total.toLocaleString()}</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-lg font-semibold text-green-600">TZS {lastSale.actualAmountPaid.toLocaleString()}</p>
              </div>
              {lastSale.tipAmount > 0 && (
                <p className="text-sm text-gray-500 mt-1">Tip: TZS {lastSale.tipAmount.toLocaleString()}</p>
              )}
            </div>
            <button onClick={printReceipt} className="w-full border p-2 rounded-lg mb-2 hover:bg-gray-50 transition">
              <FiPrinter className="inline mr-2" size={16} />
              Print Receipt
            </button>
            <button onClick={() => setShowReceipt(false)} className="w-full bg-brand-500 text-white p-2 rounded-lg hover:bg-brand-600 transition">
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}