import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductVariant, ProductColor, Category } from '../../types';
import { uploadProductImage } from '../../lib/storageHelper';
import { logAdminAction } from '../../lib/auditLogger';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

interface AdminProductFormProps {
  productId?: string | null;
  onBack: () => void;
  onSaved: () => void;
}

const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const COMMON_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy Blue', hex: '#001f3f' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Olive Green', hex: '#556b2f' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Beige', hex: '#f5f5dc' },
];

export const AdminProductForm: React.FC<AdminProductFormProps> = ({ productId, onBack, onSaved }) => {
  const { user } = useAuth();
  const isEditing = Boolean(productId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('Sotota');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex' | 'kids' | 'general'>('unisex');
  const [fabric, setFabric] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number | undefined>(undefined);
  const [totalStock, setTotalStock] = useState<number>(10);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Flags
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Variants (Sizes & Colors)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([{ name: 'Black', hex: '#000000' }]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#1e3a8a');
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Load categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setCategories(list);
        if (list.length > 0 && !category) {
          setCategory(list[0].slug);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Load existing product if editing
  useEffect(() => {
    if (!productId) return;
    const fetchProd = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', productId));
        if (snap.exists()) {
          const d = snap.data() as Product;
          setName(d.name || '');
          setSlug(d.slug || '');
          setSku(d.sku || '');
          setCategory(d.category || '');
          setSubcategory(d.subcategory || '');
          setBrand(d.brand || 'Sotota');
          setGender(d.gender || 'unisex');
          setFabric(d.fabric || '');
          setPrice(d.price || 0);
          setSalePrice(d.salePrice || undefined);
          setCostPrice(d.costPrice || undefined);
          setTotalStock(d.totalStock ?? 10);
          setShortDescription(d.shortDescription || '');
          setDescription(d.description || '');
          setTagsInput((d.tags || []).join(', '));
          setIsActive(d.isActive ?? true);
          setIsFeatured(d.isFeatured ?? false);
          setIsNewArrival(d.isNewArrival ?? false);
          setIsBestSeller(d.isBestSeller ?? false);
          setImages(d.images || []);
          setSelectedSizes(d.sizes || []);
          setSelectedColors(d.colors || []);
          setVariants(d.variants || []);
          setSeoTitle(d.seoTitle || '');
          setSeoDescription(d.seoDescription || '');
        }
      } catch (err) {
        console.error('Error fetching product for edit:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProd();
  }, [productId]);

  // Auto-generate slug and SKU when name changes (if new)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
      if (!sku) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setSku(`SFE-${rand}`);
      }
    }
  };

  // Rebuild / Synchronize Variants matrix when sizes or colors change
  useEffect(() => {
    if (selectedSizes.length === 0 || selectedColors.length === 0) {
      return;
    }
    
    // Create matrix of size x color
    const newVariants: ProductVariant[] = [];
    selectedSizes.forEach(size => {
      selectedColors.forEach(color => {
        const existing = variants.find(v => v.size === size && v.color === color.name);
        newVariants.push({
          id: `${size}-${color.name}`.toLowerCase().replace(/\s+/g, '-'),
          size,
          color: color.name,
          sku: existing?.sku || `${sku}-${size}-${color.name.substring(0, 3)}`.toUpperCase(),
          stock: existing?.stock ?? Math.floor(totalStock / (selectedSizes.length * selectedColors.length || 1)),
          price: existing?.price
        });
      });
    });

    setVariants(newVariants);
  }, [selectedSizes, selectedColors]);

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadProgress(10);
        const uploadedUrl = await uploadProductImage(file, 'products', (p) => setUploadProgress(p));
        setImages(prev => [...prev, uploadedUrl]);
      } catch (err: any) {
        setErrorMsg('Failed to upload image: ' + err.message);
      } finally {
        setUploadProgress(null);
      }
    }
    e.target.value = '';
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setImages(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      copy.unshift(item);
      return copy;
    });
  };

  // Submit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    if (!price || price <= 0) {
      setErrorMsg('Please specify a valid product price.');
      return;
    }

    setSaving(true);

    try {
      // Calculate total stock from variants if variants exist
      const computedTotalStock = variants.length > 0 
        ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : totalStock;

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const productPayload: Omit<Product, 'id'> = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim(),
        category: category || (categories[0]?.slug || 'apparel'),
        subcategory: subcategory.trim() || undefined,
        brand: brand.trim() || 'Sotota',
        gender,
        fabric: fabric.trim() || undefined,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        totalStock: computedTotalStock,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim(),
        tags,
        images,
        thumbnail: images[0] || '/logo.png',
        sizes: selectedSizes,
        colors: selectedColors,
        variants,
        isActive,
        isFeatured,
        isNewArrival,
        isBestSeller,
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || shortDescription.trim() || name.trim(),
        updatedAt: new Date().toISOString()
      };

      if (isEditing && productId) {
        await setDoc(doc(db, 'products', productId), {
          ...productPayload,
          updatedTimestamp: serverTimestamp()
        }, { merge: true });

        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Product Edited', `Product ID: ${productId}`);
        }
      } else {
        const newDoc = await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: new Date().toISOString(),
          createdTimestamp: serverTimestamp()
        });

        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Product Created', `Product ID: ${newDoc.id}`);
        }
      }

      onSaved();

    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg('Failed to save product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading product data...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <h2 className="text-lg font-black text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            1. Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Cotton Casual Shirt"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SFE-CS-101"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategory (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Formal Shirts, Denim"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender / Target</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
                <option value="kids">Kids</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fabric / Material</label>
              <input
                type="text"
                placeholder="e.g. 100% Combed Cotton, Georgette, Denim"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Sotota"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Cost */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            2. Pricing & Cost (BDT ৳)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Regular Selling Price (৳) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="1500"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 font-bold focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sale Discount Price (৳) (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="1250 (leave empty if no discount)"
                value={salePrice || ''}
                onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cost Price (৳) (Private - Admin Only)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="800"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#0f2c59]"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              3. Product Images ({images.length})
            </h3>
            <span className="text-[11px] text-gray-400">First image is the primary cover</span>
          </div>

          {/* Upload and URL input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#0f2c59] transition-colors relative cursor-pointer bg-gray-50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-700">Click or Drag images to upload</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WebP (auto-compressed)</p>
              {uploadProgress !== null && (
                <div className="mt-2 text-xs font-bold text-[#0f2c59]">Uploading: {uploadProgress}%</div>
              )}
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <label className="text-xs font-semibold text-gray-700">Or paste Image URL:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#0f2c59]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Preview Thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-3/4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-[#0f2c59] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="self-end p-1 text-white hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="w-full py-1 bg-white/90 text-gray-900 text-[10px] font-bold rounded hover:bg-white"
                      >
                        Set Cover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sizes & Colors Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            4. Clothing Sizes & Color Variants
          </h3>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SIZES.map(sz => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setSelectedSizes(prev => 
                        isSelected ? prev.filter(s => s !== sz) : [...prev, sz]
                      );
                    }}
                    className={`h-9 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      isSelected 
                        ? 'bg-[#0f2c59] border-[#0f2c59] text-white' 
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-3 max-w-xs">
              <input
                type="text"
                placeholder="Add custom size (e.g. 42, 32/34)"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSizeInput.trim() && !selectedSizes.includes(customSizeInput.trim())) {
                    setSelectedSizes(prev => [...prev, customSizeInput.trim()]);
                    setCustomSizeInput('');
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 mb-2">Available Colors</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_COLORS.map(c => {
                const isSelected = selectedColors.some(item => item.name === c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedColors(prev => 
                        isSelected 
                          ? prev.filter(item => item.name !== c.name)
                          : [...prev, c]
                      );
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[#0f2c59] bg-[#0f2c59]/5 text-[#0f2c59] font-bold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-3 max-w-sm">
              <input
                type="text"
                placeholder="Custom color name (e.g. Mustard Yellow)"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs flex-1"
              />
              <input
                type="color"
                value={customColorHex}
                onChange={(e) => setCustomColorHex(e.target.value)}
                className="w-8 h-8 rounded border p-0 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  if (customColorName.trim()) {
                    setSelectedColors(prev => [...prev, { name: customColorName.trim(), hex: customColorHex }]);
                    setCustomColorName('');
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold"
              >
                Add Color
              </button>
            </div>
          </div>

          {/* Variant Matrix Table */}
          {variants.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-800">
                  Generated Variant Inventory Matrix ({variants.length} combinations)
                </span>
                <span className="text-xs font-bold text-[#0f2c59]">
                  Total Stock: {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Color</th>
                      <th className="py-2 px-3">Variant SKU</th>
                      <th className="py-2 px-3">Stock Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold">{v.size}</td>
                        <td className="py-2 px-3">{v.color}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => {
                              const copy = [...variants];
                              copy[i].sku = e.target.value;
                              setVariants(copy);
                            }}
                            className="bg-white border rounded px-2 py-1 text-xs w-36"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => {
                              const copy = [...variants];
                              copy[i].stock = Math.max(0, parseInt(e.target.value) || 0);
                              setVariants(copy);
                            }}
                            className="bg-white border rounded px-2 py-1 text-xs w-20 font-bold text-[#0f2c59]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Descriptions & Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            5. Descriptions & Tags
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Short Summary Description
            </label>
            <input
              type="text"
              placeholder="One line highlight shown near price"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#0f2c59]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Product Description
            </label>
            <textarea
              rows={4}
              placeholder="Detailed description, fabric weave, styling advice, care instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#0f2c59]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="cotton, shirt, formal, eid-collection, summer"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-[#0f2c59]"
            />
          </div>
        </div>

        {/* Badges & Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            6. Display Badges & Status
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-[#0f2c59] focus:ring-[#0f2c59]"
              />
              <span>Active in Store</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-[#0f2c59] focus:ring-[#0f2c59]"
              />
              <span>Featured Product</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="rounded text-[#0f2c59] focus:ring-[#0f2c59]"
              />
              <span>New Arrival</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded text-[#0f2c59] focus:ring-[#0f2c59]"
              />
              <span>Best Seller</span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving Product...' : isEditing ? 'Update Product' : 'Publish Product to Store'}
          </button>
        </div>

      </form>
    </div>
  );
};
