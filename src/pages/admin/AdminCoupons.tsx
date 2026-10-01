import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Coupon } from '../../types';
import { formatBDT } from '../../lib/formatters';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Tag, Plus, Trash2, Edit, Check, AlertCircle } from 'lucide-react';

export const AdminCoupons: React.FC = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountAmount, setDiscountAmount] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(1000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(500);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
      setCoupons(list);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountAmount(10);
    setMinOrderAmount(1000);
    setMaxDiscountAmount(500);
    setExpiryDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setUsageLimit(100);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountAmount(c.discountAmount);
    setMinOrderAmount(c.minOrderAmount);
    setMaxDiscountAmount(c.maxDiscountAmount);
    setExpiryDate(c.expiryDate ? c.expiryDate.split('T')[0] : '');
    setUsageLimit(c.usageLimit);
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const payload: Omit<Coupon, 'id'> = {
        code: code.trim().toUpperCase(),
        discountType,
        discountAmount: Number(discountAmount),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        expiryDate,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        usedCount: editingCoupon?.usedCount || 0,
        isActive
      };

      if (editingCoupon) {
        await setDoc(doc(db, 'coupons', editingCoupon.id), payload, { merge: true });
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Coupon Edited', `Coupon: ${code}`);
        }
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Coupon Created', `Coupon: ${code}`);
        }
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to save coupon:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, cCode: string) => {
    if (!window.confirm(`Delete coupon "${cCode}"?`)) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(prev => prev.filter(c => c.id !== id));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Coupon Deleted', `Coupon: ${cCode}`);
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Coupon & Discount Management</h2>
          <p className="text-xs text-gray-500">
            Create promotional coupon codes with percentage or flat BDT discounts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Tag className="w-8 h-8 text-[#0f2c59]" />}
              title="No coupon codes yet"
              description="Create promo codes (such as EID2026, WELCOME10, etc.) to give discounts to your shoppers."
              actionText="Create Coupon"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Order</th>
                  <th className="py-3 px-4">Usage / Limit</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-black text-sm text-[#0f2c59]">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {c.discountType === 'percentage' ? `${c.discountAmount}% OFF` : `৳${c.discountAmount} Flat OFF`}
                      {c.maxDiscountAmount && (
                        <span className="block text-[10px] text-gray-400 font-normal">
                          Max: ৳{c.maxDiscountAmount}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatBDT(c.minOrderAmount)}</td>
                    <td className="py-3 px-4">
                      {c.usedCount || 0} / {c.usageLimit || '∞'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{c.expiryDate || 'No Expiry'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-600 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
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
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOTOTA10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-mono uppercase font-bold text-gray-900 focus:border-[#0f2c59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Min. Order Amount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Discount Cap (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={maxDiscountAmount || ''}
                    onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={usageLimit || ''}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#0f2c59]"
                  />
                  <span>Active & Valid for Customer Checkout</span>
                </label>
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
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
