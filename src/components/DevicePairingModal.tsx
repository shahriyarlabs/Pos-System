import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { ShopSettings, SupabaseConfig } from '../types';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  supabaseConfig: SupabaseConfig;
  onUpdateShopKey: (newKey: string) => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  onClose,
  settings,
  supabaseConfig,
  onUpdateShopKey,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(settings.shopKey || 'brothers-digital');

  // Build the pairing URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const pairUrl = `${baseUrl}?shopKey=${encodeURIComponent(settings.shopKey || 'brothers-digital')}&pin=${encodeURIComponent(
    settings.adminPin || '1234'
  )}&autoPair=1`;

  useEffect(() => {
    if (isOpen && pairUrl) {
      QRCode.toDataURL(pairUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, pairUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customKeyInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (cleaned) {
      onUpdateShopKey(cleaned);
      setIsEditingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">মোবাইল ও পিসি পেয়ারিং (QR Connect)</h2>
              <p className="text-xs text-slate-400">লগইন বা পাসওয়ার্ড ছাড়াই ১-সেকেন্ডে ডিভাইস কানেক্ট</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Alert */}
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-3 border ${
              supabaseConfig.isConnected
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {supabaseConfig.isConnected
                  ? '🟢 ক্লাউড রিয়েল-টাইম সিঙ্ক চালু আছে!'
                  : '⚠️ ক্লাউড ডেটাবেজ এখনো সংযুক্ত হয়নি (লোকাল মোড)'}
              </p>
              <p className="text-[11px] mt-0.5 opacity-90">
                {supabaseConfig.isConnected
                  ? 'মোবাইল থেকে যা এন্ট্রি করবেন সাথে সাথে পিসিতে দেখাবে, এবং পিসির সব হিসাব মোবাইলে পাবেন।'
                  : 'পিসি ও মোবাইলে একযোগে রিয়েল-টাইম কাজ করতে অ্যাডমিন প্যানেল থেকে ফ্রি Supabase কানেক্ট করুন।'}
              </p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col items-center text-center">
            <p className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              আপনার অ্যান্ড্রয়েড মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন
            </p>

            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <img
                  src={qrDataUrl}
                  alt="Shop Pairing QR Code"
                  className="w-52 h-52 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="bg-white border border-slate-300 px-3 py-1 rounded-xl font-mono text-slate-700">
                শপ কোড: <strong className="text-emerald-700">{settings.shopKey || 'brothers-digital'}</strong>
              </span>
              <span className="bg-white border border-slate-300 px-3 py-1 rounded-xl font-mono text-slate-700">
                পিন কোড: <strong className="text-indigo-700">{settings.adminPin || '1234'}</strong>
              </span>
            </div>
          </div>

          {/* One Click Share / Copy Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>বা সরাসরি পেয়ারিং লিঙ্ক মোবাইলে পাঠান:</span>
              <span className="text-[10px] text-slate-400 font-normal">WhatsApp / SMS-এ পাঠাতে পারেন</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pairUrl}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 truncate focus:outline-hidden"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>
          </div>

          {/* How It Protects Data (No Login Issue Resolved) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
            <h4 className="font-bold flex items-center gap-1.5 text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              লগইন সিস্টেম ছাড়া অন্য কেউ কেন দেখতে পারবে না?
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-800">
              <li>
                আপনার দোকানের ডাটাবেজের সব তথ্য <strong>শপ কোড ({settings.shopKey || 'brothers-digital'})</strong> দিয়ে এনক্রিপ্ট ও লক করা।
              </li>
              <li>
                কোনো সাধারণ ভিজিটর নেটলিফাই লিঙ্কে ঢুকলে সে আপনার কোনো ক্যাশ বা বকেয়া দেখতে পারবে না; তার সামনে সম্পূর্ণ ফাঁকা নতুন পেজ আসবে।
              </li>
              <li>
                শুধুমাত্র আপনার এই কিউআর কোড স্ক্যান করা বা সিক্রেট পিন জানা থাকলেই আপনার ডাটার সাথে কানেক্ট হবে।
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {settings.shopName} • মাল্টি-ডিভাইস সিঙ্ক
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
