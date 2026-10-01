import React from 'react';
import { Product } from '../../types';
import { formatBDT } from '../../lib/formatters';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Heart, ShoppingBag, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate, onQuickView }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const inWish = isInWishlist(product.id);

  const mainImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : (product.thumbnail || '/logo.png');
    
  const hoverImage = (product.images && product.images.length > 1) 
    ? product.images[1] 
    : mainImage;

  const hasDiscount = Boolean(product.salePrice && product.salePrice > 0 && product.salePrice < product.price);
  const currentPrice = hasDiscount ? product.salePrice! : product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const isOutOfStock = product.totalStock !== undefined && product.totalStock <= 0;

  const handleCardClick = () => {
    onNavigate(`/product/${product.id}`);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    
    // If product has multiple sizes or colors, open product page for variant selection
    if ((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) {
      onNavigate(`/product/${product.id}`);
      return;
    }
    
    addToCart(product, '', '', 1);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 w-full bg-gray-50 overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />

        {/* Optional Hover Image */}
        {hoverImage !== mainImage && (
          <img
            src={hoverImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="bg-[#dc2626] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              -{discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-[#0f2c59] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              New
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            inWish 
              ? 'bg-red-50 text-red-600 shadow-sm' 
              : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white shadow-xs'
          }`}
          aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${inWish ? 'fill-red-600 text-red-600' : ''}`} />
        </button>

        {/* Quick View Floating Action on Desktop */}
        <div className="absolute inset-x-2 bottom-2 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="w-full py-2 px-3 bg-[#0f2c59]/95 text-white hover:bg-[#0a1f3f] text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : ((product.sizes?.length || 0) > 1 ? 'Select Options' : 'Add to Cart')}</span>
          </button>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category or Gender */}
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 mb-1">
            <span className="capitalize">{product.subcategory || product.category || 'Apparel'}</span>
            {product.fabric && (
              <span className="line-clamp-1">{product.fabric}</span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 hover:text-[#0f2c59] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Available Sizes Badge preview */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.sizes.slice(0, 4).map(size => (
                <span 
                  key={size} 
                  className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-[10px] text-gray-400 self-center">+{product.sizes.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-base sm:text-lg text-[#0f2c59]">
              {formatBDT(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatBDT(product.price)}
              </span>
            )}
          </div>

          {/* Mobile Quick Add icon */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="sm:hidden p-2 rounded-lg bg-[#0f2c59] text-white hover:bg-[#0a1f3f] disabled:opacity-40"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
