import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatBDT } from '../../lib/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  ShoppingBag, 
  Trash2, 
  Tag, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  X
} from 'lucide-react';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal, 
    deliveryZones,
    selectedZone,
    setSelectedZone,
    appliedCoupon,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,
    grandTotal 
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponApplying(true);
    await applyCoupon(couponCodeInput);
    setCouponApplying(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-[#0f2c59]" />}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any items to your cart yet. Explore our latest arrivals and premium selections."
          actionText="Explore Shop"
          onAction={() => onNavigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8">
        
        {/* Cart Items List (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
            {items.map((item, idx) => (
              <div key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="p-4 sm:p-5 flex gap-4 sm:gap-6 items-center">
                {/* Product Thumbnail */}
                <div 
                  onClick={() => onNavigate(`/product/${item.productId}`)}
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 cursor-pointer"
                >
                  <img
                    src={item.productImage || '/logo.png'}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 
                    onClick={() => onNavigate(`/product/${item.productId}`)}
                    className="font-bold text-sm text-gray-900 hover:text-[#0f2c59] cursor-pointer truncate"
                  >
                    {item.productName}
                  </h3>

                  {/* Size & Color options */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {item.size && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">
                        Size: <strong className="text-gray-900">{item.size}</strong>
                      </span>
                    )}
                    {item.color && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">
                        Color: <strong className="text-gray-900">{item.color}</strong>
                      </span>
                    )}
                  </div>

                  {/* Unit price */}
                  <div className="text-xs text-gray-600">
                    Unit: <strong className="text-[#0f2c59]">{formatBDT(item.price)}</strong>
                  </div>

                  {/* Controls: Quantity & Remove */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        disabled={item.quantity >= (item.maxStock || 99)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 text-xs font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-sm text-[#0f2c59]">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => onNavigate('/shop')}
              className="font-bold text-[#0f2c59] hover:underline"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary & Coupon (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <h2 className="font-black text-base text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            {/* Subtotal */}
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{formatBDT(subtotal)}</span>
            </div>

            {/* Coupon Code Section */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Promo / Coupon Code
              </label>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-emerald-700 hover:text-red-600"
                    aria-label="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-hidden focus:border-[#0f2c59]"
                  />
                  <button
                    type="submit"
                    disabled={couponApplying || !couponCodeInput.trim()}
                    className="px-4 py-2 bg-[#0f2c59] text-white text-xs font-bold rounded-lg hover:bg-[#0a1f3f] disabled:opacity-50"
                  >
                    {couponApplying ? 'Applying...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
            </div>

            {/* Discount if applicable */}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Coupon Discount</span>
                <span>-{formatBDT(couponDiscount)}</span>
              </div>
            )}

            {/* Delivery Zone Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Delivery Location
              </label>
              <div className="space-y-1.5">
                {deliveryZones.map(zone => (
                  <label
                    key={zone.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedZone?.id === zone.id 
                        ? 'border-[#0f2c59] bg-[#0f2c59]/5 font-bold text-[#0f2c59]' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryZone"
                        checked={selectedZone?.id === zone.id}
                        onChange={() => setSelectedZone(zone)}
                        className="text-[#0f2c59] focus:ring-[#0f2c59]"
                      />
                      <span>{zone.name}</span>
                    </div>
                    <span>{formatBDT(zone.charge)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Charge */}
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Delivery Fee
              </span>
              <span className="font-bold text-gray-900">{formatBDT(selectedZone?.charge || 80)}</span>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
              <span className="font-black text-sm text-gray-900">Grand Total</span>
              <span className="font-black text-2xl text-[#0f2c59]">
                {formatBDT(grandTotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onNavigate('/checkout')}
              className="w-full py-3.5 px-6 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust notices */}
            <div className="pt-2 text-[11px] text-gray-500 text-center space-y-1">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery Available • No Advance Required</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
