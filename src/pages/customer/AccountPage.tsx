import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatBDT, formatDate } from '../../lib/formatters';
import { ProductCard } from '../../components/common/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  LogOut, 
  ShieldCheck, 
  Key, 
  Mail, 
  Lock, 
  Phone, 
  AlertCircle,
  Package,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, login, register, logout, resetPassword, isAdmin } = useAuth();
  const { wishlist, clearWishlist } = useWishlist();
  const { settings } = useSettings();

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Authenticated tab states
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchMyOrders = async () => {
        setLoadingOrders(true);
        try {
          const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
          const snap = await getDocs(q);
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
          list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setOrders(list);
        } catch (err) {
          console.error('Error fetching user orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchMyOrders();
    }
  }, [user]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, displayName.trim(), phone.trim());
      setSuccessMsg('Account created successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg('Password reset instructions sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  // If user is not logged in, show customer Sign In / Sign Up
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-black p-0.5 border-2 border-[#f59e0b] shadow-xs mx-auto overflow-hidden">
              <img src={settings.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl font-black text-gray-900">
              {authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Create an Account' : 'Reset Password'}
            </h1>
            <p className="text-xs text-gray-500">
              {authMode === 'login' 
                ? 'Sign in to access your orders and account settings' 
                : 'Join to track orders and save your wishlist'}
            </p>
          </div>

          {/* Mode switch */}
          {authMode !== 'forgot' && (
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                  authMode === 'login' ? 'border-[#0f2c59] text-[#0f2c59]' : 'border-transparent text-gray-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                  authMode === 'register' ? 'border-[#0f2c59] text-[#0f2c59]' : 'border-transparent text-gray-400'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              {successMsg}
            </div>
          )}

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setErrorMsg(null); }}
                    className="text-[11px] font-semibold text-[#0f2c59] hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsad Bin Ridmi"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="01777439960"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:border-[#0f2c59]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:border-[#0f2c59]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#0f2c59] text-white font-bold text-xs rounded-lg"
              >
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-900"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Quick link to admin */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => onNavigate('/admin')}
              className="text-[11px] text-gray-400 hover:text-[#0f2c59]"
            >
              Store Administrator? Login here →
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Authenticated customer view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0f2c59] text-white flex items-center justify-center font-black text-xl border-2 border-[#f59e0b]">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{user.displayName || 'Customer'}</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-[#f59e0b]/20 text-[#0f2c59] px-2 py-0.5 rounded mt-1">
                <ShieldCheck className="w-3 h-3" />
                Administrator Access
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onNavigate('/admin')}
              className="px-4 py-2 bg-[#0f2c59] text-[#f59e0b] text-xs font-bold rounded-lg border border-[#f59e0b]/40 hover:bg-[#0a1f3f]"
            >
              Go to Admin Panel
            </button>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'orders' ? 'border-[#0f2c59] text-[#0f2c59]' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'wishlist' ? 'border-[#0f2c59] text-[#0f2c59]' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>My Wishlist ({wishlist.length})</span>
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <p className="text-xs text-gray-400">Loading your orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <EmptyState
                icon={<ShoppingBag className="w-8 h-8 text-[#0f2c59]" />}
                title="No orders yet"
                description="You haven't placed any orders yet. Explore our store and place your first order with Cash on Delivery!"
                actionText="Start Shopping"
                onAction={() => onNavigate('/shop')}
              />
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-gray-100 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#0f2c59] text-sm mr-2">{order.orderNumber}</span>
                    <span className="text-gray-400">Placed on {formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                      {order.orderStatus}
                    </span>
                    <span className="font-bold text-gray-900">{formatBDT(order.total)}</span>
                  </div>
                </div>

                {/* Items in order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center text-xs">
                      <img 
                        src={item.productImage || '/logo.png'} 
                        alt="" 
                        className="w-12 h-14 object-cover rounded bg-gray-50 border shrink-0" 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                        <p className="text-[11px] text-gray-400">
                          {item.size && `Size: ${item.size} • `}
                          Qty: {item.quantity}
                        </p>
                        <p className="text-[#0f2c59] font-bold">{formatBDT(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onNavigate('/track-order')}
                    className="text-xs font-bold text-[#0f2c59] hover:underline"
                  >
                    Track Progress →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <EmptyState
                icon={<Heart className="w-8 h-8 text-red-500" />}
                title="Your Wishlist is Empty"
                description="Save items you like by tapping the heart icon on any product."
                actionText="Explore Shop"
                onAction={() => onNavigate('/shop')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlist.map(p => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
