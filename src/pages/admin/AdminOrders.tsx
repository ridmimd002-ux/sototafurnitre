import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatBDT, formatDate } from '../../lib/formatters';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Printer, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Filter 
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrders(list);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const newHistory = [
        ...(selectedOrder.statusHistory || []),
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: `Status updated to ${newStatus} by admin`
        }
      ];

      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        orderStatus: newStatus,
        statusHistory: newHistory,
        updatedAt: new Date().toISOString()
      });

      setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus, statusHistory: newHistory } : null);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: newStatus, statusHistory: newHistory } : o));

      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Order Status Changed', `Order #${selectedOrder.orderNumber} -> ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async (newPaymentStatus: PaymentStatus) => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      });

      setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, paymentStatus: newPaymentStatus } : o));

      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Order Payment Status Changed', `Order #${selectedOrder.orderNumber} -> ${newPaymentStatus}`);
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        adminNote: adminNoteInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setSelectedOrder(prev => prev ? { ...prev, adminNote: adminNoteInput.trim() } : null);
      alert('Internal note saved.');
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(term);
      const matchName = o.customerName.toLowerCase().includes(term);
      const matchPhone = o.customerPhone.includes(term);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Order Management</h2>
          <p className="text-xs text-gray-500">
            View, track, update statuses, and print invoices for customer orders.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order #, Name, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-[#0f2c59]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ShoppingCart className="w-8 h-8 text-[#0f2c59]" />}
              title="No orders found"
              description="No customer orders currently match your query. Orders placed on the website will be listed here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Delivery Zone</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-black text-[#0f2c59]">
                      {ord.orderNumber}
                      <span className="block text-[10px] text-gray-400 font-normal">
                        {formatDate(ord.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{ord.customerName}</p>
                      <p className="text-[11px] text-gray-500">{ord.customerPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{ord.items.length} item(s)</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {ord.deliveryZone}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        ord.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                        ord.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ord.paymentStatus} ({ord.paymentMethod})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-gray-900">
                      {formatBDT(ord.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setAdminNoteInput(ord.adminNote || '');
                        }}
                        className="px-3 py-1.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Invoice Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <span className="text-xs text-gray-400 font-mono">Invoice / Order Details</span>
                <h3 className="text-xl font-black text-[#0f2c59]">{selectedOrder.orderNumber}</h3>
                <span className="text-[11px] text-gray-500">Recorded on {formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Changers */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Change Order Status:</label>
                <select
                  disabled={updatingStatus}
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleUpdateOrderStatus(e.target.value as OrderStatus)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 font-bold text-[#0f2c59]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Payment Status:</label>
                <select
                  value={selectedOrder.paymentStatus}
                  onChange={(e) => handleUpdatePaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 font-bold text-gray-800"
                >
                  <option value="unpaid">Unpaid (Cash on Delivery)</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Customer & Shipping info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block mb-1">Customer Info</span>
                <p>Name: <strong>{selectedOrder.customerName}</strong></p>
                <p>Phone: <strong>{selectedOrder.customerPhone}</strong></p>
                {selectedOrder.customerEmail && <p>Email: {selectedOrder.customerEmail}</p>}
                {selectedOrder.customerNote && (
                  <p className="text-amber-800 pt-1">Note from customer: "{selectedOrder.customerNote}"</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block mb-1">Shipping Destination</span>
                <p>{selectedOrder.shippingAddress.address}</p>
                <p>{selectedOrder.shippingAddress.upazila}, {selectedOrder.shippingAddress.district}</p>
                <p>Division: <strong>{selectedOrder.shippingAddress.division}</strong></p>
                <p>Zone: <strong>{selectedOrder.deliveryZone}</strong></p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Size / Color</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <img 
                          src={item.productImage || '/logo.png'} 
                          alt="" 
                          className="w-8 h-10 object-cover rounded bg-gray-50 border shrink-0" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                        />
                        <span className="font-bold text-gray-900 truncate max-w-xs">{item.productName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {item.size || 'N/A'} {item.color ? `• ${item.color}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatBDT(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0f2c59]">{formatBDT(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-gray-900">{formatBDT(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({selectedOrder.couponCode || 'Coupon'}):</span>
                    <span>-{formatBDT(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-gray-900">{formatBDT(selectedOrder.deliveryCharge)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-black text-sm text-[#0f2c59]">
                  <span>Grand Total (Cash on Delivery):</span>
                  <span>{formatBDT(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Internal Admin Note */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-gray-700">Internal Admin Note (Private to Store):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Courier tracking code #1234, called customer confirmed delivery"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveAdminNote}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold"
                >
                  Save Note
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
