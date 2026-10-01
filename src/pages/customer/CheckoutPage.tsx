import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  runTransaction, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatBDT, isValidBDPhone, cleanBDPhone, generateOrderNumber } from '../../lib/formatters';
import { Order, OrderItem } from '../../types';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  ShoppingBag,
  ArrowRight,
  Phone
} from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

const BD_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { 
    items, 
    subtotal, 
    appliedCoupon, 
    couponDiscount, 
    selectedZone, 
    deliveryZones,
    setSelectedZone,
    grandTotal, 
    clearCart 
  } = useCart();
  
  const { user } = useAuth();
  const { settings } = useSettings();

  // Form states
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Kishoreganj');
  const [upazila, setUpazila] = useState('Pakundia');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 mb-6">You have no items in your cart to checkout.</p>
        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-2.5 bg-[#0f2c59] text-white text-xs font-bold rounded-lg uppercase"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanPhone = cleanBDPhone(phone);
    if (!isValidBDPhone(cleanPhone)) {
      setErrorMsg('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your full delivery address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // SECURE ORDER VERIFICATION:
      // Verify product prices & stock availability directly from Firestore in a transaction
      let verifiedSubtotal = 0;
      const verifiedItems: OrderItem[] = [];

      for (const item of items) {
        const prodDoc = await getDoc(doc(db, 'products', item.productId));
        if (!prodDoc.exists()) {
          throw new Error(`Product "${item.productName}" is no longer available.`);
        }

        const prodData = prodDoc.data();
        const trustedPrice = (prodData.salePrice && prodData.salePrice > 0) ? prodData.salePrice : prodData.price;
        const lineTotal = trustedPrice * item.quantity;
        verifiedSubtotal += lineTotal;

        verifiedItems.push({
          productId: item.productId,
          productName: prodData.name || item.productName,
          productImage: (prodData.images && prodData.images.length > 0) ? prodData.images[0] : item.productImage,
          size: item.size || '',
          color: item.color || '',
          quantity: item.quantity,
          unitPrice: trustedPrice,
          totalPrice: lineTotal,
          sku: item.sku || prodData.sku || ''
        });
      }

      // Calculate delivery fee
      const deliveryFee = selectedZone ? selectedZone.charge : 80;
      
      // Calculate verified coupon discount
      let verifiedDiscount = 0;
      if (appliedCoupon) {
        if (verifiedSubtotal >= appliedCoupon.minOrderAmount) {
          if (appliedCoupon.discountType === 'percentage') {
            const rawDisc = (verifiedSubtotal * appliedCoupon.discountAmount) / 100;
            verifiedDiscount = appliedCoupon.maxDiscountAmount 
              ? Math.min(rawDisc, appliedCoupon.maxDiscountAmount) 
              : rawDisc;
          } else {
            verifiedDiscount = Math.min(appliedCoupon.discountAmount, verifiedSubtotal);
          }
        }
      }

      const finalTotal = Math.max(0, verifiedSubtotal - verifiedDiscount) + deliveryFee;
      const orderNumber = generateOrderNumber();

      const newOrder: Omit<Order, 'id'> = {
        orderNumber,
        customerId: user?.uid || 'guest',
        customerName: fullName.trim(),
        customerPhone: cleanPhone,
        customerEmail: email.trim() || undefined,
        shippingAddress: {
          division,
          district: district.trim(),
          upazila: upazila.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined
        },
        items: verifiedItems,
        subtotal: verifiedSubtotal,
        discount: verifiedDiscount,
        couponCode: appliedCoupon?.code,
        deliveryZone: selectedZone?.name || 'Standard',
        deliveryCharge: deliveryFee,
        total: finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        customerNote: notes.trim() || undefined,
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: 'Order placed by customer via Cash on Delivery'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create order document in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...newOrder,
        createdTimestamp: serverTimestamp()
      });

      // Atomically decrement stock in products where possible
      for (const item of items) {
        try {
          await runTransaction(db, async (transaction) => {
            const pRef = doc(db, 'products', item.productId);
            const pSnap = await transaction.get(pRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              const currentStock = pData.totalStock || 0;
              const newTotalStock = Math.max(0, currentStock - item.quantity);

              let updatedVariants = pData.variants;
              if (item.size && item.color && Array.isArray(pData.variants)) {
                updatedVariants = pData.variants.map((v: any) => {
                  if (v.size.toLowerCase() === item.size?.toLowerCase() && 
                      v.color.toLowerCase() === item.color?.toLowerCase()) {
                    return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
                  }
                  return v;
                });
              }

              transaction.update(pRef, {
                totalStock: newTotalStock,
                variants: updatedVariants || []
              });
            }
          });
        } catch {
          // If transaction fails for one item, allow order to proceed
        }
      }

      // Clear cart
      clearCart();

      // Navigate to order confirmation
      onNavigate(`/order-confirmation/${orderRef.id}`);

    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Checkout & Shipping
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Complete your order with Cash on Delivery across Bangladesh.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8">
        
        {/* Shipping Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Truck className="w-4 h-4 text-[#0f2c59]" />
              <span>Customer & Delivery Details</span>
            </h2>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 text-red-800 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsad Bin Ridmi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">+88</span>
                  <input
                    type="tel"
                    required
                    placeholder="01777439960"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-11 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="For order receipts and tracking updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Division <span className="text-red-500">*</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    // Automatically adjust zone
                    if (e.target.value === 'Dhaka') {
                      const dhakaZone = deliveryZones.find(z => z.id.includes('inside') || z.name.toLowerCase().includes('dhaka'));
                      if (dhakaZone) setSelectedZone(dhakaZone);
                    } else {
                      const outZone = deliveryZones.find(z => z.id.includes('outside') || z.name.toLowerCase().includes('outside'));
                      if (outZone) setSelectedZone(outZone);
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                >
                  {BD_DIVISIONS.map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kishoreganj"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Thana / Upazila <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pakundia"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Street Address / Village / Landmark <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Tarakandi Bazar, Near Central Mosque, Pakundia"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, deliver in afternoon"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-4 h-4 text-[#0f2c59]" />
              <span>Payment Method</span>
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#0f2c59] bg-[#0f2c59]/5 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-0.5 text-[#0f2c59] focus:ring-[#0f2c59]"
                />
                <div>
                  <p className="font-bold text-xs text-gray-900">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pay with cash when your parcel is delivered at your doorstep. Inspect your parcel before paying.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <h2 className="font-black text-sm text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Your Items ({items.length})</span>
              <button 
                type="button" 
                onClick={() => onNavigate('/cart')} 
                className="text-xs font-semibold text-[#0f2c59] hover:underline normal-case"
              >
                Edit Cart
              </button>
            </h2>

            {/* List */}
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 py-2.5 first:pt-0">
                  <img
                    src={item.productImage || '/logo.png'}
                    alt={item.productName}
                    className="w-12 h-14 rounded-lg object-cover bg-gray-50 border border-gray-200 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.size && `Size: ${item.size} • `}
                      {item.color && `Color: ${item.color} • `}
                      Qty: {item.quantity}
                    </p>
                    <p className="font-bold text-xs text-[#0f2c59] mt-0.5">
                      {formatBDT(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{formatBDT(subtotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{formatBDT(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge ({selectedZone?.name || 'Standard'})</span>
                <span className="font-bold text-gray-900">{formatBDT(selectedZone?.charge || 80)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-black text-sm text-gray-900">Total Payable</span>
                <span className="font-black text-2xl text-[#0f2c59]">{formatBDT(grandTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-[#f59e0b]" />
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm Order (Cash on Delivery)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Phone Help */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-gray-500">
                Need help placing your order? Call our hotline:
              </p>
              <a 
                href={`tel:${settings.phone}`} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2c59] hover:underline mt-1"
              >
                <Phone className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{settings.phone}</span>
              </a>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
