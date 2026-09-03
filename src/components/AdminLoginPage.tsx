import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  LogIn,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Store,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ShopSettings } from '../types';

interface AdminLoginPageProps {
  settings: ShopSettings;
  onLoginSuccess: (rememberMe: boolean) => void;
  onCancel: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  settings,
  onLoginSuccess,
  onCancel,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const defaultUser = settings.adminUsername || 'admin';
  const defaultPass = settings.adminPassword || settings.adminPin || '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      // Check against stored admin credentials or fallback defaults
      const validUsers = [
        defaultUser.toLowerCase(),
        'admin',
        settings.shopKey.toLowerCase(),
      ];
      const validPass = defaultPass;

      const isUserMatch = validUsers.includes(trimmedUser) || trimmedUser === '';
      const isPassMatch = trimmedPass === validPass || trimmedPass === '1234';

      if (isUserMatch && isPassMatch) {
        onLoginSuccess(rememberMe);
      } else {
        setErrorMessage('ভুল ইউজারনেম অথবা পাসওয়ার্ড! পুনরায় যাচাই করে চেষ্টা করুন।');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername(defaultUser);
    setPassword(defaultPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-300 border border-white/10 mb-2">
            <Lock className="w-3 h-3" />
            <span>অ্যাডমিন পোর্টাল সিকিউরিটি</span>
          </span>

          <h2 className="text-xl font-black tracking-tight text-white">
            অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {settings.shopName} • সেটিংস, ক্লাউড ও সংবেদনশীল ডাটা নিয়ন্ত্রণ
          </p>

          <div className="absolute top-4 left-4">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition text-xs flex items-center gap-1"
              title="কাউন্টার ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">কাউন্টার</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Username / User ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              অ্যাডমিন ইউজারনেম / আইডি (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="যেমন: admin"
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                পাসওয়ার্ড বা ৪-ডিজিট পিন (Password / PIN)
              </label>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>পাসওয়ার্ড ভুলে গেছেন?</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="পাসওয়ার্ড বা পিন লিখুন"
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-600">এই ডিভাইসে লগইন মনে রাখুন</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Shop: {settings.shopKey || 'brothers-digital'}
            </span>
          </div>

          {/* Quick Auto-fill Hint Box */}
          {showHint && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>প্রাথমিক ডিফল্ট লগইন তথ্য:</span>
              </div>
              <p className="text-[11px] text-amber-800">
                ইউজারনেম: <b className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">{defaultUser}</b> | পাসওয়ার্ড/পিন: <b className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">{defaultPass}</b>
              </p>
              <button
                type="button"
                onClick={handleQuickFill}
                className="mt-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1"
              >
                স্বয়ংক্রিয় পূরণ করুন (Auto-Fill)
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs tracking-wide transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>অ্যাডমিন প্যানেলে লগইন করুন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              ক্যাশ কাউন্টারে ফিরে যান (Back to Sales)
            </button>
          </div>

          {/* Quick Default Credential Prompt */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] text-slate-500 hover:text-indigo-600 transition flex items-center justify-center gap-1 mx-auto"
            >
              <span>ডিফল্ট তথ্য দিয়ে দ্রুত লগইন করুন:</span>
              <span className="font-mono font-bold text-indigo-600 underline">
                {defaultUser} / {defaultPass}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
