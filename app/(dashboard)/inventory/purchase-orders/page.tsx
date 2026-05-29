// app/(dashboard)/inventory/purchase-orders/page.tsx - COMPLETELY FIXED

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { inventoryApi } from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiFileText,
  FiCheck,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import { FaBoxOpen, FaMoneyBillWave, FaBuilding } from 'react-icons/fa';

interface PurchaseOrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  quantity_received: number;
  remaining_quantity: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  supplier: number;
  order_date: string;
  expected_delivery: string;
  actual_delivery: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  status: string;
  status_display: string;
  notes: string;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
  created_by: number;
  business: number;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: string;
  current_stock: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, any> = {
  draft: FiFileText,
  ordered: FiTruck,
  received: FiCheckCircle,
  cancelled: FiXCircle,
};

// Delete Confirmation Modal
function DeletePOModal({ isOpen, onClose, onConfirm, poNumber, isDeleting }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiAlertCircle className="text-red-500" size={20} />
            Delete Purchase Order
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete PO <span className="font-semibold text-gray-900">"{poNumber}"</span>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This action cannot be undone. Only Owner role can delete purchase orders.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Receive Items Modal
function ReceiveItemsModal({ isOpen, onClose, onSuccess, purchaseOrder }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items && purchaseOrder.items.length > 0) {
      const mappedItems = purchaseOrder.items.map((item: any) => {
        const orderedQty = item.quantity;
        const receivedQty = item.quantity_received || 0;
        const remainingQty = orderedQty - receivedQty;
        
        return {
          id: item.id,
          product_id: item.product,
          product_name: item.product_name,
          ordered_quantity: orderedQty,
          received_quantity: receivedQty,
          remaining_quantity: remainingQty,
          unit_cost: parseFloat(item.unit_cost),
          receiving_quantity: 0,
        };
      });
      setItems(mappedItems);
    }
  }, [purchaseOrder]);

  const handleQuantityChange = (itemId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    const item = items.find(i => i.id === itemId);
    if (item && quantity <= item.remaining_quantity) {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, receiving_quantity: quantity } : item
      ));
    } else if (quantity > item?.remaining_quantity) {
      toast.error(`Cannot receive more than ${item?.remaining_quantity} items`);
    }
  };

  const handleReceiveAll = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      receiving_quantity: item.remaining_quantity
    })));
    toast.success('All remaining items selected for receiving');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToReceive = items.filter(item => item.receiving_quantity > 0);
    
    if (itemsToReceive.length === 0) {
      toast.error('Please enter at least one item to receive');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const receiveData = {
        items: itemsToReceive.map(item => ({
          item_id: item.id,
          product_id: item.product_id,
          quantity: item.receiving_quantity,
          unit_cost: item.unit_cost,
        }))
      };
      
      await inventoryApi.receivePurchaseOrder(purchaseOrder.id, receiveData);
      
      toast.success(`Successfully received ${itemsToReceive.reduce((sum, item) => sum + item.receiving_quantity, 0)} items`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to receive items:', error);
      toast.error(error.response?.data?.message || 'Failed to receive items');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !purchaseOrder) return null;

  const totalReceiving = items.reduce((sum, item) => sum + (item.receiving_quantity || 0), 0);
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining_quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiPackage size={18} />
              Receive Items
            </h3>
            <p className="text-sm text-gray-600 mt-1">PO Number: <span className="font-medium text-blue-600">{purchaseOrder.po_number}</span></p>
            <p className="text-xs text-gray-500">Supplier: {purchaseOrder.supplier_name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items found in this purchase order
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">📦 Receive Stock</p>
                      <p className="text-xs mt-1">Enter the quantities you are receiving for each item below.</p>
                    </div>
                    {totalRemaining > 0 && (
                      <button
                        type="button"
                        onClick={handleReceiveAll}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        Receive All ({totalRemaining})
                      </button>
                    )}
                  </div>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Unit Cost: ${item.unit_cost.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ordered: <span className="font-medium">{item.ordered_quantity}</span></p>
                        <p className="text-xs text-green-600">Already Received: {item.received_quantity}</p>
                        <p className="text-xs text-amber-600 font-medium">Remaining: {item.remaining_quantity}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Receiving Now
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max={item.remaining_quantity}
                          value={item.receiving_quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter quantity"
                        />
                        {item.remaining_quantity > 0 && (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, String(item.remaining_quantity))}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            Max
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {item.receiving_quantity > 0 && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                        You will receive: {item.receiving_quantity} × ${item.unit_cost.toFixed(2)} = ${(item.receiving_quantity * item.unit_cost).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Items to Receive:</span>
                      <span className="text-sm font-semibold text-gray-900">{totalReceiving}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Remaining:</span>
                      <span className="text-sm font-semibold text-amber-600">{totalRemaining}</span>
                    </div>
                    {totalReceiving > 0 && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium text-gray-700">Total Value:</span>
                        <span className="text-sm font-bold text-green-600">
                          ${items.reduce((sum, item) => sum + (item.receiving_quantity * item.unit_cost), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || totalReceiving === 0 || items.length === 0}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : `Receive ${totalReceiving} Item${totalReceiving !== 1 ? 's' : ''}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Purchase Order Modal
function ViewPOModal({ isOpen, onClose, purchaseOrder, onReceive, onEdit }: any) {
  if (!isOpen || !purchaseOrder) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const StatusIcon = statusIcons[purchaseOrder.status] || FiFileText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Purchase Order Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">{purchaseOrder.po_number}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusColors[purchaseOrder.status]}`}>
                      <StatusIcon size={12} />
                      {purchaseOrder.status_display}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-sm font-medium">{formatDate(purchaseOrder.order_date)}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaBuilding size={16} /> Supplier Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Supplier Name</p>
                  <p className="text-sm text-gray-900">{purchaseOrder.supplier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected Delivery</p>
                  <p className="text-sm text-gray-900">{formatDate(purchaseOrder.expected_delivery)}</p>
                </div>
                {purchaseOrder.actual_delivery && (
                  <div>
                    <p className="text-xs text-gray-500">Actual Delivery</p>
                    <p className="text-sm text-gray-900">{formatDate(purchaseOrder.actual_delivery)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaBoxOpen size={16} /> Order Items
              </h4>
              {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Ordered</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Received</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Remaining</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Cost</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {purchaseOrder.items.map((item: PurchaseOrderItem) => {
                        const orderedQty = item.quantity;
                        const receivedQty = item.quantity_received || 0;
                        const remainingQty = orderedQty - receivedQty;
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 text-right">{orderedQty}</td>
                            <td className="px-4 py-2 text-sm text-green-600 text-right">{receivedQty}</td>
                            <td className="px-4 py-2 text-sm text-amber-600 text-right">{remainingQty}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 text-right">${parseFloat(item.unit_cost).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 text-right">${parseFloat(item.total_cost).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium">Subtotal:</td>
                        <td className="px-4 py-2 text-right text-sm">${parseFloat(purchaseOrder.subtotal).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium">Tax (18%):</td>
                        <td className="px-4 py-2 text-right text-sm">${parseFloat(purchaseOrder.tax_amount).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right text-sm font-bold">Total:</td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-blue-600">
                          ${parseFloat(purchaseOrder.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No items in this purchase order
                </div>
              )}
            </div>

            {purchaseOrder.notes && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiFileText size={16} /> Notes
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{purchaseOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <div className="flex gap-3">
            {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(purchaseOrder);
                  }}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition"
                >
                  Edit Order
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (onReceive) onReceive(purchaseOrder);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Receive Items
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Purchase Order Modal
function PurchaseOrderModal({ isOpen, onClose, onSuccess, purchaseOrder, suppliers, products }: any) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    supplier: '',
    expected_delivery: '',
    notes: '',
    status: 'draft',
    items: [] as any[],
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier: purchaseOrder.supplier?.toString() || '',
        expected_delivery: purchaseOrder.expected_delivery || '',
        notes: purchaseOrder.notes || '',
        status: purchaseOrder.status || 'draft',
        items: purchaseOrder.items?.map((item: any) => ({
          product_id: item.product,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_cost: parseFloat(item.unit_cost),
        })) || [],
      });
    } else {
      setFormData({
        supplier: '',
        expected_delivery: '',
        notes: '',
        status: 'draft',
        items: [],
      });
    }
  }, [purchaseOrder]);

  const addItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (productQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const product = products.find((p: Product) => p.id === parseInt(selectedProduct));
    if (!product) return;

    const existingItem = formData.items.find((item: any) => item.product_id === parseInt(selectedProduct));
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item: any) =>
          item.product_id === parseInt(selectedProduct)
            ? { ...item, quantity: item.quantity + productQuantity }
            : item
        ),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id: parseInt(selectedProduct),
            product_name: product.name,
            quantity: productQuantity,
            unit_cost: parseFloat(product.unit_price),
          },
        ],
      }));
    }

    setSelectedProduct('');
    setProductQuantity(1);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 0) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ),
    }));
  };

  const updateItemUnitCost = (index: number, unitCost: number) => {
    if (unitCost < 0) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, unit_cost: unitCost } : item
      ),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = formData.items.map((item: any) => ({
        product: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost.toFixed(2),
      }));

      const submitData = {
        supplier: parseInt(formData.supplier),
        expected_delivery: formData.expected_delivery || null,
        notes: formData.notes || '',
        status: formData.status,
        business: user?.business,
        items: formattedItems,
      };

      console.log('Submitting purchase order:', submitData);

      let response;
      if (purchaseOrder) {
        response = await inventoryApi.updatePurchaseOrder(purchaseOrder.id, submitData);
        toast.success(`Purchase order ${response.data?.po_number || purchaseOrder.po_number} updated successfully`);
      } else {
        response = await inventoryApi.createPurchaseOrder(submitData);
        toast.success(`Purchase order ${response.data?.po_number || ''} created successfully`);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save purchase order:', error);
      if (error.response?.data) {
        const errorMessage = Object.values(error.response.data)[0];
        toast.error(String(errorMessage));
      } else {
        toast.error('Failed to save purchase order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {purchaseOrder ? `Update PO: ${purchaseOrder.po_number}` : 'Create a new purchase order'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers?.map((supplier: Supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery
                </label>
                <input
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
              
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product</option>
                  {products?.map((product: Product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${parseFloat(product.unit_price).toFixed(2)} (Stock: {product.current_stock})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Cost</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                          No items added. Select a product above.
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) => updateItemUnitCost(index, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm">
                            ${(item.quantity * item.unit_cost).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {formData.items.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium">Subtotal:</td>
                        <td className="px-3 py-2 text-right text-sm">${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium">Tax (18%):</td>
                        <td className="px-3 py-2 text-right text-sm">${tax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold">Total:</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">${total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes or instructions"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (purchaseOrder ? 'Update Order' : 'Create Order')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { user } = useAuthStore();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [posRes, suppliersRes, productsRes] = await Promise.all([
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getSuppliers(),
        inventoryApi.getProducts(),
      ]);
      
      setPurchaseOrders(posRes.data.results || posRes.data || []);
      setSuppliers(suppliersRes.data.results || suppliersRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPO) return;
    setIsDeleting(true);
    
    try {
      await inventoryApi.deletePurchaseOrder(selectedPO.id);
      toast.success(`PO ${selectedPO.po_number} deleted`);
      setShowDeleteModal(false);
      setSelectedPO(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete purchase order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete purchase order');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowDeleteModal(true);
  };

  const openCreateModal = () => {
    setSelectedPO(null);
    setShowModal(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowModal(true);
  };

  const openViewModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowReceiveModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string, statusDisplay: string) => {
    const Icon = statusIcons[status] || FiFileText;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
        <Icon size={12} />
        {statusDisplay}
      </span>
    );
  };

  if (isLoading && purchaseOrders.length === 0) {
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

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier purchase orders</p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus size={18} />
          Create PO
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-amber-600">
                {purchaseOrders.filter(po => po.status === 'ordered').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FiTruck className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Received</p>
              <p className="text-2xl font-bold text-green-600">
                {purchaseOrders.filter(po => po.status === 'received').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-purple-600">
                ${purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount || '0'), 0).toFixed(0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-purple-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FiFilter size={16} />
            Filters
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-blue-200 transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600">
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-blue-600">{po.po_number}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {po.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-gray-400" size={14} />
                        <span className="text-sm text-gray-900">{po.supplier_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(po.order_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${parseFloat(po.total_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(po.status, po.status_display)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(po)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        {po.status !== 'received' && po.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => openEditModal(po)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => openReceiveModal(po)}
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition"
                              title="Receive Items"
                            >
                              <FiPackage size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openDeleteModal(po)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PurchaseOrderModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPO(null);
        }}
        onSuccess={fetchData}
        purchaseOrder={selectedPO}
        suppliers={suppliers}
        products={products}
      />

      <ViewPOModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
        onReceive={openReceiveModal}
        onEdit={openEditModal}
      />

      <ReceiveItemsModal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          setSelectedPO(null);
        }}
        onSuccess={fetchData}
        purchaseOrder={selectedPO}
      />

      <DeletePOModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPO(null);
        }}
        onConfirm={handleDelete}
        poNumber={selectedPO?.po_number || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}