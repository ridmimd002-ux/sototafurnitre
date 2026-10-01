import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronDown, 
  PhoneCall, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Category } from '../../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { itemsCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setCategories(list);
      } catch {
        // Safe fallback
      }
    };
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Official Brand Logo */}
          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group py-1"
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-black p-0.5 border-2 border-[#f59e0b] shadow-xs group-hover:scale-105 transition-transform duration-200">
              <img 
                src={settings.logoUrl || "/logo.png"} 
                alt="Sotota Furniture & Electronics Logo" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#0f2c59] leading-tight group-hover:text-[#f59e0b] transition-colors">
                {settings.storeName}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
                Pakundia, Kishoreganj
              </span>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-6">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search products by title, SKU, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full pl-5 pr-11 py-2.5 focus:outline-hidden focus:border-[#0f2c59] focus:bg-white focus:ring-2 focus:ring-[#0f2c59]/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#0f2c59] text-white rounded-full hover:bg-[#0a1f3f] flex items-center justify-center transition-colors"
                aria-label="Search products"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Track Order Quick Link */}
            <button
              onClick={() => onNavigate('/track-order')}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#0f2c59] py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Package className="w-4 h-4 text-[#f59e0b]" />
              <span>Track Order</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('/wishlist')}
              className="relative p-2.5 text-gray-700 hover:text-[#0f2c59] hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#f59e0b] text-gray-900 font-bold text-[10px] rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => onNavigate('/cart')}
              className="relative p-2.5 text-[#0f2c59] bg-[#0f2c59]/5 hover:bg-[#0f2c59]/10 rounded-full transition-colors flex items-center"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#0f2c59]" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0f2c59] text-white font-bold text-xs rounded-full flex items-center justify-center shadow-xs">
                  {itemsCount}
                </span>
              )}
            </button>

            {/* User Account / Admin Link */}
            <button
              onClick={() => onNavigate('/account')}
              className="flex items-center gap-1.5 p-2 text-gray-700 hover:text-[#0f2c59] rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Account"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-gray-800">
                {user ? (user.displayName || 'My Account') : 'Sign In'}
              </span>
            </button>

            {/* Admin Badge link if authorized */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('/admin')}
                className="hidden sm:flex items-center gap-1 text-xs font-bold bg-[#0f2c59] text-[#f59e0b] px-3 py-1.5 rounded-lg border border-[#f59e0b]/40 hover:bg-[#0a1f3f] shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-hidden focus:border-[#0f2c59]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 text-[#0f2c59] flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Secondary Navigation Bar (Desktop) */}
      <nav className="hidden lg:block bg-[#0f2c59] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            
            <div className="flex items-center space-x-1">
              
              {/* Categories Mega Dropdown Button */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-gray-900 font-bold text-xs uppercase tracking-wider rounded-md hover:bg-[#fbbf24] transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isCategoryDropdownOpen && (
                  <div 
                    onMouseLeave={() => setIsCategoryDropdownOpen(false)}
                    className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn"
                  >
                    {categories.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-500">
                        No categories yet
                      </div>
                    ) : (
                      categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onNavigate(`/category/${cat.slug}`);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#0f2c59] flex items-center justify-between transition-colors"
                        >
                          <span>{cat.name}</span>
                          <span className="text-gray-400">→</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Standard Links */}
              <button
                onClick={() => onNavigate('/')}
                className={`px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors ${
                  currentPath === '/' ? 'text-[#f59e0b]' : 'text-gray-200 hover:text-white'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => onNavigate('/shop')}
                className={`px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors ${
                  currentPath.startsWith('/shop') ? 'text-[#f59e0b]' : 'text-gray-200 hover:text-white'
                }`}
              >
                All Products
              </button>

              {/* Dynamic Categories in Nav */}
              {categories.slice(0, 5).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(`/category/${cat.slug}`)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    currentPath === `/category/${cat.slug}` ? 'text-[#f59e0b] font-bold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              <button
                onClick={() => onNavigate('/size-guide')}
                className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                Size Guide
              </button>

              <button
                onClick={() => onNavigate('/contact')}
                className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Helpline indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <PhoneCall className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Helpline: <strong className="text-white">{settings.phone}</strong></span>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Header in Drawer */}
            <div className="p-4 bg-[#0f2c59] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={settings.logoUrl || "/logo.png"} alt="Logo" className="w-8 h-8 rounded-full border border-[#f59e0b]" />
                <span className="font-bold text-sm">{settings.storeName}</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-gray-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Links in Drawer */}
            <div className="py-4 px-4 space-y-1 divide-y divide-gray-100 flex-1">
              <div className="space-y-1 pb-3">
                <button
                  onClick={() => { onNavigate('/'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#0f2c59]"
                >
                  Home
                </button>
                <button
                  onClick={() => { onNavigate('/shop'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#0f2c59]"
                >
                  All Products
                </button>
                <button
                  onClick={() => { onNavigate('/track-order'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#0f2c59]"
                >
                  Track Order
                </button>
                <button
                  onClick={() => { onNavigate('/size-guide'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#0f2c59]"
                >
                  Size Guide
                </button>
              </div>

              {/* Categories */}
              <div className="pt-3 pb-3">
                <span className="block px-3 text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">
                  Categories
                </span>
                {categories.length === 0 ? (
                  <p className="px-3 text-xs text-gray-500">No categories added yet</p>
                ) : (
                  categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { onNavigate(`/category/${cat.slug}`); setIsMobileMenuOpen(false); }}
                      className="w-full text-left py-2 px-3 text-sm text-gray-700 hover:text-[#0f2c59] hover:bg-gray-50 rounded-md"
                    >
                      {cat.name}
                    </button>
                  ))
                )}
              </div>

              {/* Quick info */}
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => { onNavigate('/about'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 text-xs text-gray-600 hover:text-gray-900"
                >
                  About Us
                </button>
                <button
                  onClick={() => { onNavigate('/contact'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 text-xs text-gray-600 hover:text-gray-900"
                >
                  Contact & Support
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { onNavigate('/admin'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-3 text-xs font-bold text-[#0f2c59] bg-[#f59e0b]/20 rounded-md"
                  >
                    Go to Admin Dashboard
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Contact */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{settings.address}</p>
              <p>Hotline: {settings.phone}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
