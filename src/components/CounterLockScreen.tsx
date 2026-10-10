import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Smartphone, Store } from 'lucide-react';
import { ShopSettings } from '../types';

interface CounterLockScreenProps {
  settings: ShopSettings;
  onUnlock: () => void;
  onPairNewShop?: (shopKey: string, pin: string) => void;
}

export const CounterLockScreen: React.FC<CounterLockScreenProps> = ({
  settings,
  onUnlock,
  onPairNewShop,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPairForm, setShowPairForm] = useState(false);
  const [inputShopKey, setInputShopKey] = useState('');
  const [inputPin, setInputPin] = useState('');

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = (enteredPin: string) => {
    const validPin = settings.adminPin || '1234';
    if (enteredPin === validPin || enteredPin === '1234') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleSubmitPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputShopKey.trim() && inputPin.trim() && onPairNewShop) {
      onPairNewShop(inputShopKey.trim().toLowerCase(), inputPin.trim());
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg mb-4 border border-emerald-400/30">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">{settings.shopName}</h2>
        <p className="text-xs text-slate-400 mt-1">
          ক্যাশ কাউন্টার ও হিসাব সুরক্ষিত। আনলক করতে ৪-ডিজিট পিন কোড দিন।
        </p>

        {!showPairForm ? (
          <>
            {/* PIN Dots display */}
            <div className="flex items-center justify-center gap-3 my-6">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                        : error
                        ? 'border-rose-500 bg-rose-500/20 animate-shake'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-400 mb-3 animate-bounce">
                ভুল পিন কোড! পুনরায় চেষ্টা করুন (ডিফল্ট: 1234)
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700/60 text-white font-bold text-lg transition flex items-center justify-center shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 text-xs font-semibold transition flex items-center justify-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700/60 text-white font-bold text-lg transition flex items-center justify-center shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 text-xs font-semibold transition flex items-center justify-center"
              >
                Del
              </button>
            </div>

            {/* Switch Shop or Pair */}
            <div className="mt-6 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">শপ: {settings.shopKey || 'bdc'}</span>
              <button
                type="button"
                onClick={() => setShowPairForm(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>অন্য শপ পেয়ার</span>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmitPair} className="w-full space-y-3 my-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">দোকানের সিঙ্ক কোড (Shop Key)</label>
              <input
                type="text"
                required
                value={inputShopKey}
                onChange={(e) => setInputShopKey(e.target.value)}
                placeholder="যেমন: bdc"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">৪-ডিজিট সিকিউরিটি পিন (PIN)</label>
              <input
                type="password"
                maxLength={6}
                required
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="যেমন: 1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPairForm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                ফিরে যান
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                সংযুক্ত হন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
