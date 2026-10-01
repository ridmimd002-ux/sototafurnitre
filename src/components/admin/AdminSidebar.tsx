import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingCart, 
  Users, 
  Boxes, 
  Tag, 
  Truck, 
  Image, 
  Star, 
  FileText, 
  Settings, 
  ShieldAlert, 
  LogOut,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onNavigateSite: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onNavigateSite
}) => {
  const { logout } = useAuth();
  const { settings } = useSettings();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory / Stock', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'coupons', label: 'Coupons / Discounts', icon: Tag },
    { id: 'delivery', label: 'Delivery Zones', icon: Truck },
    { id: 'banners', label: 'Homepage Banners', icon: Image },
    { id: 'reviews', label: 'Reviews Moderation', icon: Star },
    { id: 'pages', label: 'Static Pages', icon: FileText },
    { id: 'settings', label: 'Store Settings', icon: Settings },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a192f] text-gray-300 flex flex-col transition-transform duration-300 border-r border-gray-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div 
            onClick={() => onNavigateSite('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img 
              src={settings.logoUrl || "/logo.png"} 
              alt="Logo" 
              className="w-9 h-9 rounded-full border border-[#f59e0b] object-cover bg-black" 
            />
            <div>
              <span className="font-extrabold text-sm text-white block leading-tight group-hover:text-[#f59e0b]">
                {settings.storeName}
              </span>
              <span className="text-[10px] font-bold text-[#f59e0b] tracking-wider uppercase">
                Admin Panel
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0f2c59] text-white font-bold border-l-4 border-[#f59e0b] shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#f59e0b]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => onNavigateSite('/')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>View Live Store</span>
            </span>
            <span className="text-[10px] text-gray-500">↗</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>

      </aside>
    </>
  );
};
