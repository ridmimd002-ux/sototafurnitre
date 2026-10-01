import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatBDT, formatDate } from '../../lib/formatters';
import { useSettings } from '../../context/SettingsContext';
import { 
  CheckCircle2, 
  Package, 
  ShoppingBag, 
  Printer, 
  MessageCircle, 
  MapPin, 
  Truck, 
  Phone,
  ArrowRight
} from 'lucide-react';

interface OrderConfirmationPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderId, onNavigate }) => {
  const { settings } = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, 'orders', orderId));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() } as Order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-6">Could not load the requested order confirmation.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 bg-[#0f2c59] text-white text-xs font-bold rounded-lg"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${settings.storeName}, I have placed order #${order.orderNumber}. Total: ${formatBDT(order.total)}. Please confirm my order.`
  );
  const whatsappUrl = `https://wa.me/88${settings.whatsapp}?text=${whatsappMessage}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Printable Invoice Container */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Success Header */}
        <div className="text-center space-y-3 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
            Order Placed Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Thank You For Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Your order has been recorded. Our team will verify your phone number and dispatch your parcel promptly.
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">Order Number</span>
            <strong className="text-[#0f2c59] text-sm font-black">{order.orderNumber}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Order Date</span>
            <strong className="text-gray-800">{formatDate(order.createdAt)}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Payment Method</span>
            <strong className="text-gray-800 uppercase">{order.paymentMethod}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Total Amount</span>
            <strong className="text-[#0f2c59] text-sm font-black">{formatBDT(order.total)}</strong>
          </div>
        </div>

        {/* Delivery Address & Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl border border-gray-100 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-2">
              <MapPin className="w-4 h-4 text-[#0f2c59]" />
              <span>Delivery Address</span>
            </div>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.shippingAddress.address}</p>
            <p className="text-gray-600">
              {order.shippingAddress.upazila}, {order.shippingAddress.district}, {order.shippingAddress.division}
            </p>
            <p className="text-gray-600 flex items-center gap-1 pt-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{order.customerPhone}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-2">
              <Truck className="w-4 h-4 text-[#0f2c59]" />
              <span>Shipping Information</span>
            </div>
            <p className="text-gray-600">Zone: <strong>{order.deliveryZone}</strong></p>
            <p className="text-gray-600">Status: <span className="font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{order.orderStatus}</span></p>
            <p className="text-gray-600">Payment: <span className="font-bold uppercase text-gray-700">{order.paymentStatus}</span></p>
            {order.customerNote && (
              <p className="text-gray-500 italic pt-1">Note: "{order.customerNote}"</p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img 
                      src={item.productImage || '/logo.png'} 
                      alt="" 
                      className="w-10 h-12 object-cover rounded bg-gray-50 border shrink-0" 
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                    />
                    <div>
                      <p className="font-bold text-gray-900">{item.productName}</p>
                      <p className="text-[11px] text-gray-400">
                        {item.size && `Size: ${item.size} `}
                        {item.color && `• Color: ${item.color}`}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">{formatBDT(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#0f2c59]">{formatBDT(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing summary */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-bold text-gray-900">{formatBDT(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount ({order.couponCode || 'Coupon'}):</span>
                <span>-{formatBDT(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge:</span>
              <span className="font-bold text-gray-900">{formatBDT(order.deliveryCharge)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-[#0f2c59]">
              <span>Grand Total (Cash on Delivery):</span>
              <span className="text-lg">{formatBDT(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('/track-order')}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-[#0f2c59]" />
              <span>Track Order</span>
            </button>

            <button
              onClick={() => onNavigate('/shop')}
              className="px-5 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
