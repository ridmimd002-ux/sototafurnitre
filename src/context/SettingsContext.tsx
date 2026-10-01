import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSettings } from '../types';

const defaultSettings: StoreSettings = {
  storeName: "Sotota Furniture & Electronics",
  phone: "01777439960",
  email: "monsadbinridmi1292@gmail.com",
  address: "Tarakandi Bazar, Pakundia, Kishoregenj",
  whatsapp: "01777439960",
  currency: "BDT",
  currencySymbol: "৳",
  announcementBar: "Welcome to Sotota Furniture & Electronics! Cash on Delivery available all over Bangladesh.",
  announcementActive: true,
  logoUrl: "/logo.png",
  facebookUrl: "https://facebook.com",
  youtubeUrl: "",
  instagramUrl: "",
  aboutText: "Sotota Furniture & Electronics is your trusted destination for quality furniture, electronics, and lifestyle goods in Pakundia, Kishoreganj. We guarantee authentic products, prompt delivery, and reliable after-sales service.",
  returnPolicySnippet: "Easy 7-day return and exchange policy for defective or mismatched items.",
  freeShippingNotice: "Fast courier delivery across Bangladesh with Cash on Delivery option."
};

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => {}
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<StoreSettings>;
        setSettings({
          ...defaultSettings,
          ...data,
          logoUrl: data.logoUrl || defaultSettings.logoUrl
        });
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, () => {
      setSettings(defaultSettings);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await setDoc(doc(db, 'settings', 'general'), merged, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
