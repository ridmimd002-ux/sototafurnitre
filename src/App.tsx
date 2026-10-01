import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { WhatsAppFloating } from './components/common/WhatsAppFloating';

import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { CategoryPage } from './pages/customer/CategoryPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { TrackOrderPage } from './pages/customer/TrackOrderPage';
import { AccountPage } from './pages/customer/AccountPage';
import { StaticPage } from './pages/customer/StaticPage';
import { NotFoundPage } from './pages/customer/NotFoundPage';

import { AdminLayout } from './components/admin/AdminLayout';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin routing
  if (currentPath.startsWith('/admin')) {
    return (
      <AuthProvider>
        <SettingsProvider>
          <AdminLayout onNavigateSite={navigate} />
        </SettingsProvider>
      </AuthProvider>
    );
  }

  // Customer routing
  const renderCustomerContent = () => {
    // Dynamic Product Detail: /product/:id
    if (currentPath.startsWith('/product/')) {
      const prodId = currentPath.replace('/product/', '').replace(/\/$/, '');
      return <ProductDetailPage productId={prodId} onNavigate={navigate} />;
    }

    // Dynamic Category: /category/:slug
    if (currentPath.startsWith('/category/')) {
      const catSlug = currentPath.replace('/category/', '').replace(/\/$/, '');
      return <CategoryPage slug={catSlug} onNavigate={navigate} />;
    }

    // Dynamic Order Confirmation: /order-confirmation/:orderId
    if (currentPath.startsWith('/order-confirmation/')) {
      const orderId = currentPath.replace('/order-confirmation/', '').replace(/\/$/, '');
      return <OrderConfirmationPage orderId={orderId} onNavigate={navigate} />;
    }

    // Main Routes
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/shop': {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQ = urlParams.get('q') || '';
        return <ShopPage initialSearchQuery={searchQ} onNavigate={navigate} />;
      }
      case '/cart':
        return <CartPage onNavigate={navigate} />;
      case '/checkout':
        return <CheckoutPage onNavigate={navigate} />;
      case '/track-order':
        return <TrackOrderPage />;
      case '/account':
      case '/login':
      case '/register':
      case '/wishlist':
        return <AccountPage onNavigate={navigate} />;
      case '/about':
      case '/contact':
      case '/shipping-policy':
      case '/return-policy':
      case '/privacy-policy':
      case '/terms':
      case '/size-guide':
      case '/faq': {
        const slug = currentPath.replace('/', '');
        return <StaticPage slug={slug} onNavigate={navigate} />;
      }
      default:
        return <NotFoundPage onNavigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-900 selection:bg-[#f59e0b] selection:text-black">
              <AnnouncementBar />
              <Navbar currentPath={currentPath} onNavigate={navigate} />
              <main className="flex-1">
                {renderCustomerContent()}
              </main>
              <Footer onNavigate={navigate} />
              <WhatsAppFloating />
            </div>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
