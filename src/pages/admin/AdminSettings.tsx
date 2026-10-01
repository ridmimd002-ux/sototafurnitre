import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../lib/auditLogger';
import { Settings, Save, Check, Phone, Mail, MapPin, MessageCircle, AlertCircle } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState(settings.storeName || 'Sotota Furniture & Electronics');
  const [phone, setPhone] = useState(settings.phone || '01777439960');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '01777439960');
  const [email, setEmail] = useState(settings.email || 'monsadbinridmi1292@gmail.com');
  const [address, setAddress] = useState(settings.address || 'Tarakandi Bazar, Pakundia, Kishoregenj');
  const [announcementBar, setAnnouncementBar] = useState(settings.announcementBar || '');
  const [announcementActive, setAnnouncementActive] = useState(settings.announcementActive ?? true);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateSettings({
        storeName: storeName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        address: address.trim(),
        announcementBar: announcementBar.trim(),
        announcementActive,
        facebookUrl: facebookUrl.trim()
      });

      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Settings Changed', 'Store general settings updated');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-gray-900">Store Settings & Profile</h2>
        <p className="text-xs text-gray-500">
          Manage your business credentials, contact numbers, address, and live announcement banner.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Store settings saved and updated across the live website!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Contact Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            1. Business Information & Hotlines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Phone Hotline</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Order Number</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Showroom & Business Address</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
            />
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">
            2. Top Announcement Bar
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Message</label>
            <input
              type="text"
              value={announcementBar}
              onChange={(e) => setAnnouncementBar(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#0f2c59]"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="rounded text-[#0f2c59]"
              />
              <span>Display Announcement Bar on Customer Header</span>
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
