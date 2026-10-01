import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AuditLog } from '../../types';
import { formatDate } from '../../lib/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { ShieldAlert, Clock, UserCheck } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'auditLogs'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setLogs(list);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">Administrator Audit Trail</h2>
        <p className="text-xs text-gray-500">
          Security activity log recording product modifications, order status alterations, and configuration changes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-[#0f2c59]" />}
              title="No audit events recorded yet"
              description="Actions performed by administrators (such as creating products, updating orders, or modifying site settings) will be securely logged here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target / Resource</th>
                  <th className="py-3 px-4">Admin Identity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400 font-mono">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0f2c59] bg-[#0f2c59]/5 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{log.adminEmail || log.adminUid}</span>
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
