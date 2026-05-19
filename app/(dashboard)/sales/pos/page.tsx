// app/(dashboard)/sales/pos/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi, salesApi } from '@/services/api';
import toast from 'react-hot-toast';
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
} from 'react-icons/fi';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  quantity_on_hand: number;
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
}

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
  const [amountPaid, setAmountPaid] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [quickAmounts] = useState([5000, 10000, 20000, 50000, 100000]);
  const [returnChange, setReturnChange] = useState(true);
  
  const cartEndRef = useRef<HTMLDivElement>(null);

  // Fetch products and customers
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    cartEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cart]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, customersRes] = await Promise.all([
        inventoryApi.getProducts(),
        salesApi.getCustomers(),
      ]);
      
      const productsData = productsRes.data.results || productsRes.data;
      const customersData = customersRes.data.results || customersRes.data;
      
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    product.quantity_on_hand > 0
  );

  // Filter customers for modal
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Add to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity_on_hand) {
        toast.error(`Only ${product.quantity_on_hand} items in stock`);
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        stock: product.quantity_on_hand,
        total: product.selling_price
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

  // Select customer from modal
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowCustomerModal(false);
    toast.success(`Customer selected: ${customer.name}`);
  };

  // Clear selected customer
  const clearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const calculatedChange = returnChange && amountPaid > total ? amountPaid - total : 0;

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (amountPaid < total && paymentMethod !== 'credit') {
      toast.error(`Amount paid (TZS ${amountPaid.toLocaleString()}) is less than total (TZS ${total.toLocaleString()})`);
      return;
    }

    setIsProcessing(true);
    
    try {
      const saleData: any = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        discount_amount: 0,
        discount_percentage: 0,
        notes: returnChange ? `Change returned: TZS ${calculatedChange}` : 'No change returned'
      };
      
      // Add customer_id if an existing customer was selected
      if (selectedCustomerId) {
        saleData.customer_id = selectedCustomerId;
      }

      const response = await salesApi.processSale(saleData);
      setLastSale({
        ...response.data,
        actualAmountPaid: amountPaid,
        changeReturned: calculatedChange,
        returnedChange: returnChange
      });
      
      toast.success(`Sale completed! Invoice: ${response.data.sale.invoice_number}`);
      
      // Reset cart and form
      setCart([]);
      setAmountPaid(0);
      setReturnChange(true);
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
      toast.success('Cart cleared');
    }
  };

  const quickAddAmount = (amount: number) => {
    setAmountPaid(amountPaid + amount);
  };

  const setExactAmount = () => {
    setAmountPaid(total);
  };

  const printReceipt = () => {
    window.print();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-sm text-gray-500 mt-1">Process customer orders quickly and efficiently</p>
      </div>

      {/* Products Section */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Products</h2>
          </div>
          <div className="p-4 max-h-[450px] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
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
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Low
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                  <p className="text-brand-600 font-bold mt-2">TZS {product.selling_price.toLocaleString()}</p>
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
      </div>

      {/* Shopping Cart Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiShoppingCart className="text-brand-500" size={20} />
            <h2 className="font-semibold text-gray-900">Shopping Cart</h2>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{cart.length} items</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <FiTrash2 size={14} />
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items Table */}
        {cart.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Cart is empty</p>
            <p className="text-sm mt-1">Click on products above to add items</p>
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
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">TZS {item.price.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-600">TZS {item.price.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">TZS {item.total.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
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
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Side - Customer Info & Payment */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FiUser size={16} />
                      Customer Information
                    </h3>
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <FiUsers size={14} />
                      Select Customer
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {selectedCustomerId && (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700">Customer selected</span>
                        <button
                          onClick={clearCustomer}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FiCreditCard size={16} />
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: FiDollarSign },
                      { value: 'mpesa', label: 'M-Pesa', icon: FiSmartphone },
                      { value: 'card', label: 'Card', icon: FiCreditCard },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition ${
                          paymentMethod === method.value
                            ? 'border-brand-500 bg-brand-50 text-brand-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <method.icon size={14} />
                        <span className="text-sm">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Totals & Payment */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                      <span className="font-medium">TZS {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-brand-600">TZS {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-gray-900">Amount Paid</label>
                    <button
                      onClick={setExactAmount}
                      className="text-xs text-brand-600 hover:text-brand-700"
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
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg"
                  />
                  
                  {/* Change Options */}
                  {amountPaid > total && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800">Customer overpaid by:</span>
                        <span className="text-lg font-bold text-yellow-800">TZS {(amountPaid - total).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => setReturnChange(true)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            returnChange
                              ? 'bg-brand-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Return Change
                        </button>
                        <button
                          onClick={() => setReturnChange(false)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            !returnChange
                              ? 'bg-brand-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          No Change (Keep as tip)
                        </button>
                      </div>
                    </div>
                  )}

                  {calculatedChange > 0 && returnChange && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700">Change to return</p>
                      <p className="text-2xl font-bold text-green-600">TZS {calculatedChange.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {amountPaid > 0 && amountPaid < total && paymentMethod !== 'credit' && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">Amount short by</p>
                      <p className="text-xl font-bold text-red-600">TZS {(total - amountPaid).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={processSale}
                  disabled={amountPaid < total && paymentMethod !== 'credit' || isProcessing}
                  className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      Complete Sale
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No customers found</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        )}
                        {customer.email && (
                          <p className="text-xs text-gray-400">{customer.email}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">TZS {(customer.total_spent || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{customer.total_visits || 0} visits</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sale Completed!</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Transaction Successful!</h4>
              <p className="text-gray-500 mb-4">Invoice: {lastSale.sale.invoice_number}</p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-brand-600">TZS {lastSale.sale.total_amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">Amount Paid: TZS {lastSale.actualAmountPaid.toLocaleString()}</p>
                {lastSale.changeReturned > 0 && (
                  <p className="text-sm text-green-600 mt-1">Change Returned: TZS {lastSale.changeReturned.toLocaleString()}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Payment: {lastSale.sale.payment_method}</p>
                <p className="text-sm text-gray-500">Customer: {lastSale.sale.customer_name || 'Walk-in Customer'}</p>
              </div>
              <button
                onClick={printReceipt}
                className="w-full border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <FiPrinter size={16} />
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full mt-3 bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}