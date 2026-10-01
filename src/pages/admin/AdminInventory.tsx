import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Boxes, AlertTriangle, Search, Save, Check } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(list);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (p: Product, newTotalStock: number) => {
    setUpdatingId(p.id);
    try {
      await updateDoc(doc(db, 'products', p.id), {
        totalStock: Math.max(0, newTotalStock),
        updatedAt: new Date().toISOString()
      });

      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, totalStock: newTotalStock } : item));

      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Stock Updated', `${p.name} -> ${newTotalStock} units`);
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = products.filter(p => {
    if (search.trim()) {
      const t = search.toLowerCase();
      if (!p.name.toLowerCase().includes(t) && !p.sku.toLowerCase().includes(t)) return false;
    }
    if (lowStockOnly && (p.totalStock ?? 0) > 5) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Inventory & Stock Control</h2>
          <p className="text-xs text-gray-500">
            Real-time stock level monitoring and quick inventory adjustments.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-[#0f2c59]"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer self-start sm:self-center">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-[#0f2c59]"
          />
          <span className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Show Low Stock (≤ 5 units) Only</span>
          </span>
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading stock data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Boxes className="w-8 h-8 text-[#0f2c59]" />}
              title="No products in stock list"
              description="Either no products match your filter, or no items have been added to the store yet."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Variants Count</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map(p => {
                  const thumb = (p.images && p.images.length > 0) ? p.images[0] : (p.thumbnail || '/logo.png');
                  const currentStock = p.totalStock ?? 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img 
                          src={thumb} 
                          alt="" 
                          className="w-10 h-12 object-cover rounded bg-gray-50 border shrink-0" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                        />
                        <div>
                          <p className="font-bold text-gray-900 truncate max-w-xs">{p.name}</p>
                          <span className="text-[10px] text-gray-400 uppercase">{p.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">{p.sku}</td>
                      <td className="py-3 px-4 font-semibold text-gray-600">
                        {p.variants?.length ? `${p.variants.length} combinations` : 'Single SKU'}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-[#0f2c59]">
                        {currentStock}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          currentStock <= 0 
                            ? 'bg-red-50 text-red-700' 
                            : currentStock <= 5 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {currentStock <= 0 ? 'Out of Stock' : currentStock <= 5 ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(p, currentStock - 1)}
                            disabled={currentStock <= 0 || updatingId === p.id}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded flex items-center justify-center disabled:opacity-30"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setProducts(prev => prev.map(item => item.id === p.id ? { ...item, totalStock: val } : item));
                            }}
                            onBlur={(e) => handleUpdateStock(p, parseInt(e.target.value) || 0)}
                            className="w-16 bg-white border text-center font-bold text-xs py-1 rounded"
                          />
                          <button
                            onClick={() => handleUpdateStock(p, currentStock + 1)}
                            disabled={updatingId === p.id}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded flex items-center justify-center disabled:opacity-30"
                          >
                            +
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
    </div>
  );
};
