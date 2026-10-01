import React from 'react';
import { Menu, ShieldCheck, ExternalLink, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title: string;
  onNavigateSite: (path: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  title,
  onNavigateSite
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Toggle admin sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-gray-900 capitalize">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* View store button */}
        <button
          onClick={() => onNavigateSite('/')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Live Store</span>
        </button>

        {/* Admin profile pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#0f2c59] text-white flex items-center justify-center font-bold text-xs border border-[#f59e0b]">
            <ShieldCheck className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-gray-900 leading-none">
              {user?.displayName || 'Administrator'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-none">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
