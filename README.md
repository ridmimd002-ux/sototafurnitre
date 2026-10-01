# Sotota Furniture & Electronics — Complete E-Commerce Platform

A production-ready e-commerce platform built for **Sotota Furniture & Electronics** (Tarakandi Bazar, Pakundia, Kishoreganj, Bangladesh). The platform supports furniture, electronics, and fashion/clothing with dynamic size-color variant matrix inventory, Cash on Delivery, order tracking, admin console, and direct Firebase integration.

---

## 1. Project Information & Credentials

| Property | Value |
| :--- | :--- |
| **Store Name** | Sotota Furniture & Electronics |
| **Business Address** | Tarakandi Bazar, Pakundia, Kishoregenj |
| **Hotline Phone** | `01777439960` |
| **WhatsApp Number** | `01777439960` |
| **Official Email** | `monsadbinridmi1292@gmail.com` |
| **Currency** | BDT (৳) |
| **Timezone** | Asia/Dhaka |
| **Admin Route** | `/admin` |
| **Configured Admin UID** | `jawGRLgtOBNKX75rKXap6Jnr3P22` |
| **Configured Admin Email** | `monsadbinridmi1292@gmail.com` |

---

## 2. Technology Stack

- **Frontend Framework:** React 19 with TypeScript
- **Bundler & Build Tool:** Vite
- **Styling:** Tailwind CSS with centralized theme variables
- **Backend / BaaS:** Firebase (Firestore, Firebase Authentication, Firebase Storage)
- **Icons:** Lucide React
- **Design Inspiration:** Modern Bangladeshi e-commerce architecture

---

## 3. Architecture & Key Features

### Customer-Facing Store
1. **Homepage (`/`):**
   - Hero promotions banner slider (database-driven via Firestore `banners`)
   - Nationwide Trust Badges (Cash on Delivery across Bangladesh, 7-day exchange, authentic quality, direct showroom contact)
   - Dynamic department categories carousel
   - Featured products, New Arrivals, and Best Sellers
   - Pakundia showroom highlight & hotline
2. **Shop Page (`/shop`):**
   - Full product catalog with real-time multi-facet filtering (Category, Subcategory, Price slider, Sizes S/M/L/XL/etc., Color swatches, In-Stock only)
   - Sorting by Newest, Price (Low to High), Price (High to Low), Popularity, and Featured
   - Search by product name, SKU, or tags
   - Mobile filter drawer
3. **Category Pages (`/category/:slug`):**
   - Dynamic category views
4. **Product Details Page (`/product/:id`):**
   - Multi-image gallery with zoom/cover selection
   - Real-time stock status (In Stock, Low Stock, Out of Stock)
   - Dynamic variant inventory lookup: Selecting Size and Color instantly reflects real available stock from the variant matrix
   - Size Guide Modal with measurements in inches for Bangladeshi sizing
   - Quantity selector bounded by available inventory
   - "Add to Cart" and instant "Buy Now" (Cash on Delivery)
   - Verified customer reviews with star ratings and submission form
   - Related products from same category
5. **Shopping Cart (`/cart`):**
   - Cart line items with selected size and color
   - Quantity modification with inventory limit protection
   - Promo coupon code verification against Firestore `coupons`
   - Delivery zone selection (Inside Dhaka ৳80, Outside Dhaka ৳150)
   - Live subtotal, discount, and grand total calculation
6. **Checkout (`/checkout`):**
   - Bangladesh-tailored checkout form (Division, District, Upazila/Thana, Full Street Address, 11-digit mobile validation)
   - Cash on Delivery default payment method
   - Secure server-verified price recalculation (fetches real product prices from Firestore to prevent devtools manipulation)
   - Atomic inventory deduction in Firestore
7. **Order Confirmation (`/order-confirmation/:orderId`):**
   - Order summary and unique Order ID (e.g. `SFE-XXXXXX`)
   - Direct WhatsApp Order Confirmation button (prefills message to `01777439960`)
   - Printable receipt generator
8. **Track Order (`/track-order`):**
   - Track order progress by Order Number or 11-digit mobile phone
   - Visual step-by-step progress timeline: Placed → Confirmed → Processing → Packed → Shipped → Delivered
9. **Customer Account (`/account`):**
   - Registration and Login with Firebase Authentication
   - Real-time order history with order statuses
   - Saved wishlist
10. **Information Pages:**
    - `/about`, `/contact`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms`, `/size-guide`, `/faq`

---

### Admin Panel (`/admin`)
1. **Access Control (RBAC):**
   - Dedicated login at `/admin/login`
   - Enforces UID matching (`jawGRLgtOBNKX75rKXap6Jnr3P22`), configured email (`monsadbinridmi1292@gmail.com`), or custom claim `admin: true`
   - Unauthorized users see an Access Denied barrier without revealing internal credentials
2. **Dashboard (`/admin`):**
   - 100% REAL metrics directly from Firestore: Total Orders, Pending Orders, Real Revenue (from paid/delivered orders), Total Products, Active vs Inactive, Low Stock items, Registered Customers
   - Setup checklist when database is in a clean initial state
3. **Product Management (`/admin/products`):**
   - Create, edit, and delete products
   - Full clothing & retail specifications: Title, Slug, SKU, Category, Subcategory, Brand, Gender, Fabric/Material, Regular Price, Sale Price, Cost Price (admin only)
   - Multi-image uploader with client-side compression and cover reordering
   - Dynamic Variant Matrix (combinations of Sizes x Colors with individual stock units and SKUs)
   - Active/Inactive toggle, Featured, New Arrival, Best Seller
4. **Category Management (`/admin/categories`):**
   - Create, edit, reorder, and delete categories with images
5. **Order Management (`/admin/orders`):**
   - View, search, and filter orders by status
   - Order detail modal with customer address and line items
   - Update order status (Pending → Confirmed → Processing → Packed → Shipped → Delivered → Cancelled)
   - Update payment status (Unpaid, Paid, Refunded)
   - Add internal store notes
   - Print commercial invoice
6. **Customer Management (`/admin/customers`):**
   - View real registered customer profiles, order frequency, and total lifetime spend
7. **Inventory Management (`/admin/inventory`):**
   - Real-time stock overview with one-click adjustments and low stock alerts (≤ 5 units)
8. **Coupon Management (`/admin/coupons`):**
   - Create promo discount codes (percentage or flat BDT, min order requirement, max discount cap, expiry, usage limits)
9. **Delivery Zones (`/admin/delivery`):**
   - Configure delivery zones, charges (Inside Dhaka, Outside Dhaka), estimated delivery days, and free delivery thresholds
10. **Banner Management (`/admin/banners`):**
    - Manage homepage hero banners, titles, images, and links
11. **Review Moderation (`/admin/reviews`):**
    - Approve or hide submitted customer product reviews
12. **Static Pages (`/admin/pages`):**
    - Edit store policies and About Us text
13. **Store Settings (`/admin/settings`):**
    - Manage phone hotline, WhatsApp number, email, address, announcement bar message and active status
14. **Audit Logs (`/admin/audit-logs`):**
    - Audit trail logging all admin modifications

---

## 4. Environment Variables (`.env`)

```bash
VITE_FIREBASE_API_KEY="AIzaSyBSVLifG87ekxt_qEb6SmzYO00gLdpD_pA"
VITE_FIREBASE_AUTH_DOMAIN="sotota-furniture-8c587.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="sotota-furniture-8c587"
VITE_FIREBASE_STORAGE_BUCKET="sotota-furniture-8c587.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1029908127837"
VITE_FIREBASE_APP_ID="1:1029908127837:web:7106803bb8c55a89bdadb4"

VITE_ADMIN_UID="jawGRLgtOBNKX75rKXap6Jnr3P22"
VITE_ADMIN_EMAIL="monsadbinridmi1292@gmail.com"
```

---

## 5. Firestore Database Collections

The application uses the following Firestore root collections:
1. `products`: Catalog items, price, variants, stock, fabric, images
2. `categories`: Product departments, slugs, sort order
3. `orders`: Customer orders, line items, address, status, totals
4. `coupons`: Discount codes, rules, usage limits
5. `deliveryZones`: Shipping zones, charges, delivery times
6. `banners`: Homepage sliders, buttons, links
7. `reviews`: Customer reviews and approval state
8. `users`: Customer profiles and order counts
9. `settings/general`: Store metadata, contact details, announcement text
10. `auditLogs`: Administrative event records

---

## 6. Recommended Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && (
        request.auth.uid == 'jawGRLgtOBNKX75rKXap6Jnr3P22' ||
        request.auth.token.email == 'monsadbinridmi1292@gmail.com' ||
        request.auth.token.admin == true
      );
    }
    
    // Public Catalog: Anyone can read active products and categories
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /deliveryZones/{zoneId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /coupons/{couponId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Orders: Anyone can create a new order (guest or registered);
    // Customers can read their own orders; Admins can read & update all
    match /orders/{orderId} {
      allow create: if true;
      allow read: if isAdmin() || (request.auth != null && resource.data.customerId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // Reviews: Public can read approved reviews; Any user can submit; Admin moderates
    match /reviews/{reviewId} {
      allow read: if resource.data.isApproved == true || isAdmin();
      allow create: if request.resource.data.isApproved == false;
      allow update, delete: if isAdmin();
    }

    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    // Audit logs: Admin only
    match /auditLogs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 7. Development & Production Build

### Running Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Production Build
```bash
npm run build
```
Build output is saved to the `dist` folder.
