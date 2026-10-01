import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Banner } from '../../types';
import { uploadProductImage } from '../../lib/storageHelper';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Image, Plus, Trash2, Edit, Upload, ExternalLink } from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [buttonText, setButtonText] = useState('Shop Collection');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner));
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setBanners(list);
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImage('');
    setButtonText('Shop Now');
    setButtonLink('/shop');
    setSortOrder(banners.length);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImage(b.image);
    setButtonText(b.buttonText || 'Shop Now');
    setButtonLink(b.buttonLink || '/shop');
    setSortOrder(b.sortOrder ?? 0);
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadProductImage(file, 'banners');
      setImage(url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) {
      alert('Please provide a banner title and image.');
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<Banner, 'id'> = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        image: image.trim(),
        buttonText: buttonText.trim() || undefined,
        buttonLink: buttonLink.trim() || '/shop',
        sortOrder: Number(sortOrder) || 0,
        isActive
      };

      if (editingBanner) {
        await setDoc(doc(db, 'banners', editingBanner.id), payload, { merge: true });
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Banner Edited', `Banner: ${title}`);
        }
      } else {
        await addDoc(collection(db, 'banners'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Banner Created', `Banner: ${title}`);
        }
      }

      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Failed to save banner:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, bTitle: string) => {
    if (!window.confirm(`Delete banner "${bTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      setBanners(prev => prev.filter(b => b.id !== id));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Banner Deleted', `Banner: ${bTitle}`);
      }
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Homepage Banners</h2>
          <p className="text-xs text-gray-500">
            Control the hero promo banners and campaign highlights on the customer homepage.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Image className="w-8 h-8 text-[#0f2c59]" />}
              title="No homepage banners configured"
              description="Create a banner to feature collections or promotional campaigns on the homepage."
              actionText="Add Banner"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Title & Subtitle</th>
                  <th className="py-3 px-4">Button Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {banners.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-400">#{b.sortOrder}</td>
                    <td className="py-3 px-4">
                      <img 
                        src={b.image} 
                        alt="" 
                        className="w-24 h-12 rounded-lg object-cover border bg-gray-100" 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{b.title}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-xs">{b.subtitle || '—'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0f2c59]">{b.buttonText || 'Shop'}</span>
                      <span className="block text-[10px] text-gray-400">{b.buttonLink}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-gray-600 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.title)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900">
              {editingBanner ? 'Edit Banner' : 'Create Banner'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eid Exclusive Collection 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:border-[#0f2c59]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Up to 40% discount on casual shirts & panjabi"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Banner Image *</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#0f2c59] file:text-white"
                  />
                  <input
                    type="url"
                    placeholder="Or enter image URL"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2"
                  />
                  {image && (
                    <img src={image} alt="" className="w-full h-24 object-cover rounded-lg border" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#0f2c59]"
                    />
                    <span>Active on Homepage</span>
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
                  {saving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
