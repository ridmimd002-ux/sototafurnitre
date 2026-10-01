import React, { useState, useEffect, useMemo } from 'react';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Review } from '../../types';
import { formatBDT } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/common/ProductCard';
import { SizeGuideModal } from '../../components/common/SizeGuideModal';
import { 
  Heart, 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Ruler, 
  Star, 
  Check, 
  AlertCircle, 
  Share2, 
  ChevronRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Size guide modal
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(data);

          // Default selected size & color
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0].name);
          }

          // Fetch related products
          if (data.category) {
            const relQ = query(
              collection(db, 'products'),
              where('category', '==', data.category),
              where('isActive', '==', true),
              limit(5)
            );
            const relSnap = await getDocs(relQ);
            const relList = relSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.id !== data.id)
              .slice(0, 4);
            setRelatedProducts(relList);
          }

          // Fetch approved reviews
          const revQ = query(
            collection(db, 'reviews'),
            where('productId', '==', data.id),
            where('isApproved', '==', true)
          );
          const revSnap = await getDocs(revQ);
          setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));

        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Compute available stock based on variant matrix (size + color)
  const currentAvailableStock = useMemo(() => {
    if (!product) return 0;
    if (product.variants && product.variants.length > 0) {
      if (selectedSize && selectedColor) {
        const v = product.variants.find(
          item => item.size.toLowerCase() === selectedSize.toLowerCase() && 
                  item.color.toLowerCase() === selectedColor.toLowerCase()
        );
        return v ? v.stock : 0;
      }
    }
    return product.totalStock || 0;
  }, [product, selectedSize, selectedColor]);

  // Handle Add To Cart
  const handleAddToCart = (isBuyNow = false) => {
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setFeedbackMsg({ type: 'error', text: 'Please choose an available size.' });
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setFeedbackMsg({ type: 'error', text: 'Please choose a color.' });
      return;
    }

    if (currentAvailableStock < 1) {
      setFeedbackMsg({ type: 'error', text: 'Selected item variant is currently out of stock.' });
      return;
    }

    const res = addToCart(product, selectedSize, selectedColor, quantity);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: isBuyNow ? 'Proceeding to checkout...' : res.message });
      if (isBuyNow) {
        setTimeout(() => onNavigate('/checkout'), 300);
      }
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const name = reviewerName.trim() || user?.displayName || 'Customer';
    if (!newComment.trim()) return;

    setReviewSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        productName: product.name,
        customerId: user?.uid || 'guest',
        customerName: name,
        rating: newRating,
        comment: newComment.trim(),
        isApproved: false, // Requires admin review
        createdAt: new Date().toISOString(),
        createdTimestamp: serverTimestamp()
      });
      setReviewSuccess(true);
      setNewComment('');
      setReviewerName('');
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-3/4 bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => onNavigate('/shop')}
          className="px-6 py-2.5 bg-[#0f2c59] text-white text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.thumbnail || '/logo.png'];

  const hasDiscount = Boolean(product.salePrice && product.salePrice > 0 && product.salePrice < product.price);
  const currentPrice = hasDiscount ? product.salePrice! : product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const inWish = isInWishlist(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <button onClick={() => onNavigate('/')} className="hover:text-gray-900">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => onNavigate('/shop')} className="hover:text-gray-900">Shop</button>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <button 
              onClick={() => onNavigate(`/category/${product.category}`)} 
              className="hover:text-gray-900 capitalize"
            >
              {product.category}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Gallery Column (5 cols) */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails list */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[550px] shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-gray-50 ${
                    activeImageIndex === idx 
                      ? 'border-[#0f2c59] shadow-sm ring-2 ring-[#0f2c59]/20' 
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Selected Image */}
          <div className="relative flex-1 aspect-3/4 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-2xs group">
            <img
              src={images[activeImageIndex] || '/logo.png'}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {hasDiscount && (
                <span className="bg-[#dc2626] text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs uppercase tracking-wider">
                  Save {discountPercent}%
                </span>
              )}
              {product.isNewArrival && (
                <span className="bg-[#0f2c59] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs uppercase tracking-wider">
                  New Arrival
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-red-600 hover:bg-white shadow-md transition-all"
              aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-5 h-5 ${inWish ? 'fill-red-600 text-red-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Details & Actions Column (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
              <span className="uppercase tracking-wider text-[#d97706] font-bold">
                {product.brand || product.category || 'Clothing'}
              </span>
              <span className="text-gray-400">SKU: {product.sku || 'N/A'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex text-[#f59e0b]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < (product.rating || 5) ? 'fill-[#f59e0b]' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="font-bold text-gray-800">{product.rating || 5}.0</span>
              <span className="text-gray-400">({reviews.length} reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-baseline gap-4">
            <span className="text-3xl font-black text-[#0f2c59]">
              {formatBDT(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-base text-gray-400 line-through">
                {formatBDT(product.price)}
              </span>
            )}
            {hasDiscount && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                You save {formatBDT(product.price - currentPrice)}
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Select Size: <span className="text-[#0f2c59]">{selectedSize || 'None'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-bold text-[#0f2c59] hover:underline flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>Size Chart</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => {
                  // check if this size is in stock for currently chosen color
                  let variantStock = product.totalStock;
                  if (product.variants && product.variants.length > 0) {
                    const match = product.variants.find(
                      v => v.size.toLowerCase() === size.toLowerCase() && 
                           (!selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase())
                    );
                    variantStock = match ? match.stock : 0;
                  }
                  const isSizeDisabled = variantStock !== undefined && variantStock <= 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isSizeDisabled}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 h-11 px-3 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center relative ${
                        selectedSize === size
                          ? 'border-[#0f2c59] bg-[#0f2c59] text-white shadow-xs'
                          : isSizeDisabled
                          ? 'border-gray-200 bg-gray-100 text-gray-400 line-through cursor-not-allowed'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Select Color: <span className="text-[#0f2c59]">{selectedColor || 'None'}</span>
              </label>

              <div className="flex flex-wrap gap-2.5">
                {product.colors.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all text-xs font-semibold ${
                      selectedColor === c.name
                        ? 'border-[#0f2c59] bg-[#0f2c59]/5 text-[#0f2c59]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300 inline-block shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability indicator */}
          <div className="flex items-center gap-2 text-xs">
            {currentAvailableStock > 5 ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                In Stock ({currentAvailableStock} units available)
              </span>
            ) : currentAvailableStock > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                Hurry, only {currentAvailableStock} left in stock!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || currentAvailableStock < 1}
                  className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentAvailableStock, quantity + 1))}
                  disabled={quantity >= currentAvailableStock || currentAvailableStock < 1}
                  className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={currentAvailableStock < 1}
                className="flex-1 py-3 px-6 bg-white border-2 border-[#0f2c59] text-[#0f2c59] hover:bg-[#0f2c59]/5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Buy Now Direct Button */}
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={currentAvailableStock < 1}
              className="w-full py-3.5 px-6 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#f59e0b]" />
              <span>Buy Now (Cash on Delivery)</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {feedbackMsg && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Delivery & Return Trust Box */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 text-xs text-gray-600 space-y-2.5">
            <div className="flex items-center gap-3 pt-2.5 first:pt-0">
              <Truck className="w-4 h-4 text-[#0f2c59] shrink-0" />
              <span><strong>Fast Nationwide Delivery:</strong> 1-2 days inside Dhaka, 2-4 days across Bangladesh.</span>
            </div>
            <div className="flex items-center gap-3 pt-2.5">
              <RotateCcw className="w-4 h-4 text-[#0f2c59] shrink-0" />
              <span><strong>Easy 7 Days Return:</strong> Hassle-free replacement for defective or wrong sized items.</span>
            </div>
            <div className="flex items-center gap-3 pt-2.5">
              <ShieldCheck className="w-4 h-4 text-[#0f2c59] shrink-0" />
              <span><strong>Guaranteed Authentic:</strong> Inspected quality from Sotota Furniture & Electronics.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Description & Specifications Tabs */}
      <div className="border-t border-gray-200 pt-10">
        <div className="max-w-4xl space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Product Description</h2>
            <div className="prose prose-sm text-gray-600 max-w-none leading-relaxed whitespace-pre-line">
              {product.description || 'No detailed description available for this item.'}
            </div>
          </div>

          {/* Specifications Table */}
          {((product.specifications && product.specifications.length > 0) || product.fabric) && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">Fabric & Specifications</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-gray-100">
                    {product.fabric && (
                      <tr className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-bold text-gray-700 bg-gray-50 w-1/3">Fabric / Material</td>
                        <td className="py-2.5 px-4 text-gray-600">{product.fabric}</td>
                      </tr>
                    )}
                    {product.gender && (
                      <tr className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-bold text-gray-700 bg-gray-50 w-1/3">Gender / Type</td>
                        <td className="py-2.5 px-4 text-gray-600 capitalize">{product.gender}</td>
                      </tr>
                    )}
                    {product.weight && (
                      <tr className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-bold text-gray-700 bg-gray-50 w-1/3">Weight</td>
                        <td className="py-2.5 px-4 text-gray-600">{product.weight}</td>
                      </tr>
                    )}
                    {product.specifications?.map((spec, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-bold text-gray-700 bg-gray-50 w-1/3">{spec.label}</td>
                        <td className="py-2.5 px-4 text-gray-600">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="border-t border-gray-200 pt-10">
        <div className="max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
              <p className="text-xs text-gray-500">Real feedback from verified purchasers</p>
            </div>
          </div>

          {/* Approved Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-500">
              No reviews yet for this product. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(rev => (
                <div key={rev.id} className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">{rev.customerName}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                        Verified Purchase
                      </span>
                    </div>
                    <div className="flex text-[#f59e0b]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-[#f59e0b]' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Review Submission Form */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0f2c59]" />
              <span>Write a Review</span>
            </h3>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
                Thank you! Your review has been submitted and will be displayed after quick verification by our team.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 focus:outline-hidden"
                      >
                        <Star className={`w-6 h-6 ${star <= newRating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-xs rounded-lg px-3 py-2 focus:border-[#0f2c59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Review Comments</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you liked about this item..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-xs rounded-lg px-3 py-2 focus:border-[#0f2c59]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 bg-[#0f2c59] text-white text-xs font-bold rounded-lg hover:bg-[#0a1f3f] disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-200 pt-10">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">More From This Department</span>
            <h2 className="text-xl font-black text-gray-900">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />
    </div>
  );
};
