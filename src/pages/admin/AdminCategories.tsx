import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../types';
import { uploadProductImage } from '../../lib/storageHelper';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Layers, Plus, Edit, Trash2, Upload, AlertCircle, Check } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setSortOrder(categories.length);
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setSortOrder(cat.sortOrder ?? 0);
    setIsActive(cat.isActive ?? true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadProductImage(file, 'categories');
      setImage(url);
    } catch (err: any) {
      setErrorMsg('Image upload failed: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload: Omit<Category, 'id'> = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim() || undefined,
        image: image || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive
      };

      if (editingCategory) {
        await setDoc(doc(db, 'categories', editingCategory.id), {
          ...payload,
          updatedTimestamp: serverTimestamp()
        }, { merge: true });

        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Category Edited', `${name} (${slug})`);
        }
      } else {
        await addDoc(collection(db, 'categories'), {
          ...payload,
          createdAt: new Date().toISOString(),
          createdTimestamp: serverTimestamp()
        });

        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Category Created', `${name} (${slug})`);
        }
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setErrorMsg('Failed to save category: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(c => c.id !== id));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Category Deleted', `Category: ${catName}`);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Category Management</h2>
          <p className="text-xs text-gray-500">
            Create departments to organize products on the website.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Layers className="w-8 h-8 text-[#0f2c59]" />}
              title="No categories available yet"
              description="Create your first product department (such as Shirts, Pants, T-Shirts, Electronics, etc.)."
              actionText="Create Category"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">URL Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-400">
                      #{cat.sortOrder ?? 0}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 border overflow-hidden shrink-0">
                        <img
                          src={cat.image || '/logo.png'}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                        />
                      </div>
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      /category/{cat.slug}
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        cat.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-gray-600 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Formal Shirts"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. formal-shirts"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note about this department"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#0f2c59] file:text-white file:font-semibold"
                  />
                  {image && (
                    <img src={image} alt="" className="w-8 h-8 rounded object-cover border" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#0f2c59]"
                    />
                    <span className="font-semibold">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0f2c59] text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
