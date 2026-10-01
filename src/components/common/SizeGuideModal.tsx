import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tshirts' | 'shirts' | 'panjabi' | 'pants'>('tshirts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#0f2c59] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-gray-900 flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Standard Size Guide (Inches)</h2>
              <p className="text-xs text-gray-300">Measure your body or best fitting garment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto">
          {(['tshirts', 'shirts', 'panjabi', 'pants'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors capitalize ${
                activeTab === tab 
                  ? 'bg-white text-[#0f2c59] border-t-2 border-x border-[#0f2c59] -mb-[1px]' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'tshirts' ? 'T-Shirts & Polos' : tab}
            </button>
          ))}
        </div>

        {/* Tables */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'tshirts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest (Inches)</th>
                    <th className="py-2.5 px-3">Length (Inches)</th>
                    <th className="py-2.5 px-3">Sleeve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">S</td><td className="py-2.5 px-3">38"</td><td className="py-2.5 px-3">27"</td><td className="py-2.5 px-3">7.5"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">M</td><td className="py-2.5 px-3">40"</td><td className="py-2.5 px-3">28"</td><td className="py-2.5 px-3">8.0"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">L</td><td className="py-2.5 px-3">42"</td><td className="py-2.5 px-3">29"</td><td className="py-2.5 px-3">8.5"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">XL</td><td className="py-2.5 px-3">44"</td><td className="py-2.5 px-3">30"</td><td className="py-2.5 px-3">9.0"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">XXL</td><td className="py-2.5 px-3">46"</td><td className="py-2.5 px-3">31"</td><td className="py-2.5 px-3">9.5"</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shirts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest (Inches)</th>
                    <th className="py-2.5 px-3">Length (Inches)</th>
                    <th className="py-2.5 px-3">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">M (15)</td><td className="py-2.5 px-3">40"</td><td className="py-2.5 px-3">29"</td><td className="py-2.5 px-3">18"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">L (15.5)</td><td className="py-2.5 px-3">42"</td><td className="py-2.5 px-3">30"</td><td className="py-2.5 px-3">18.5"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">XL (16)</td><td className="py-2.5 px-3">44"</td><td className="py-2.5 px-3">31"</td><td className="py-2.5 px-3">19"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">XXL (16.5)</td><td className="py-2.5 px-3">46"</td><td className="py-2.5 px-3">31.5"</td><td className="py-2.5 px-3">19.5"</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'panjabi' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest (Inches)</th>
                    <th className="py-2.5 px-3">Length (Inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">38</td><td className="py-2.5 px-3">40"</td><td className="py-2.5 px-3">38"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">40</td><td className="py-2.5 px-3">42"</td><td className="py-2.5 px-3">40"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">42</td><td className="py-2.5 px-3">44"</td><td className="py-2.5 px-3">42"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">44</td><td className="py-2.5 px-3">46"</td><td className="py-2.5 px-3">44"</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="py-2.5 px-3">Waist (Inches)</th>
                    <th className="py-2.5 px-3">Hip</th>
                    <th className="py-2.5 px-3">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">30"</td><td className="py-2.5 px-3">38"</td><td className="py-2.5 px-3">39"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">32"</td><td className="py-2.5 px-3">40"</td><td className="py-2.5 px-3">40"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">34"</td><td className="py-2.5 px-3">42"</td><td className="py-2.5 px-3">41"</td></tr>
                  <tr><td className="py-2.5 px-3 font-bold text-gray-900">36"</td><td className="py-2.5 px-3">44"</td><td className="py-2.5 px-3">42"</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
            <strong>Tip:</strong> If you are between two sizes, we recommend selecting the larger size for a relaxed comfortable fit.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
