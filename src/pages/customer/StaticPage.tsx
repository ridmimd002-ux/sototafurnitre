import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  HelpCircle,
  FileText
} from 'lucide-react';

interface StaticPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ slug, onNavigate }) => {
  const { settings } = useSettings();

  if (slug === 'contact') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Get In Touch</span>
          <h1 className="text-3xl font-black text-gray-900">Contact & Showroom</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Have questions about products, custom orders, or delivery? Reach out to our team or visit our showroom in Pakundia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Showroom Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Store Location</h2>
            
            <div className="space-y-4 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0f2c59] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Showroom Address:</strong>
                  <p>{settings.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#0f2c59] shrink-0" />
                <div>
                  <strong className="block text-gray-900">Phone Hotline:</strong>
                  <a href={`tel:${settings.phone}`} className="hover:text-[#0f2c59] font-bold">{settings.phone}</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <strong className="block text-gray-900">WhatsApp Support:</strong>
                  <a 
                    href={`https://wa.me/88${settings.whatsapp}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-green-600 font-bold"
                  >
                    +880 {settings.whatsapp}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#0f2c59] shrink-0" />
                <div>
                  <strong className="block text-gray-900">Email:</strong>
                  <a href={`mailto:${settings.email}`} className="hover:underline">{settings.email}</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#0f2c59] shrink-0" />
                <div>
                  <strong className="block text-gray-900">Business Hours:</strong>
                  <p>Saturday – Thursday: 9:00 AM – 9:00 PM (Friday: 2:00 PM – 9:00 PM)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-2xs">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Send a Message</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent! Our team will contact you shortly.'); }} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Full Name" 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="017XXXXXXXX" 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Message / Inquiry</label>
                <textarea 
                  rows={4} 
                  required 
                  placeholder="How can we help you?" 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold rounded-lg uppercase tracking-wider"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">Our Story</span>
          <h1 className="text-3xl font-black text-gray-900">About {settings.storeName}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs space-y-6 text-sm text-gray-600 leading-relaxed">
          <p className="text-base text-gray-900 font-medium">
            {settings.aboutText}
          </p>
          <p>
            Established in Pakundia, Kishoreganj, {settings.storeName} is committed to offering verified, dependable furniture, electronics, and fashion merchandise with straightforward pricing and sincere customer care.
          </p>
          <p>
            With our customer-friendly Cash on Delivery policy, buyers anywhere in Bangladesh can inspect and enjoy authentic products backed by responsive customer support.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <ShieldCheck className="w-6 h-6 text-[#0f2c59] mx-auto mb-2" />
              <strong className="block text-xs text-gray-900">Authentic Goods</strong>
              <span className="text-[11px] text-gray-500">Quality inspected</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <Truck className="w-6 h-6 text-[#0f2c59] mx-auto mb-2" />
              <strong className="block text-xs text-gray-900">Nationwide COD</strong>
              <span className="text-[11px] text-gray-500">All 64 districts</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <RotateCcw className="w-6 h-6 text-[#0f2c59] mx-auto mb-2" />
              <strong className="block text-xs text-gray-900">7 Days Return</strong>
              <span className="text-[11px] text-gray-500">Fast replacement</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'shipping-policy') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Shipping & Delivery Policy</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <h2 className="text-base font-bold text-gray-900">1. Delivery Zones & Charges</h2>
          <p>• <strong>Inside Dhaka:</strong> Delivery fee is standard ৳80. Typical delivery timeframe is 24 to 48 hours.</p>
          <p>• <strong>Outside Dhaka / Nationwide:</strong> Delivery fee is standard ৳150. Typical delivery timeframe is 2 to 4 working days.</p>
          <h2 className="text-base font-bold text-gray-900 pt-2">2. Cash on Delivery (COD)</h2>
          <p>We provide full Cash on Delivery without requiring advance deposits for standard apparel orders. Payment is made directly to the courier representative upon delivery.</p>
          <h2 className="text-base font-bold text-gray-900 pt-2">3. Order Verification</h2>
          <p>Our representative will contact the mobile number provided at checkout to confirm details before parcel dispatch.</p>
        </div>
      </div>
    );
  }

  if (slug === 'return-policy') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Return & Exchange Policy</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <h2 className="text-base font-bold text-gray-900">7-Day Easy Exchange Guarantee</h2>
          <p>We want you to be completely satisfied with your purchase from {settings.storeName}. If an item arrives damaged, defective, or does not fit properly, you may request an exchange within 7 days of receiving your package.</p>
          <h2 className="text-base font-bold text-gray-900 pt-2">Conditions for Return:</h2>
          <p>• The item must be unused, unwashed, and in original packaging with price tags intact.</p>
          <p>• Please contact our support hotline at <strong>{settings.phone}</strong> or via WhatsApp to initiate your request.</p>
        </div>
      </div>
    );
  }

  if (slug === 'privacy-policy' || slug === 'terms') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-black text-gray-900 capitalize">{slug.replace('-', ' ')}</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <p>At {settings.storeName}, we value your privacy and security. We only collect customer information necessary to process orders, provide delivery updates, and ensure smooth customer support.</p>
          <p>We never sell or disclose your personal contact information to third parties.</p>
        </div>
      </div>
    );
  }

  if (slug === 'faq') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Frequently Asked Questions</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs space-y-6 text-xs sm:text-sm">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">How can I place an order?</h3>
            <p className="text-gray-600">Select your preferred item, size, and color, click 'Add to Cart' or 'Buy Now', and fill out the delivery address at checkout.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Is Cash on Delivery available?</h3>
            <p className="text-gray-600">Yes! Cash on Delivery is available across all 64 districts in Bangladesh.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">How do I track my order?</h3>
            <p className="text-gray-600">Use our 'Track Order' page by entering your Order Number or phone number.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 capitalize">{slug}</h1>
      <p className="text-xs text-gray-500 mt-2">Information page for {settings.storeName}.</p>
    </div>
  );
};
