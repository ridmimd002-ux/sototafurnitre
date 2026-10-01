import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { CONFIGURED_ADMIN_EMAIL } from '../../lib/firebase';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft, Key, CheckCircle } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { login, register, resetPassword } = useAuth();
  const { settings } = useSettings();

  const [email, setEmail] = useState(CONFIGURED_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    if (isResetMode) {
      try {
        await resetPassword(cleanEmail);
        setInfoMsg(`Password reset instructions have been sent to ${cleanEmail}. Check your inbox.`);
        setIsResetMode(false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send password reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isFirstTimeSetup) {
      // First time administrator account initialization
      if (cleanEmail !== CONFIGURED_ADMIN_EMAIL) {
        setErrorMsg(`Only the configured administrator email (${CONFIGURED_ADMIN_EMAIL}) can initialize admin credentials.`);
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        setSubmitting(false);
        return;
      }
      try {
        await register(cleanEmail, password, 'Store Administrator');
        onSuccess();
      } catch (err: any) {
        console.error('Admin registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setErrorMsg('An account with this email already exists. Please sign in with your password, or click "Forgot Password".');
          setIsFirstTimeSetup(false);
        } else {
          setErrorMsg(err.message || 'Failed to initialize administrator credentials.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Standard Login
    try {
      await login(cleanEmail, password);
      onSuccess();
    } catch (err: any) {
      console.error('Admin login error:', err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMsg('Incorrect email or password. If you have not created your password in Firebase Auth yet, click "Initialize First-Time Password" below.');
      } else if (code.includes('api-key-not-valid')) {
        setErrorMsg('Firebase API Key connection error. Please verify your Firebase project credentials in Settings.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please verify your administrator credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1b33] via-[#0f2c59] to-[#0a192f] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Logo & Title */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-black p-0.5 border-2 border-[#f59e0b] shadow-2xl mx-auto overflow-hidden">
            <img 
              src={settings.logoUrl || "/logo.png"} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-gray-400">
            {settings.storeName} Management Console
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          
          {infoMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    {isFirstTimeSetup ? 'Choose New Admin Password' : 'Password'}
                  </label>
                  {!isFirstTimeSetup && (
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(true); setErrorMsg(null); }}
                      className="text-[11px] font-semibold text-[#0f2c59] hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder={isFirstTimeSetup ? 'Minimum 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden focus:border-[#0f2c59]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#0f2c59] hover:bg-[#0a1f3f] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#f59e0b]" />
              <span>
                {submitting 
                  ? 'Verifying...' 
                  : isResetMode 
                  ? 'Send Password Reset Email' 
                  : isFirstTimeSetup 
                  ? 'Initialize Admin Password' 
                  : 'Sign In as Administrator'}
              </span>
            </button>
          </form>

          {/* First Time Setup & Reset Toggles */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2 text-center text-xs">
            {isResetMode ? (
              <button
                type="button"
                onClick={() => { setIsResetMode(false); setErrorMsg(null); }}
                className="text-[#0f2c59] font-semibold hover:underline"
              >
                ← Back to Admin Login
              </button>
            ) : isFirstTimeSetup ? (
              <button
                type="button"
                onClick={() => { setIsFirstTimeSetup(false); setErrorMsg(null); }}
                className="text-[#0f2c59] font-semibold hover:underline"
              >
                Already initialized your password? Click here to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsFirstTimeSetup(true); setErrorMsg(null); }}
                className="text-gray-600 hover:text-[#0f2c59] font-semibold"
              >
                First time logging into this Firebase project? <span className="text-[#0f2c59] underline">Initialize Password</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Store</span>
            </button>
          </div>

        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Protected Area • Authorized Administrator Access Only
        </p>

      </div>
    </div>
  );
};
