import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../lib/auditLogger';
import { FileText, Save, Check } from 'lucide-react';

export const AdminPages: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  const [aboutText, setAboutText] = useState(settings.aboutText || '');
  const [returnPolicy, setReturnPolicy] = useState(settings.returnPolicySnippet || '');
  const [shippingNotice, setShippingNotice] = useState(settings.freeShippingNotice || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateSettings({
        aboutText,
        returnPolicySnippet: returnPolicy,
        freeShippingNotice: shippingNotice
      });
      if (user) {
        await logAdminAction(user.uid, user.email || '', 'Store Policies Updated', 'About & Policy texts updated');
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update pages:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-gray-900">Static Pages & Policy Customizer</h2>
        <p className="text-xs text-gray-500">
          Update the content displayed on your store's information and customer service pages.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Page content saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            About Store Introduction
          </label>
          <textarea
            rows={4}
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs leading-relaxed focus:border-[#0f2c59]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            Return & Exchange Policy Highlight
          </label>
          <textarea
            rows={3}
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs leading-relaxed focus:border-[#0f2c59]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            Shipping & Nationwide Delivery Notice
          </label>
          <textarea
            rows={2}
            value={shippingNotice}
            onChange={(e) => setShippingNotice(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs leading-relaxed focus:border-[#0f2c59]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Page Content'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
