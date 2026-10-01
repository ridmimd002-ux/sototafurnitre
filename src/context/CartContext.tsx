import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Coupon, DeliveryZone, Product } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string, color?: string, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  itemsCount: number;
  subtotal: number;
  deliveryZones: DeliveryZone[];
  selectedZone: DeliveryZone | null;
  setSelectedZone: (zone: DeliveryZone) => void;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  grandTotal: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

const defaultZones: DeliveryZone[] = [
  { id: 'inside-dhaka', name: 'Inside Dhaka', charge: 80, estimatedDays: '1-2 Days', isActive: true },
  { id: 'outside-dhaka', name: 'Outside Dhaka', charge: 150, estimatedDays: '3-4 Days', isActive: true }
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sotota_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(defaultZones);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(defaultZones[0]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sotota_cart_items', JSON.stringify(items));
    } catch {
      // storage quota or disabled
    }
  }, [items]);

  // Load delivery zones from Firestore if available
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const q = query(collection(db, 'deliveryZones'), where('isActive', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryZone));
          setDeliveryZones(list);
          if (!selectedZone || !list.find(z => z.id === selectedZone.id)) {
            setSelectedZone(list[0]);
          }
        }
      } catch {
        // Fall back to default zones
      }
    };
    fetchZones();
  }, []);

  const addToCart = (product: Product, size?: string, color?: string, quantity = 1): { success: boolean; message: string } => {
    if (!product.isActive) {
      return { success: false, message: 'This product is currently inactive.' };
    }

    // Determine max available stock for variant or general product
    let maxStock = product.totalStock || 0;
    if (product.variants && product.variants.length > 0) {
      if (size && color) {
        const variant = product.variants.find(v => v.size === size && v.color === color);
        if (!variant || variant.stock < 1) {
          return { success: false, message: 'Selected size and color combination is out of stock.' };
        }
        maxStock = variant.stock;
      }
    }

    if (maxStock < 1) {
      return { success: false, message: 'Sorry, this product is out of stock.' };
    }

    const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;

    setItems(prev => {
      const existingIdx = prev.findIndex(item => 
        item.productId === product.id && 
        item.size === size && 
        item.color === color
      );

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = Math.min(currentQty + quantity, maxStock);
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          maxStock: maxStock
        };
        return copy;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          productImage: (product.images && product.images.length > 0) ? product.images[0] : (product.thumbnail || '/logo.png'),
          slug: product.slug,
          size: size || '',
          color: color || '',
          price: price,
          originalPrice: product.price,
          quantity: Math.min(quantity, maxStock),
          sku: product.sku,
          maxStock: maxStock
        };
        return [...prev, newItem];
      }
    });

    return { success: true, message: 'Item added to your shopping cart!' };
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems(prev => {
      if (!prev[index]) return prev;
      const copy = [...prev];
      const max = copy[index].maxStock || 99;
      copy[index] = { ...copy[index], quantity: Math.min(quantity, max) };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Delivery charge calculation with free delivery threshold support
  const rawDeliveryCharge = selectedZone ? selectedZone.charge : 80;
  const isFreeDelivery = selectedZone?.freeDeliveryThreshold && subtotal >= selectedZone.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : rawDeliveryCharge;

  // Coupon calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (subtotal < appliedCoupon.minOrderAmount) {
      // automatically invalidate if subtotal fell below requirement
      couponDiscount = 0;
    } else {
      if (appliedCoupon.discountType === 'percentage') {
        const calculated = (subtotal * appliedCoupon.discountAmount) / 100;
        couponDiscount = appliedCoupon.maxDiscountAmount 
          ? Math.min(calculated, appliedCoupon.maxDiscountAmount) 
          : calculated;
      } else {
        couponDiscount = Math.min(appliedCoupon.discountAmount, subtotal);
      }
    }
  }

  const grandTotal = Math.max(0, subtotal - couponDiscount) + deliveryCharge;

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code.');
      return false;
    }

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', clean), where('isActive', '==', true));
      const snap = await getDocs(q);

      if (snap.empty) {
        setCouponError('Invalid or expired coupon code.');
        return false;
      }

      const couponDoc = snap.docs[0];
      const couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      // Check expiry
      if (couponData.expiryDate && new Date(couponData.expiryDate).getTime() < Date.now()) {
        setCouponError('This coupon code has expired.');
        return false;
      }

      // Check min order
      if (subtotal < couponData.minOrderAmount) {
        setCouponError(`Minimum order amount of ৳${couponData.minOrderAmount} required for this coupon.`);
        return false;
      }

      // Check usage limit
      if (couponData.usageLimit && couponData.usedCount >= couponData.usageLimit) {
        setCouponError('This coupon usage limit has been reached.');
        return false;
      }

      setAppliedCoupon(couponData);
      return true;
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        itemsCount,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
