import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminLoginPage } from '../../pages/admin/AdminLoginPage';
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { AdminProducts } from '../../pages/admin/AdminProducts';
import { AdminCategories } from '../../pages/admin/AdminCategories';
import { AdminOrders } from '../../pages/admin/AdminOrders';
import { AdminCustomers } from '../../pages/admin/AdminCustomers';
import { AdminInventory } from '../../pages/admin/AdminInventory';
import { AdminCoupons } from '../../pages/admin/AdminCoupons';
import { AdminDelivery } from '../../pages/admin/AdminDelivery';
import { AdminBanners } from '../../pages/admin/AdminBanners';
import { AdminReviews } from '../../pages/admin/AdminReviews';
import { AdminPages } from '../../pages/admin/AdminPages';
import { AdminSettings } from '../../pages/admin/AdminSettings';
import { AdminAuditLogs } from '../../pages/admin/AdminAuditLogs';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  onNavigateSite: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigateSite }) => {
  const { user, isAdmin, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0f2c59] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-600">Verifying Administrator Authorization...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show dedicated Admin Login Screen
  if (!user) {
    return (
      <AdminLoginPage
        onSuccess={() => {}}
        onNavigateHome={() => onNavigateSite('/')}
      />
    );
  }

  // If user is authenticated but not an authorized admin, block with Access Denied screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-gray-900">Access Denied</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your authenticated account does not possess administrator authority for this store.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-[11px] text-gray-500 font-mono">
            Signed in as: {user.email}
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
            <button
              onClick={() => onNavigateSite('/')}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Store</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin Panel
  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigateSite={onNavigateSite}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminHeader
          title={currentTab.replace('-', ' ')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigateSite={onNavigateSite}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {currentTab === 'dashboard' && <AdminDashboard onNavigateTab={setCurrentTab} />}
          {currentTab === 'products' && <AdminProducts />}
          {currentTab === 'categories' && <AdminCategories />}
          {currentTab === 'orders' && <AdminOrders />}
          {currentTab === 'customers' && <AdminCustomers />}
          {currentTab === 'inventory' && <AdminInventory />}
          {currentTab === 'coupons' && <AdminCoupons />}
          {currentTab === 'delivery' && <AdminDelivery />}
          {currentTab === 'banners' && <AdminBanners />}
          {currentTab === 'reviews' && <AdminReviews />}
          {currentTab === 'pages' && <AdminPages />}
          {currentTab === 'settings' && <AdminSettings />}
          {currentTab === 'audit-logs' && <AdminAuditLogs />}
        </main>
      </div>
    </div>
  );
};
