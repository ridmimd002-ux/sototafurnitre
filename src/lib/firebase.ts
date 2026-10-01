import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Sanitizes environment variable strings to prevent quote-wrapping, commas, or syntax artifact issues.
 */
const sanitize = (val: unknown, fallback: string): string => {
  if (typeof val !== 'string') return fallback;
  // Strip quotes, commas, semicolons, and trailing brackets
  const clean = val.replace(/['",;}{]/g, '').trim();
  if (!clean || clean.includes('=') || clean.length > 100) return fallback;
  return clean;
};

export const firebaseConfig = {
  apiKey: sanitize(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyBSVLifG87ekxt_qEb6SmzYO00gLdpD_pA"),
  authDomain: sanitize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "sotota-furniture-8c587.firebaseapp.com"),
  projectId: sanitize(import.meta.env.VITE_FIREBASE_PROJECT_ID, "sotota-furniture-8c587"),
  storageBucket: sanitize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "sotota-furniture-8c587.firebasestorage.app"),
  messagingSenderId: sanitize(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "1029908127837"),
  appId: sanitize(import.meta.env.VITE_FIREBASE_APP_ID, "1:1029908127837:web:7106803bb8c55a89bdadb4")
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Admin Identity Constants
export const CONFIGURED_ADMIN_UID = sanitize(import.meta.env.VITE_ADMIN_UID, "jawGRLgtOBNKX75rKXap6Jnr3P22");
export const CONFIGURED_ADMIN_EMAIL = sanitize(import.meta.env.VITE_ADMIN_EMAIL, "monsadbinridmi1292@gmail.com").toLowerCase().trim();

/**
 * Validates whether an authenticated user possesses administrator authority.
 * Checks UID against configured administrator identity, email address, or custom claim.
 */
export const checkIsAdmin = (user: { uid?: string; email?: string | null; claims?: Record<string, any> } | null): boolean => {
  if (!user || !user.uid) return false;
  if (user.uid === CONFIGURED_ADMIN_UID) return true;
  if (user.email && user.email.toLowerCase().trim() === CONFIGURED_ADMIN_EMAIL) return true;
  if (user.claims && (user.claims.admin === true || user.claims.role === 'admin')) return true;
  return false;
};
