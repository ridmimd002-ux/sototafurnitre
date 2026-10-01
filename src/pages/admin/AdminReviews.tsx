import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types';
import { formatDate } from '../../lib/formatters';
import { logAdminAction } from '../../lib/auditLogger';
import { EmptyState } from '../../components/common/EmptyState';
import { Star, Check, X, Trash2, MessageSquare } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setReviews(list);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (r: Review) => {
    try {
      const newStatus = !r.isApproved;
      await updateDoc(doc(db, 'reviews', r.id), { isApproved: newStatus });
      setReviews(prev => prev.map(item => item.id === r.id ? { ...item, isApproved: newStatus } : item));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Review Moderated', `Review for ${r.productName || r.productId}: ${newStatus ? 'Approved' : 'Hidden'}`);
      }
    } catch (err) {
      console.error('Failed to moderate review:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(item => item.id !== id));
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Review Deleted', `Review ID: ${id}`);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Customer Reviews Moderation</h2>
          <p className="text-xs text-gray-500">
            Moderate submitted customer reviews before they appear publicly on product pages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Star className="w-8 h-8 text-[#0f2c59]" />}
              title="No customer reviews submitted yet"
              description="Customer reviews submitted on product details pages will appear here for your moderation and approval."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {reviews.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{r.productName || r.productId}</td>
                    <td className="py-3 px-4 text-gray-700">{r.customerName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-[#f59e0b]">
                        <Star className="w-3.5 h-3.5 fill-[#f59e0b]" />
                        <span className="ml-1 font-bold text-gray-900">{r.rating}/5</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm text-gray-600 leading-relaxed">
                      "{r.comment}"
                    </td>
                    <td className="py-3 px-4 text-gray-400">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.isApproved ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {r.isApproved ? 'Approved (Public)' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(r)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            r.isApproved 
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {r.isApproved ? 'Hide' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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
    </div>
  );
};
