import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { DeliveryZone } from '../../types';
import { formatBDT } from '../../lib/formatters';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Truck, Plus, Trash2, Edit, Check } from 'lucide-react';

export const AdminDelivery: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [name, setName] = useState('');
  const [charge, setCharge] = useState<number>(80);
  const [estimatedDays, setEstimatedDays] = useState('1-2 Days');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'deliveryZones'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryZone));
      setZones(list);
    } catch (err) {
      console.error('Error fetching delivery zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const openCreateModal = () => {
    setEditingZone(null);
    setName('');
    setCharge(80);
    setEstimatedDays('1-3 Days');
    setFreeDeliveryThreshold(undefined);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (z: DeliveryZone) => {
    setEditingZone(z);
    setName(z.name);
    setCharge(z.charge);
    setEstimatedDays(z.estimatedDays);
    setFreeDeliveryThreshold(z.freeDeliveryThreshold);
    setIsActive(z.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload: Omit<DeliveryZone, 'id'> = {
        name: name.trim(),
        charge: Number(charge),
        estimatedDays: estimatedDays.trim(),
        freeDeliveryThreshold: freeDeliveryThreshold ? Number(freeDeliveryThreshold) : undefined,
        isActive
      };

      if (editingZone) {
        await setDoc(doc(db, 'deliveryZones', editingZone.id), payload, { merge: true });
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Delivery Zone Edited', `Zone: ${name}`);
        }
      } else {
        await addDoc(collection(db, 'deliveryZones'), payload);
        if (user) {
          await logAdminAction(user.uid, user.email || '', 'Delivery Zone Created', `Zone: ${name}`);
        }
      }

      setIsModalOpen(false);
      fetchZones();
    } catch (err) {
      console.error('Error saving delivery zone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, zName: string) => {
    if (!window.confirm(`Delete zone "${zName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'deliveryZones', id));
      setZones(prev => prev.filter(z => z.id !== id));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Delivery Zone Deleted', `Zone: ${zName}`);
      }
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Delivery & Shipping Zones</h2>
          <p className="text-xs text-gray-500">
            Configure courier fees and transit estimates (Inside Dhaka, Outside Dhaka, Kishoreganj Local, etc.).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Zone</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading delivery zones...</div>
        ) : zones.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Truck className="w-8 h-8 text-[#0f2c59]" />}
              title="No delivery zones configured"
              description="Add shipping zones (e.g. Inside Dhaka ৳80, Outside Dhaka ৳150) so checkout can calculate delivery charges."
              actionText="Add Zone"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Zone Name</th>
                  <th className="py-3 px-4">Delivery Fee</th>
                  <th className="py-3 px-4">Estimated Transit</th>
                  <th className="py-3 px-4">Free Shipping On Orders Over</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {zones.map(z => (
                  <tr key={z.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{z.name}</td>
                    <td className="py-3 px-4 font-black text-sm text-[#0f2c59]">{formatBDT(z.charge)}</td>
                    <td className="py-3 px-4 text-gray-600">{z.estimatedDays}</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">
                      {z.freeDeliveryThreshold ? formatBDT(z.freeDeliveryThreshold) : 'Not Configured'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        z.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {z.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(z)}
                          className="p-1.5 text-gray-600 hover:text-[#0f2c59] hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(z.id, z.name)}
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
              {editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inside Dhaka or Outside Dhaka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 focus:border-[#0f2c59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Delivery Charge (৳)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={charge}
                    onChange={(e) => setCharge(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Estimated Days</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-2 Days"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Free Delivery Threshold (৳) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 3000 (free delivery for orders above this amount)"
                  value={freeDeliveryThreshold || ''}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#0f2c59]"
                  />
                  <span>Active & Selectable in Checkout</span>
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
                  {saving ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
