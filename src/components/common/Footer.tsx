import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Phone, Mail, MapPin, MessageCircle, ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSettings();

  return (
    <footer className="bg-[#0b1b33] text-gray-300 pt-16 pb-12 border-t border-gray-800">
      {/* Top Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Nationwide Delivery</h3>
              <p className="text-xs text-gray-400">Fast shipping all over Bangladesh</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Cash on Delivery</h3>
              <p className="text-xs text-gray-400">Pay when you receive the product</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">7-Day Easy Return</h3>
              <p className="text-xs text-gray-400">Hassle-free replacement guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">100% Authentic Quality</h3>
              <p className="text-xs text-gray-400">Verified and quality inspected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => onNavigate('/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img 
                src={settings.logoUrl || "/logo.png"} 
                alt="Logo" 
                className="w-12 h-12 rounded-full border border-[#f59e0b] bg-black object-cover" 
              />
              <span className="font-extrabold text-lg text-white">
                {settings.storeName}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              {settings.aboutText}
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                <span className="text-gray-300">{settings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-green-400 shrink-0" />
                <a 
                  href={`https://wa.me/88${settings.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors"
                >
                  WhatsApp: +880 {settings.whatsapp}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#f59e0b]">Quick Links</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => onNavigate('/shop')} className="hover:text-white transition-colors">Shop All Products</button></li>
              <li><button onClick={() => onNavigate('/track-order')} className="hover:text-white transition-colors">Track Order</button></li>
              <li><button onClick={() => onNavigate('/wishlist')} className="hover:text-white transition-colors">My Wishlist</button></li>
              <li><button onClick={() => onNavigate('/account')} className="hover:text-white transition-colors">My Account</button></li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#f59e0b]">Customer Service</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={() => onNavigate('/size-guide')} className="hover:text-white transition-colors">Size Guide</button></li>
              <li><button onClick={() => onNavigate('/shipping-policy')} className="hover:text-white transition-colors">Shipping Policy</button></li>
              <li><button onClick={() => onNavigate('/return-policy')} className="hover:text-white transition-colors">Return & Exchange</button></li>
              <li><button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors">FAQ</button></li>
              <li><button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">Contact Us</button></li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-[#f59e0b]">Policies</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={() => onNavigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">About Store</button></li>
              <li className="pt-2">
                <button 
                  onClick={() => onNavigate('/admin')} 
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <span>Bangladeshi Trusted Retailer</span>
          <span>•</span>
          <span>Pakundia, Kishoreganj</span>
        </p>
      </div>
    </footer>
  );
};
