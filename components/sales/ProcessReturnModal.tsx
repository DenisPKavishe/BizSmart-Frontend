// app/components/sales/ProcessReturnModal.tsx - FULL COMPLETE CODE

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { salesApi, financialsApi, inventoryApi } from '@/services/api';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

interface SaleItem {
  id: number;
  product_id?: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_id?: number;
  sale_date: string;
  items?: SaleItem[];
}

const returnReasons = [
  { value: 'damaged', label: 'Damaged Product', restock: false },
  { value: 'wrong_item', label: 'Wrong Item Sent', restock: true },
  { value: 'defective', label: 'Defective/Not Working', restock: false },
  { value: 'wrong_size', label: 'Wrong Size/Fit', restock: true },
  { value: 'customer_request', label: 'Customer Changed Mind', restock: true },
  { value: 'expired', label: 'Expired Product', restock: false },
  { value: 'other', label: 'Other Reason', restock: false },
];

interface ReturnItem {
  sale_item_id: number;
  product_id?: number;
  product_name: string;
  max_quantity: number;
  quantity: number;
  reason: string;
  refund_amount: number;
  notes: string;
  restock: boolean;
  unit_cost?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => {
  if (!value && value !== 0) return 'TZS 0';
  return `TZS ${value.toLocaleString()}`;
};

export default function ProcessReturnModal({ isOpen, onClose, sale, onSuccess }: Props) {
  const { user } = useAuthStore();
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && sale && sale.items) {
      const initialItems = sale.items.map(item => ({
        sale_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        max_quantity: item.quantity,
        quantity: 0,
        reason: 'customer_request',
        refund_amount: 0,
        notes: '',
        restock: true,
        unit_cost: item.unit_price,
      }));
      setReturnItems(initialItems);
      setSelectedItems([]);
    }
  }, [isOpen, sale]);

  const toggleItemSelection = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...returnItems];
    const item = updated[index];
    const maxQty = item.max_quantity;
    const newQuantity = Math.min(maxQty, Math.max(0, quantity));
    item.quantity = newQuantity;
    const saleItem = sale?.items?.find(i => i.id === item.sale_item_id);
    if (saleItem) {
      item.refund_amount = newQuantity * saleItem.unit_price;
    }
    setReturnItems(updated);
  };

  const updateReason = (index: number, reason: string) => {
    const updated = [...returnItems];
    const reasonConfig = returnReasons.find(r => r.value === reason);
    updated[index].reason = reason;
    updated[index].restock = reasonConfig?.restock || false;
    setReturnItems(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...returnItems];
    updated[index].notes = notes;
    setReturnItems(updated);
  };

  const createRefundTransaction = async (refundAmount: number, invoiceNumber: string, reason: string) => {
    try {
      await financialsApi.createTransaction({
        type: 'expense',
        category: 'refunds',
        amount: refundAmount,
        description: `Refund for sale ${invoiceNumber} - Reason: ${reason}`,
        transaction_date: new Date().toISOString().split('T')[0],
        business: user?.business,
        created_by: user?.id,
      });
      return true;
    } catch (error) {
      console.error('Failed to create refund transaction:', error);
      return false;
    }
  };

  const updateCustomerTotalSpent = async (customerId: number, refundAmount: number) => {
    try {
      const customersRes = await salesApi.getCustomers();
      const customers = customersRes.data.results || customersRes.data || [];
      const customer = customers.find((c: any) => c.id === customerId);
      
      if (customer) {
        const currentTotal = parseFloat(customer.total_spent) || 0;
        const newTotal = Math.max(0, currentTotal - refundAmount);
        
        await salesApi.updateCustomer(customerId, {
          total_spent: newTotal,
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to update customer total spent:', error);
      return false;
    }
  };

  const restoreInventory = async (productId: number, quantity: number, unitCost: number, notes: string) => {
    try {
      await inventoryApi.stockIn(productId, quantity, unitCost, notes);
      return true;
    } catch (error) {
      console.error('Failed to restore inventory:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter((_, idx) => selectedItems.includes(idx) && _.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const item of itemsToReturn) {
        // 1. Create return record
        await salesApi.createReturn({
          sale: sale?.id,
          sale_item: item.sale_item_id,
          quantity_returned: item.quantity,
          reason: item.reason,
          refund_amount: item.refund_amount,
          notes: item.notes,
          business: user?.business,
          created_by: user?.id,
        });
        successCount++;

        // 2. Restore inventory if applicable
        if (item.restock && item.product_id && item.unit_cost) {
          const notes = `Customer return - ${item.reason} - Sale: ${sale?.invoice_number}`;
          await restoreInventory(item.product_id, item.quantity, item.unit_cost, notes);
          console.log(`Inventory restored for product ${item.product_name}: +${item.quantity} at cost ${item.unit_cost}`);
        }
      }

      // 3. Create single refund transaction for total amount
      const totalRefundAmount = itemsToReturn.reduce((sum, item) => sum + item.refund_amount, 0);
      const reasonsList = itemsToReturn.map(i => i.reason);
      const uniqueReasons = Array.from(new Set(reasonsList));
      const reasons = uniqueReasons.join(', ');
      
      await createRefundTransaction(totalRefundAmount, sale?.invoice_number || '', reasons);

      // 4. Update customer total spent if customer exists
      if (sale?.customer_id) {
        await updateCustomerTotalSpent(sale.customer_id, totalRefundAmount);
      }

      const restockedItems = itemsToReturn.filter(i => i.restock).length;
      const nonRestockedItems = itemsToReturn.filter(i => !i.restock).length;
      
      let successMessage = `${successCount} item(s) returned successfully. `;
      if (restockedItems > 0) {
        successMessage += `${restockedItems} item(s) restored to inventory. `;
      }
      if (nonRestockedItems > 0) {
        successMessage += `${nonRestockedItems} item(s) marked as damaged/disposed.`;
      }
      
      toast.success(successMessage);
      onSuccess();
      onClose();
      
    } catch (error: any) {
      errorCount++;
      console.error('Failed to process return:', error);
      toast.error(error.response?.data?.message || `Failed to process return for ${errorCount} item(s)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRefund = returnItems.reduce((sum, item, idx) => {
    if (selectedItems.includes(idx)) {
      return sum + item.refund_amount;
    }
    return sum;
  }, 0);

  const restockCount = returnItems.filter((_, idx) => selectedItems.includes(idx) && returnItems[idx].restock && returnItems[idx].quantity > 0).length;

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Process Return</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sale Information */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Invoice Number</span>
              <span className="text-sm font-semibold text-brand-600">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Customer</span>
              <span className="text-sm">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Sale Date</span>
              <span className="text-sm">{new Date(sale.sale_date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Items to Return */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Select Items to Return</h4>
            <div className="space-y-4">
              {sale.items?.map((item, idx) => {
                const isSelected = selectedItems.includes(idx);
                const returnItem = returnItems[idx];
                
                return (
                  <div key={item.id} className={`border rounded-xl p-4 transition ${isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(idx)}
                        className="mt-1 w-4 h-4 text-brand-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                          </div>
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(item.unit_price)} each</p>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity to Return</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={returnItem?.quantity || 0}
                                  onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Max: {item.quantity}</p>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Return Reason</label>
                                <select
                                  value={returnItem?.reason || 'customer_request'}
                                  onChange={(e) => updateReason(idx, e.target.value)}
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                >
                                  {returnReasons.map(reason => (
                                    <option key={reason.value} value={reason.value}>
                                      {reason.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Notes (Optional)</label>
                              <textarea
                                value={returnItem?.notes || ''}
                                onChange={(e) => updateNotes(idx, e.target.value)}
                                rows={2}
                                placeholder="Additional details about the return..."
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                            
                            {/* Inventory Action Indicator */}
                            {returnItem?.quantity > 0 && (
                              <div className={`rounded-lg p-2 text-xs ${returnItem.restock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {returnItem.restock 
                                  ? `Will be restored to inventory (+${returnItem.quantity} units)` 
                                  : `Will NOT be restored to inventory (Damaged/Defective)`}
                              </div>
                            )}
                            
                            {returnItem?.refund_amount > 0 && (
                              <div className="bg-blue-50 rounded-lg p-2">
                                <p className="text-xs text-gray-600">Refund Amount</p>
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(returnItem.refund_amount)}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary */}
          {totalRefund > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Refund Amount</span>
                <span className="text-2xl font-bold text-red-600">{formatCurrency(totalRefund)}</span>
              </div>
              {restockCount > 0 && (
                <p className="text-xs text-green-600">
                  {restockCount} item(s) will be restored to inventory
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Note: This will create a refund expense and update customer records
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || totalRefund === 0}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Process Return (${formatCurrency(totalRefund)})`}
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