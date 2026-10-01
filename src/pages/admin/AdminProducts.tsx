import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Product, Category } from '../../types';
import { formatBDT } from '../../lib/formatters';
import { logAdminAction } from '../../lib/auditLogger';
import { AdminProductForm } from './AdminProductForm';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Filter, 
  Layers, 
  AlertCircle 
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form mode: null = list, 'new' = new product, 'edit-xxx' = edit product
  const [formMode, setFormMode] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');

  // Delete modal confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProducts(list);

      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (p: Product) => {
    try {
      const newStatus = !p.isActive;
      await updateDoc(doc(db, 'products', p.id), { isActive: newStatus });
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isActive: newStatus } : item));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Product Status Toggled', `${p.name} -> ${newStatus ? 'Active' : 'Inactive'}`);
      }
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirmId(null);
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Product Deleted', `Product: ${name} (ID: ${id})`);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  if (formMode === 'new') {
    return (
      <AdminProductForm
        onBack={() => setFormMode(null)}
        onSaved={() => {
          setFormMode(null);
          fetchProducts();
        }}
      />
    );
  }

  if (formMode && formMode.startsWith('edit-')) {
    const editId = formMode.replace('edit-', '');
    return (
      <AdminProductForm
        productId={editId}
        onBack={() => setFormMode(null)}
        onSaved={() => {
          setFormMode(null);
          fetchProducts();
        }}
      />
    );
  }

  const filteredProducts = products.filter(p => {
    if (search.trim()) {
      const t = search.toLowerCase();
      const match = p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t);
      if (!match) return false;
    }
    if (catFilter && p.category !== catFilter) return false;
    if (stockFilter === 'in' && (p.totalStock ?? 0) <= 0) return false;
    if (stockFilter === 'out' && (p.totalStock ?? 0) > 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Product Management</h2>
          <p className="text-xs text-gray-500">
            Total {products.length} products listed in database
          </p>
        </div>

        <button
          onClick={() => setFormMode('new')}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-[#0f2c59]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in">In Stock Only</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading products from database...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Package className="w-8 h-8 text-[#0f2c59]" />}
              title="No products available yet"
              description="Your product catalog is empty. Click below to add your very first clothing, furniture, or electronic product listing."
              actionText="Add Product"
              onAction={() => setFormMode('new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredProducts.map(p => {
                  const thumb = (p.images && p.images.length > 0) ? p.images[0] : (p.thumbnail || '/logo.png');
                  const hasDiscount = Boolean(p.salePrice && p.salePrice > 0);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={thumb}
                          alt=""
                          className="w-10 h-12 rounded-lg object-cover bg-gray-50 border shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-xs">{p.name}</p>
                          <div className="flex gap-1.5 mt-0.5">
                            {p.isFeatured && (
                              <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                                Featured
                              </span>
                            )}
                            {p.isNewArrival && (
                              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-gray-600">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0f2c59]">
                          {formatBDT(hasDiscount ? p.salePrice : p.price)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-gray-400 line-through">
                            {formatBDT(p.price)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          (p.totalStock ?? 0) <= 0 
                            ? 'bg-red-50 text-red-700' 
                            : (p.totalStock ?? 0) <= 5
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {p.totalStock ?? 0} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                            p.isActive ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setFormMode(`edit-${p.id}`)}
                            className="p-1.5 text-gray-600 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900">Confirm Product Deletion</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently remove this product from the database? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const prod = products.find(p => p.id === deleteConfirmId);
                  if (prod) handleDelete(prod.id, prod.name);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
