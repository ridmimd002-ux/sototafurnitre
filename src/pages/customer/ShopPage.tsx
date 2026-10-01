import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductCardSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Filter, 
  X, 
  ChevronDown, 
  SlidersHorizontal, 
  Search,
  Check,
  RotateCcw
} from 'lucide-react';

interface ShopPageProps {
  initialSearchQuery?: string;
  initialCategory?: string;
  onNavigate: (path: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ 
  initialSearchQuery = '', 
  initialCategory = '',
  onNavigate 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(20000);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular' | 'featured'>('newest');

  // Mobile bottom drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const catQ = query(collection(db, 'categories'), where('isActive', '==', true));
        const catSnap = await getDocs(catQ);
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));

        // Fetch active products
        const prodQ = query(collection(db, 'products'), where('isActive', '==', true));
        const prodSnap = await getDocs(prodQ);
        const list = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProducts(list);
      } catch (err) {
        console.warn('Error loading products from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute all available sizes across products
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      p.sizes?.forEach(s => set.add(s));
    });
    return Array.from(set);
  }, [products]);

  // Compute all available colors across products
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => {
      p.colors?.forEach(c => {
        if (!map.has(c.name)) map.set(c.name, c.hex || '#000000');
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(term);
        const matchSku = p.sku?.toLowerCase().includes(term);
        const matchTags = p.tags?.some(t => t.toLowerCase().includes(term));
        const matchDesc = p.description?.toLowerCase().includes(term);
        if (!matchName && !matchSku && !matchTags && !matchDesc) return false;
      }

      // Category
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }

      // Size
      if (selectedSize && (!p.sizes || !p.sizes.includes(selectedSize))) {
        return false;
      }

      // Color
      if (selectedColor && (!p.colors || !p.colors.some(c => c.name.toLowerCase() === selectedColor.toLowerCase()))) {
        return false;
      }

      // Stock
      if (inStockOnly && p.totalStock !== undefined && p.totalStock <= 0) {
        return false;
      }

      // Price
      const effPrice = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
      if (effPrice > priceRange) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice && a.salePrice > 0 ? a.salePrice : a.price;
      const priceB = b.salePrice && b.salePrice > 0 ? b.salePrice : b.price;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'popular') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      if (sortBy === 'featured') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      // default newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [products, searchTerm, selectedCategory, selectedSize, selectedColor, inStockOnly, priceRange, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setPriceRange(20000);
    setSortBy('newest');
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedCategory || selectedSize || selectedColor || inStockOnly || priceRange < 20000
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {selectedCategory 
              ? categories.find(c => c.slug === selectedCategory)?.name || 'Category'
              : 'All Products'
            }
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing <strong className="text-gray-900">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0f2c59]" />
            <span>Filters {hasActiveFilters && '(Active)'}</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-hidden focus:border-[#0f2c59] cursor-pointer shadow-2xs"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Popularity / Best Sellers</option>
              <option value="featured">Featured First</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-extrabold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0f2c59]" />
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                Categories
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    !selectedCategory ? 'bg-[#0f2c59] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>All Categories</span>
                  <span>{products.length}</span>
                </button>
                {categories.map(cat => {
                  const count = products.filter(p => p.category === cat.slug).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        selectedCategory === cat.slug ? 'bg-[#0f2c59] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] opacity-75">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Max Price</h3>
                <span className="text-xs font-bold text-[#0f2c59]">৳{priceRange.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="200"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#0f2c59] cursor-pointer"
              />
            </div>

            {/* Size Filter */}
            {availableSizes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                  Available Sizes
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map(sz => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                      className={`min-w-8 h-8 px-2 text-xs font-bold rounded-lg border transition-all ${
                        selectedSize === sz
                          ? 'bg-[#0f2c59] border-[#0f2c59] text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Filter */}
            {availableColors.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                  Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all ${
                        selectedColor === c.name
                          ? 'border-[#0f2c59] bg-[#0f2c59]/5 font-bold text-[#0f2c59]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Filter */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#0f2c59] focus:ring-[#0f2c59]"
                />
                <span>In Stock items only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <EmptyState
                title="No products found"
                description={
                  hasActiveFilters 
                    ? "No products match your currently selected filters. Try clearing some filters or searching for another keyword."
                    : "No products are currently available in the catalog. Check back soon!"
                }
                actionText={hasActiveFilters ? "Clear All Filters" : "Go to Homepage"}
                onAction={hasActiveFilters ? handleResetFilters : () => onNavigate('/')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Bottom Sheet / Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-md ml-auto bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            <div className="p-4 bg-[#0f2c59] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-[#f59e0b]" />
                <span>Filter Products</span>
              </div>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
              {/* Category */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Category
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                      !selectedCategory ? 'bg-[#0f2c59] text-white font-bold' : 'text-gray-700 bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                        selectedCategory === cat.slug ? 'bg-[#0f2c59] text-white font-bold' : 'text-gray-700 bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Max Price:</span>
                  <span className="text-[#0f2c59]">৳{priceRange}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="200"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-[#0f2c59]"
                />
              </div>

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Sizes</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(sz => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                        className={`h-9 px-3 rounded-lg text-xs font-bold border ${
                          selectedSize === sz ? 'bg-[#0f2c59] text-white' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* In stock */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#0f2c59]"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-gray-200 text-gray-800 text-xs font-bold rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-2 py-2.5 bg-[#0f2c59] text-white text-xs font-bold rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
