import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Phone, MessageCircle } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useSettings();

  if (!settings.announcementActive || !settings.announcementBar) return null;

  return (
    <div className="bg-[#0f2c59] text-white text-xs sm:text-sm py-2 px-4 border-b border-[#1e40af]/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
        <div className="flex items-center gap-2 font-medium">
          <span className="bg-[#f59e0b] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Notice
          </span>
          <p className="line-clamp-1">{settings.announcementBar}</p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-gray-200">
          <a href={`tel:${settings.phone}`} className="flex items-center gap-1 hover:text-[#f59e0b] transition-colors">
            <Phone className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>{settings.phone}</span>
          </a>
          <span className="text-gray-500">|</span>
          <a 
            href={`https://wa.me/88${settings.whatsapp}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#f59e0b] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-green-400" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
