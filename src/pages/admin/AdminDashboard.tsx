import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, Product } from '../../types';
import { formatBDT, formatDate } from '../../lib/formatters';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Users, 
  CircleDollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true);
      try {
        // Fetch orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        
        const pendingCount = allOrders.filter(o => o.orderStatus === 'pending').length;
        // Calculate revenue from paid or delivered orders
        const revenue = allOrders
          .filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'delivered')
          .reduce((sum, o) => sum + (o.total || 0), 0);

        // Fetch recent orders
        const recent = [...allOrders]
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          .slice(0, 5);
        setRecentOrders(recent);

        // Fetch products
        const prodSnap = await getDocs(collection(db, 'products'));
        const allProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const activeCount = allProds.filter(p => p.isActive).length;
        const lowStockCount = allProds.filter(p => (p.totalStock !== undefined && p.totalStock <= 5)).length;

        // Fetch customers
        const custSnap = await getDocs(collection(db, 'users'));
        const custCount = custSnap.docs.filter(d => d.data().role !== 'admin').length;

        setStats({
          totalOrders: allOrders.length,
          pendingOrders: pendingCount,
          totalRevenue: revenue,
          totalProducts: allProds.length,
          activeProducts: activeCount,
          lowStockProducts: lowStockCount,
          totalCustomers: custCount
        });

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  const isDatabaseEmpty = stats.totalProducts === 0 && stats.totalOrders === 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0f2c59] rounded-2xl p-6 text-white border border-[#f59e0b]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">Real-Time Store Control</span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">Store Performance Overview</h2>
          <p className="text-xs text-gray-300 mt-1">Live metrics strictly from your connected Firebase database.</p>
        </div>

        <button
          onClick={() => onNavigateTab('products')}
          className="px-4 py-2.5 bg-[#f59e0b] hover:bg-[#fbbf24] text-gray-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0"
        >
          + Add New Product
        </button>
      </div>

      {/* Empty Database Setup Checklist */}
      {isDatabaseEmpty && !loading && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>First-Time Setup Guide (No Demo Data In Database)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Your database is currently empty and in a pristine state. Follow these initial steps to populate your real store catalog:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('categories')}
              className="p-3 bg-white rounded-xl border border-amber-200 text-left hover:border-amber-400 transition-colors shadow-2xs"
            >
              <strong className="block text-xs text-gray-900 font-bold">1. Add Categories</strong>
              <span className="text-[11px] text-gray-500">e.g. Shirts, Pants, T-Shirts</span>
            </button>

            <button
              onClick={() => onNavigateTab('products')}
              className="p-3 bg-white rounded-xl border border-amber-200 text-left hover:border-amber-400 transition-colors shadow-2xs"
            >
              <strong className="block text-xs text-gray-900 font-bold">2. Add First Product</strong>
              <span className="text-[11px] text-gray-500">Photos, sizes, colors, stock</span>
            </button>

            <button
              onClick={() => onNavigateTab('delivery')}
              className="p-3 bg-white rounded-xl border border-amber-200 text-left hover:border-amber-400 transition-colors shadow-2xs"
            >
              <strong className="block text-xs text-gray-900 font-bold">3. Configure Delivery</strong>
              <span className="text-[11px] text-gray-500">Inside & Outside Dhaka rates</span>
            </button>

            <button
              onClick={() => onNavigateTab('banners')}
              className="p-3 bg-white rounded-xl border border-amber-200 text-left hover:border-amber-400 transition-colors shadow-2xs"
            >
              <strong className="block text-xs text-gray-900 font-bold">4. Add Hero Banners</strong>
              <span className="text-[11px] text-gray-500">Highlight promotions on homepage</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {loading ? '...' : stats.totalOrders}
          </p>
          <p className="text-[11px] text-gray-400">All recorded orders</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {loading ? '...' : stats.pendingOrders}
          </p>
          <p className="text-[11px] text-gray-400">Awaiting confirmation/dispatch</p>
        </div>

        {/* Real Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Real Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {loading ? '...' : formatBDT(stats.totalRevenue)}
          </p>
          <p className="text-[11px] text-gray-400">From paid & delivered orders</p>
        </div>

        {/* Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Items</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {loading ? '...' : `${stats.activeProducts} / ${stats.totalProducts}`}
          </p>
          <p className="text-[11px] text-gray-400">Active vs Total listed</p>
        </div>

      </div>

      {/* Secondary Alerts & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:border-red-300 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Low Stock Alert</h4>
              <p className="text-[11px] text-gray-500">Products with 5 or fewer items remaining</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-red-600">{stats.lowStockProducts}</span>
            <span className="block text-[10px] text-gray-400">Manage →</span>
          </div>
        </div>

        {/* Registered Customers */}
        <div 
          onClick={() => onNavigateTab('customers')}
          className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Registered Customers</h4>
              <p className="text-[11px] text-gray-500">Accounts created in store</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-gray-900">{stats.totalCustomers}</span>
            <span className="block text-[10px] text-gray-400">View →</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Recent Orders</h3>
            <p className="text-[11px] text-gray-500">Latest customer orders from Firestore</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#0f2c59] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-400 font-medium">No data available yet</p>
            <p className="text-[11px] text-gray-400 mt-1">Orders will appear here as soon as customers place them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-[#0f2c59]">{ord.orderNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{ord.customerName}</td>
                    <td className="py-3 px-4 text-gray-500">{ord.customerPhone}</td>
                    <td className="py-3 px-4 text-gray-400">{formatDate(ord.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ord.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                        ord.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatBDT(ord.total)}</td>
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
