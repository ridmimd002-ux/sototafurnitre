import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const WhatsAppFloating: React.FC = () => {
  const { settings } = useSettings();

  const whatsappNumber = settings.whatsapp || '01777439960';
  const whatsappUrl = `https://wa.me/88${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${settings.storeName}, I want to make an inquiry or place an order.`
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 flex items-center gap-2 group"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="hidden sm:inline font-bold text-xs pr-1 group-hover:inline">
        WhatsApp Order
      </span>
    </a>
  );
};
