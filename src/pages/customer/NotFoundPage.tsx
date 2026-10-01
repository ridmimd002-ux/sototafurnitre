import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { settings } = useSettings();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-black p-0.5 border-2 border-[#f59e0b] shadow-md mx-auto overflow-hidden">
        <img 
          src={settings.logoUrl || "/logo.png"} 
          alt="Logo" 
          className="w-full h-full object-cover rounded-full" 
        />
      </div>

      <div className="space-y-2">
        <span className="text-4xl sm:text-5xl font-black text-[#0f2c59]">404</span>
        <h1 className="text-xl font-black text-gray-900">Page Not Found</h1>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          The page you are looking for doesn't exist, has been removed, or the link has changed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigate('/')}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#0f2c59] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#0a1f3f] flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </button>

        <button
          onClick={() => onNavigate('/shop')}
          className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse Shop</span>
        </button>
      </div>
    </div>
  );
};
