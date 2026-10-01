import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category, Banner } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductCardSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { useSettings } from '../../context/SettingsContext';
import { 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  PhoneCall, 
  MapPin,
  ChevronRight
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        // Load active banners
        const bannerQ = query(
          collection(db, 'banners'), 
          where('isActive', '==', true),
          limit(5)
        );
        const bannerSnap = await getDocs(bannerQ);
        const bannerList = bannerSnap.docs.map(d => ({ id: d.id, ...d.data() } as Banner));
        bannerList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setBanners(bannerList);

        // Load active categories
        const catQ = query(
          collection(db, 'categories'), 
          where('isActive', '==', true),
          limit(8)
        );
        const catSnap = await getDocs(catQ);
        const catList = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        catList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setCategories(catList);

        // Load featured products
        const featQ = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          where('isFeatured', '==', true),
          limit(8)
        );
        const featSnap = await getDocs(featQ);
        setFeaturedProducts(featSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

        // Load new arrivals
        const newQ = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          where('isNewArrival', '==', true),
          limit(8)
        );
        const newSnap = await getDocs(newQ);
        setNewArrivals(newSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

        // Load best sellers
        const bestQ = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          where('isBestSeller', '==', true),
          limit(8)
        );
        const bestSnap = await getDocs(bestQ);
        setBestSellers(bestSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

      } catch (err) {
        console.warn('Error loading homepage data from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1b33] via-[#0f2c59] to-[#1e3a8a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        {banners.length > 0 ? (
          /* Render Active Store Banners */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Collection
                </span>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                  {banners[0].title}
                </h1>
                {banners[0].subtitle && (
                  <p className="text-sm sm:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0">
                    {banners[0].subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={() => onNavigate(banners[0].buttonLink || '/shop')}
                    className="px-8 py-3.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-gray-900 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
                  >
                    <span>{banners[0].buttonText || 'Shop Collection'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => onNavigate('/track-order')}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl backdrop-blur-xs border border-white/20 transition-colors"
                  >
                    Track My Order
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#f59e0b]/30 max-h-[420px] w-full max-w-md">
                  <img
                    src={banners[0].image}
                    alt={banners[0].title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Brand Showcase */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Official Online Store</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Premium Quality, <br />
                  <span className="text-[#f59e0b]">Honest Pricing.</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Welcome to {settings.storeName}. Experience effortless shopping with Cash on Delivery all across Bangladesh. Quality furniture, electronics, and fashion apparel delivered to your doorstep.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={() => onNavigate('/shop')}
                    className="px-8 py-3.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-gray-900 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => onNavigate('/track-order')}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl backdrop-blur-xs border border-white/20 transition-colors"
                  >
                    Track Existing Order
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative group p-4">
                  <div className="absolute inset-0 bg-[#f59e0b]/20 rounded-full filter blur-3xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-black p-3 border-4 border-[#f59e0b] shadow-2xl overflow-hidden flex items-center justify-center">
                    <img 
                      src={settings.logoUrl || "/logo.png"} 
                      alt={settings.storeName}
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Trust Badges Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2c59]/5 text-[#0f2c59] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-[#0f2c59]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
              <p className="text-[11px] text-gray-500">Pay at your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2c59]/5 text-[#0f2c59] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-[#0f2c59]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">7 Days Exchange</p>
              <p className="text-[11px] text-gray-500">Size & quality guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2c59]/5 text-[#0f2c59] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0f2c59]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">100% Authentic</p>
              <p className="text-[11px] text-gray-500">Genuine items only</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2c59]/5 text-[#0f2c59] flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-[#0f2c59]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Direct Support</p>
              <p className="text-[11px] text-gray-500">{settings.phone}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Browse By Department</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Featured Categories</h2>
          </div>
          <button
            onClick={() => onNavigate('/shop')}
            className="text-xs font-bold text-[#0f2c59] hover:text-[#f59e0b] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">No categories added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => onNavigate(`/category/${cat.slug}`)}
                className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden p-4 text-center cursor-pointer hover:shadow-md hover:border-[#0f2c59]/30 transition-all duration-300"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gray-50 overflow-hidden mb-3 border border-gray-200 group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image || '/logo.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-800 group-hover:text-[#0f2c59] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Handpicked For You</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Featured Products</h2>
          </div>
          <button
            onClick={() => onNavigate('/shop')}
            className="text-xs font-bold text-[#0f2c59] hover:text-[#f59e0b] flex items-center gap-1 transition-colors"
          >
            <span>See All Products</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <EmptyState
            title="No featured products yet"
            description="Our curated catalog is being prepared. Check out all products or visit our store in Pakundia."
            actionText="Browse Shop"
            onAction={() => onNavigate('/shop')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Fresh Collection</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">New Arrivals</h2>
          </div>
          <button
            onClick={() => onNavigate('/shop')}
            className="text-xs font-bold text-[#0f2c59] hover:text-[#f59e0b] flex items-center gap-1 transition-colors"
          >
            <span>View More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : newArrivals.length === 0 ? (
          <EmptyState
            title="No new arrivals yet"
            description="New designs are arriving soon. Stay tuned for our latest releases!"
            actionText="Explore All"
            onAction={() => onNavigate('/shop')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Most Loved</span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Best Sellers</h2>
            </div>
            <button
              onClick={() => onNavigate('/shop')}
              className="text-xs font-bold text-[#0f2c59] hover:text-[#f59e0b] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Store Location & Showroom Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0f2c59] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-[#f59e0b]/20">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 bg-[#f59e0b] text-gray-900 text-xs font-bold uppercase tracking-wider rounded-md">
              Visit Our Showroom
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Experience Our Products In-Person in Pakundia
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Prefer to see and test before you purchase? Visit our grand showroom at <strong>{settings.address}</strong>. Our friendly team is ready to assist you.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href={`tel:${settings.phone}`}
                className="px-6 py-3 bg-white text-[#0f2c59] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call {settings.phone}</span>
              </a>
              <button
                onClick={() => onNavigate('/contact')}
                className="px-6 py-3 bg-[#f59e0b] text-gray-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#fbbf24] transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Showroom Directions</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
