import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CustomerUser, Order } from '../../types';
import { formatBDT, formatDate } from '../../lib/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { Users, Search, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const userSnap = await getDocs(collection(db, 'users'));
        const orderSnap = await getDocs(collection(db, 'orders'));

        const allOrders = orderSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const list: CustomerUser[] = [];

        userSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          if (d.role === 'admin') return; // Don't list admins as customers

          // Calculate real metrics
          const userOrders = allOrders.filter(o => o.customerId === docSnap.id || (d.phone && o.customerPhone === d.phone));
          const totalSpent = userOrders
            .filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'delivered')
            .reduce((sum, o) => sum + (o.total || 0), 0);

          list.push({
            uid: docSnap.id,
            email: d.email || '',
            displayName: d.displayName || 'Customer',
            phone: d.phone || '',
            ordersCount: userOrders.length,
            totalSpent,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || '')
          });
        });

        setCustomers(list);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const t = search.toLowerCase();
    return c.displayName.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || (c.phone && c.phone.includes(t));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Customer Management</h2>
          <p className="text-xs text-gray-500">
            Real registered customer profiles and purchase statistics from Firestore.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-[#0f2c59]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Users className="w-8 h-8 text-[#0f2c59]" />}
              title="No customers found"
              description="No registered customer accounts exist yet in your Firestore database. As customers create accounts, they will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map(c => (
                  <tr key={c.uid} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{c.displayName}</td>
                    <td className="py-3 px-4 text-gray-600">{c.email}</td>
                    <td className="py-3 px-4 text-gray-600">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#0f2c59]">
                      {c.ordersCount || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {formatBDT(c.totalSpent || 0)}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
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
