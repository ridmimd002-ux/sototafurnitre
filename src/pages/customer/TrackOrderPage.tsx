import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { formatBDT, formatDate, cleanBDPhone } from '../../lib/formatters';
import { 
  Package, 
  Search, 
  CheckCircle, 
  Clock, 
  Truck, 
  CheckCheck, 
  AlertCircle,
  Phone,
  Calendar,
  XCircle,
  MapPin
} from 'lucide-react';

const ORDER_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCheck },
];

export const TrackOrderPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;

    setSearching(true);
    setErrorMsg(null);
    setOrders(null);

    try {
      let matchedOrders: Order[] = [];

      // If looks like an order number (e.g. SFE-123456 or 123456)
      if (clean.toUpperCase().startsWith('SFE-')) {
        const q = query(collection(db, 'orders'), where('orderNumber', '==', clean.toUpperCase()));
        const snap = await getDocs(q);
        matchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      } else if (/^\d{6,}$/.test(clean) && !clean.startsWith('01')) {
        // Maybe typed just number
        const q = query(collection(db, 'orders'), where('orderNumber', '==', `SFE-${clean}`));
        const snap = await getDocs(q);
        matchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      } else {
        // Search by phone number
        const cleanedPhone = cleanBDPhone(clean);
        const q = query(collection(db, 'orders'), where('customerPhone', '==', cleanedPhone));
        const snap = await getDocs(q);
        matchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      }

      if (matchedOrders.length === 0) {
        setErrorMsg('No orders found matching this Order Number or Phone Number. Please verify your details.');
      } else {
        // sort by newest
        matchedOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setOrders(matchedOrders);
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setErrorMsg('Failed to look up order. Please check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const getStepIndex = (status: OrderStatus): number => {
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      packed: 3,
      shipped: 4,
      delivered: 5,
      cancelled: -1,
      returned: -1,
      refunded: -1
    };
    return map[status] ?? 0;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      {/* Search Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#0f2c59]/5 border border-[#0f2c59]/10 text-[#0f2c59] flex items-center justify-center mx-auto mb-2">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Enter your Order Number (e.g. SFE-123456) or your 11-digit mobile phone number to check current shipping progress.
        </p>

        {/* Search input form */}
        <form onSubmit={handleTrack} className="max-w-lg mx-auto pt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. SFE-123456 or 01777439960"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl pl-4 pr-10 py-3 shadow-2xs focus:outline-hidden focus:border-[#0f2c59]"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchInput.trim()}
            className="px-6 py-3 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{searching ? 'Checking...' : 'Track'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="max-w-lg mx-auto p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {orders && orders.length > 0 && (
        <div className="space-y-8">
          {orders.map((ord) => {
            const currentStepIdx = getStepIndex(ord.orderStatus);
            const isCancelled = ['cancelled', 'returned', 'refunded'].includes(ord.orderStatus);

            return (
              <div 
                key={ord.id} 
                className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <span className="text-xs text-gray-400">Order Reference</span>
                    <h2 className="text-lg font-black text-[#0f2c59]">{ord.orderNumber}</h2>
                    <p className="text-[11px] text-gray-500">Placed on {formatDate(ord.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      isCancelled
                        ? 'bg-red-100 text-red-700'
                        : ord.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {ord.orderStatus}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      Total: <strong className="text-gray-900">{formatBDT(ord.total)}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Timeline */}
                {isCancelled ? (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-xs text-red-800">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-bold">Order {ord.orderStatus.toUpperCase()}</p>
                      <p>This order has been marked as {ord.orderStatus}. For inquiries, please contact our support.</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="relative">
                      {/* Connection bar */}
                      <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
                      <div 
                        className="hidden sm:block absolute top-1/2 left-0 h-1 bg-[#0f2c59] -translate-y-1/2 z-0 transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, (currentStepIdx / (ORDER_STEPS.length - 1)) * 100))}%` }}
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                        {ORDER_STEPS.map((step, idx) => {
                          const isDone = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          const StepIcon = step.icon;

                          return (
                            <div key={step.status} className="flex flex-col items-center text-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isDone 
                                  ? 'bg-[#0f2c59] text-white shadow-xs' 
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                              } ${isCurrent ? 'ring-4 ring-[#f59e0b]/40 scale-110' : ''}`}>
                                <StepIcon className="w-5 h-5" />
                              </div>
                              <span className={`text-[11px] font-bold mt-2 ${
                                isDone ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping destination & items count */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0f2c59]" />
                    <span>Destination: <strong>{ord.shippingAddress.district}, {ord.shippingAddress.division}</strong></span>
                  </div>
                  <div>
                    <span>Items in order: <strong>{ord.items.length}</strong></span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
