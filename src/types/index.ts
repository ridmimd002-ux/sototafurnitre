export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number;
  costPrice?: number; // Admin visible only
  category: string;
  subcategory?: string;
  brand?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids' | 'general';
  fabric?: string;
  shortDescription?: string;
  description: string;
  specifications?: ProductSpecification[];
  images: string[];
  thumbnail?: string;
  sizes: string[];
  colors: ProductColor[];
  variants: ProductVariant[];
  totalStock: number;
  weight?: string;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  slug: string;
  size?: string;
  color?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  sku?: string;
  maxStock: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  charge: number;
  estimatedDays: string;
  freeDeliveryThreshold?: number;
  isActive: boolean;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'online';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    division: string;
    district: string;
    upazila?: string;
    address: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryZone: string;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNote?: string;
  adminNote?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  currency: string;
  currencySymbol: string;
  announcementBar: string;
  announcementActive: boolean;
  logoUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aboutText?: string;
  returnPolicySnippet?: string;
  freeShippingNotice?: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

export interface CustomerUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  addresses?: {
    id: string;
    title: string;
    division: string;
    district: string;
    upazila: string;
    address: string;
    isDefault?: boolean;
  }[];
  ordersCount?: number;
  totalSpent?: number;
  createdAt: string;
}
