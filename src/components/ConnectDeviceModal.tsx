import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  Share2,
  X,
  ExternalLink,
  ShieldCheck,
  Laptop,
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ShopSettings, SupabaseConfig } from '../types';

interface ConnectDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: SupabaseConfig;
  settings: ShopSettings;
}

export const ConnectDeviceModal: React.FC<ConnectDeviceModalProps> = ({
  isOpen,
  onClose,
  supabaseConfig,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'link' | 'credentials'>('qr');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedShopId, setCopiedShopId] = useState(false);

  // Generate connection link that auto-configures new devices
  const shopId = settings.shopKey || 'bdc';
  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const connectUrl =
    supabaseConfig.url && supabaseConfig.anonKey && rawOrigin
      ? `${rawOrigin}${currentPath}?db_url=${encodeURIComponent(
          supabaseConfig.url
        )}&db_key=${encodeURIComponent(supabaseConfig.anonKey)}&shop=${encodeURIComponent(shopId)}`
      : '';

  useEffect(() => {
    if (!isOpen) return;

    if (connectUrl) {
      setIsGeneratingQr(true);
      QRCode.toDataURL(connectUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#064e3b', // deep emerald
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrCodeDataUrl(url);
          setIsGeneratingQr(false);
        })
        .catch((err) => {
          console.error('Failed to generate QR code:', err);
          setIsGeneratingQr(false);
        });
    }
  }, [isOpen, connectUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!connectUrl) return;
    navigator.clipboard.writeText(connectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyText = (text: string, setter: (val: boolean) => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const hasConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>নতুন ডিভাইস কানেক্ট করুন</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold">
                  Multi-Device Access
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                যেকোনো নতুন মোবাইল, ট্যাব বা কম্পিউটার থেকে দোকানে সরাসরি প্রবেশ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!hasConfig ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                এই ডিভাইসে ডাটাবেজ এখনো সংযুক্ত করা হয়নি!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                অন্য ডিভাইসে শেয়ার করার পূর্বে এই ডিভাইসে আপনার Supabase Project URL এবং Anon Key দিয়ে
                ডাটাবেজ কানেক্ট করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'qr'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR কোড স্ক্যান (সহজতম)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'link'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>১-ক্লিক সংযোগ লিংক</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'credentials'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>ম্যানুয়াল কোড কপি</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* TAB 1: QR CODE */}
              {activeTab === 'qr' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-950">
                        মোবাইল থেকে তাৎক্ষণিক কানেকশন:
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        আপনার নতুন ফোন বা ট্যাবলেটের সাধারণ <strong>ক্যামেরা</strong> অথবা{' '}
                        <strong>Google Lens</strong> দিয়ে নিচের QR কোডটি স্ক্যান করুন। কোনো কিছু
                        টাইপ করা ছাড়াই ডাটাবেজ স্বয়ংক্রিয়ভাবে সংযুক্ত হবে!
                      </p>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                    {isGeneratingQr ? (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        <span>QR কোড তৈরি হচ্ছে...</span>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                        <img
                          src={qrCodeDataUrl}
                          alt="Device Connect QR Code"
                          className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-rose-500 font-bold">
                        QR কোড তৈরি করা যায়নি
                      </div>
                    )}
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        দোকান: {settings.shopName} (ID: {shopId})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>সংযোগ লিংক কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-white" />
                          <span>অথবা ১-ক্লিক সংযোগ লিংক কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ONE-CLICK LINK */}
              {activeTab === 'link' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-900 mb-1">
                      ১-ক্লিক অটো-কানেকশন লিংক
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      এই লিংকটি কপি করে WhatsApp, মেসেঞ্জার বা ইমেইলের মাধ্যমে আপনার নতুন ডিভাইসে
                      পাঠান। নতুন ডিভাইসে লিংকটিতে ক্লিক করলেই প্রজেক্ট URL ও Anon Key স্বয়ংক্রিয়ভাবে
                      সংযুক্ত হয়ে যাবে।
                    </p>

                    <div className="mt-3 relative">
                      <input
                        type="text"
                        readOnly
                        value={connectUrl}
                        className="w-full pl-3 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-[11px] font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share on WhatsApp */}
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `আমার দোকানের পয়েন্ট অব সেল (POS) লিংক: ${connectUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>WhatsApp-এ শেয়ার করুন</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL CREDENTIALS */}
              {activeTab === 'credentials' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-600">
                    নতুন ডিভাইসে লগইন করার সময় <strong>"ডাটাবেজ URL ও Key দিন"</strong> অপশনে
                    নিচের তথ্যগুলো পেস্ট করে সরাসরি সংযুক্ত করতে পারেন:
                  </p>

                  {/* Project URL */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">১. Supabase Project URL:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(supabaseConfig.url || '', setCopiedUrl)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUrl ? 'কপি হয়েছে' : 'URL কপি'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 select-all truncate">
                      {supabaseConfig.url}
                    </div>
                  </div>

                  {/* Anon Key */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">২. Supabase Anon Key:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(supabaseConfig.anonKey || '', setCopiedKey)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? 'কপি হয়েছে' : 'Key কপি'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-800 select-all truncate">
                      {supabaseConfig.anonKey}
                    </div>
                  </div>

                  {/* Shop ID */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">৩. দোকানের শপ আইডি (Shop ID):</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(shopId, setCopiedShopId)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedShopId ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedShopId ? 'কপি হয়েছে' : 'আইডি কপি'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-emerald-800 select-all">
                      {shopId}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                একই সাথে একাধিক কম্পিউটার ও মোবাইলে ব্যবহার উপযোগী
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
