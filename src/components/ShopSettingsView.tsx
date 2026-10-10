import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Image as ImageIcon,
  PenTool,
  Printer,
  Shield,
  Upload,
  Trash2,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  User,
  HelpCircle,
  FileText,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { ShopSettings } from '../types';

interface ShopSettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (newSettings: ShopSettings) => Promise<void> | void;
}

export const ShopSettingsView: React.FC<ShopSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'logo' | 'signature' | 'laser' | 'profile' | 'security'>('logo');
  
  // Local form state
  const [formData, setFormData] = useState<ShopSettings>({
    ...settings,
    voucherSignatureTitle: settings.voucherSignatureTitle || 'স্বত্বাধিকারী / অনুমোদিত স্বাক্ষর',
    showSignatureOnReceipt: settings.showSignatureOnReceipt !== false,
    showLogoOnReceipt: settings.showLogoOnReceipt !== false,
    voucherPaperSize: settings.voucherPaperSize || settings.receiptType || 'laser_half_a4',
    voucherCopiesCount: settings.voucherCopiesCount || 2,
    receiptGreeting: settings.receiptGreeting || 'বিসমিল্লাহির রাহমানির রাহিম',
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Signature Draw Pad Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  // Sync when prop updates
  useEffect(() => {
    setFormData({
      ...settings,
      voucherSignatureTitle: settings.voucherSignatureTitle || 'স্বত্বাধিকারী / অনুমোদিত স্বাক্ষর',
      showSignatureOnReceipt: settings.showSignatureOnReceipt !== false,
      showLogoOnReceipt: settings.showLogoOnReceipt !== false,
      voucherPaperSize: settings.voucherPaperSize || settings.receiptType || 'laser_half_a4',
      voucherCopiesCount: settings.voucherCopiesCount || 2,
      receiptGreeting: settings.receiptGreeting || 'বিসমিল্লাহির রাহমানির রাহিম',
    });
  }, [settings]);

  // Handle Logo File Upload (reads to base64 Data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (PNG, JPG, SVG ইত্যাদি) আপলোড করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, shopLogo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature File Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে স্বাক্ষরের ছবি ফাইল (PNG, JPG ইত্যাদি) আপলোড করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, voucherSignature: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Image URL Submit
  const handleApplyLogoUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({ ...prev, shopLogo: imageUrlInput.trim() }));
    setImageUrlInput('');
  };

  // Preset Logos (Fast selection)
  const presetLogos = [
    {
      label: 'কম্পিউটার ও ডিজিটাল সেন্টার',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&auto=format&fit=crop&q=80',
    },
    {
      label: 'স্টোর ও রিটেইল ট্রেড',
      url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80',
    },
    {
      label: 'মোবাইল ব্যাংকিং ও টেলিকম',
      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&auto=format&fit=crop&q=80',
    },
  ];

  // Signature Draw Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnOnCanvas(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setFormData((prev) => ({ ...prev, voucherSignature: dataUrl }));
    clearCanvas();
  };

  // Save Settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMessage('');
    try {
      await onSaveSettings(formData);
      setSaveSuccessMessage('দোকান সেটিংস সফলভাবে সংরক্ষিত ও ডাটাবেজে আপডেট হয়েছে!');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (e: any) {
      alert('সেটিংস সংরক্ষণে সমস্যা হয়েছে: ' + (e.message || 'ত্রুটি'));
    } finally {
      setIsSaving(false);
    }
  };

  const subTabs = [
    { id: 'logo', labelBn: 'লোগো সংযোজন', icon: ImageIcon },
    { id: 'signature', labelBn: 'ভাউচার স্বাক্ষর ও সিল', icon: PenTool },
    { id: 'laser', labelBn: 'লেজার প্রিন্টার ও মেমো', icon: Printer },
    { id: 'profile', labelBn: 'দোকানের বিবরণ', icon: Store },
    { id: 'security', labelBn: 'পিন ও প্রারম্ভিক ক্যাশ', icon: Shield },
  ];

  return (
    <div className="space-y-6 pb-20 no-print">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                দোকান সেটিংস ও ভাউচার ম্যানেজমেন্ট
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                লোগো পরিবর্তন, ক্যাশ মেমো স্বাক্ষর, লেজার প্রিন্ট সাইজ ও দোকানের সকল নিয়ন্ত্রণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setFormData(settings)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Sub-tabs */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 border-b border-slate-200 pb-2 scrollbar-none">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.labelBn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Settings Form, Right Mini Live Voucher Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Settings Section Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: LOGO ADDING & BRANDING */}
          {activeSubTab === 'logo' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  দোকানের লোগো সংযোজন ও পরিবর্তন
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  আপনার দোকানের লোগো আপলোড করুন। এটি ভাউচার, ক্যাশ মেমো এবং স্ক্রিনের উপরে প্রদর্শিত হবে।
                </p>
              </div>

              {/* Current Logo Preview & Actions */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden relative group">
                  {formData.shopLogo ? (
                    <img
                      src={formData.shopLogo}
                      alt="দোকানের লোগো"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-1" />
                      <span className="text-[10px] font-medium block">লোগো নেই</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {formData.shopLogo ? 'বর্তমান লোগো সক্রিয় রয়েছে' : 'কোনো লোগো আপলোড করা হয়নি'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    সুপারিশ: স্বচ্ছ ব্যাকগ্রাউন্ড (PNG) অথবা চারকোনা ছবি ব্যবহার করুন। সর্বোচ্চ সাইজ ২ মেগাবাইট।
                  </p>
                  {formData.shopLogo && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, shopLogo: undefined }))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>লোগো মুছে ফেলুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Method 1: File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  পদ্ধতি ১: ডিভাইস থেকে নতুন ছবি আপলোড করুন
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 text-center transition bg-slate-50/50">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    ছবি সিলেক্ট করতে ক্লিক করুন অথবা ড্র্যাগ অ্যান্ড ড্রপ করুন
                  </p>
                  <p className="text-[11px] text-slate-500 mb-4">
                    PNG, JPG, JPEG, WebP বা SVG ফরম্যাট সমর্থিত
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ছবি নির্বাচন করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Method 2: Image URL input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  পদ্ধতি ২: অনলাইন ইমেজ লিংক (URL) পেস্ট করুন
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/shop-logo.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    লিংক সেট করুন
                  </button>
                </div>
              </div>

              {/* Method 3: Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  পদ্ধতি ৩: রেডিমেড স্যাম্পল লোগো নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {presetLogos.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, shopLogo: preset.url }))}
                      className="p-3 border border-slate-200 hover:border-emerald-500 rounded-xl flex items-center gap-3 transition bg-white hover:bg-emerald-50/30 text-left cursor-pointer"
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle: Print Logo on Voucher */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">ভাউচারে লোগো প্রিন্ট করুন</div>
                  <div className="text-[11px] text-slate-500">
                    ক্যাশ মেমো প্রিন্ট করার সময় উপরে লোগো অন্তর্ভুক্ত থাকবে
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showLogoOnReceipt !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, showLogoOnReceipt: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: VOUCHER SIGNATURE & SEAL */}
          {activeSubTab === 'signature' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-emerald-600" />
                  ভাউচার স্বাক্ষর ও সিল ব্যবস্থাপনা (Voucher Signature & Stamp)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  স্বত্বাধিকারী বা ক্যাশিয়ারের ডিজিটাল স্বাক্ষর বা সিল যুক্ত করুন, যা মেমোর নিচে প্রিন্ট হবে।
                </p>
              </div>

              {/* Current Signature Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden relative">
                  {formData.voucherSignature ? (
                    <img
                      src={formData.voucherSignature}
                      alt="স্বাক্ষর"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <PenTool className="w-6 h-6 mx-auto stroke-1 text-slate-300 mb-1" />
                      <span className="text-[10px] font-medium block">স্বাক্ষর নেই</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {formData.voucherSignature ? 'স্বাক্ষর / সিল সংযুক্ত রয়েছে' : 'স্বাক্ষর যুক্ত করা হয়নি'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    সাদা কাগজের উপর কালো বা নীল কালির সইয়ের স্পষ্ট ছবি আপলোড করুন অথবা নিচে স্ক্রিনেই সই করুন।
                  </p>
                  {formData.voucherSignature && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, voucherSignature: undefined }))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>স্বাক্ষর মুছে ফেলুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Designation / Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  স্বাক্ষরের নিচে পদবি / টাইটেল
                </label>
                <input
                  type="text"
                  value={formData.voucherSignatureTitle || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, voucherSignatureTitle: e.target.value }))
                  }
                  placeholder="যেমন: স্বত্বাধিকারী / অনুমোদিত স্বাক্ষর"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {/* Fast Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">দ্রুত নির্বাচন:</span>
                  {[
                    'স্বত্বাধিকারী',
                    'অনুমোদিত স্বাক্ষর',
                    'ক্যাশিয়ার',
                    'ম্যানেজার',
                    'বিক্রয় প্রতিনিধি',
                  ].map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, voucherSignatureTitle: title }))
                      }
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition font-medium text-slate-700 cursor-pointer"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method 1: Upload Signature Image File */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  পদ্ধতি ১: স্বাক্ষরের ছবি বা সিলের ফটো আপলোড করুন
                </label>
                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                  <div className="text-xs text-slate-600">
                    ক্যামেরা দিয়ে তোলা কাগজের সই বা স্ক্যান কপি আপলোড করুন
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>স্বাক্ষরের ছবি নির্বাচন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Method 2: Draw on Screen Signature Pad */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    পদ্ধতি ২: স্ক্রিনে আঙুল বা মাউস দিয়ে সই করুন (Signature Pad)
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    পরিষ্কার করুন
                  </button>
                </div>

                <div className="border-2 border-slate-300 rounded-2xl bg-white p-2 relative shadow-inner overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[120px] touch-none cursor-crosshair rounded-xl border border-slate-100 bg-slate-50/30"
                  />
                  <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 pointer-events-none">
                    এখানে আপনার স্বাক্ষর আঁকুন
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={saveDrawnSignature}
                    disabled={!hasDrawnOnCanvas}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>এই সইটি সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>

              {/* Toggle: Print Signature on Voucher */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">ভাউচারে স্বাক্ষর লাইন প্রিন্ট করুন</div>
                  <div className="text-[11px] text-slate-500">
                    ক্যাশ মেমোর নিচে গ্রাহক ও স্বত্বাধিকারীর স্বাক্ষর অপশন থাকবে
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showSignatureOnReceipt !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, showSignatureOnReceipt: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LASER PRINTER & VOUCHER FORMAT MANAGEMENT ("leser mange") */}
          {activeSubTab === 'laser' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  লেজার প্রিন্টার ও মেমো ফরম্যাট ব্যবস্থাপনা (Laser Paper & Voucher Management)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  সাধারণ লেজার প্রিন্টার (A4 পেপার) ও পিওএস প্রিন্টারের সাইজ, কপি সংখ্যা ও লেখার নিয়ন্ত্রণ।
                </p>
              </div>

              {/* Paper Format Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  প্রিন্টার ও পেপারের ধরন (Laser Paper Size & Format)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      id: 'laser_half_a4',
                      title: '📄 লেজার A4 - কোয়ার্টার স্লিপ (স্ট্যান্ডার্ড)',
                      subtitle: 'যেকোনো HP/Canon A4 লেজার প্রিন্টার। পেপারের ডানপাশে ৩ ইঞ্চি স্লিপ ও কাটার দাগ।',
                      badge: 'সর্বোচ্চ জনপ্রিয়',
                    },
                    {
                      id: 'laser_quarter_a4',
                      title: '📑 লেজার A4 - ডুয়েল কপি (গ্রাহক + অফিস কপি)',
                      subtitle: 'একই A4 পেপারে পাশাপাশি ২টি কপি প্রিন্ট হবে। ১টি কাস্টমার ও ১টি দোকানের জন্য।',
                      badge: 'দ্বিমুখী কপি',
                    },
                    {
                      id: 'laser_full_a4',
                      title: '📋 লেজার A4 - পূর্ণাঙ্গ পেইজ ইনভয়েস',
                      subtitle: 'বড় চালান, কম্পিউটার সার্ভিসিং বা কর্পোরেট কাস্টমারদের জন্য ফুল A4 বিল।',
                      badge: 'ফুল সাইজ',
                    },
                    {
                      id: 'thermal_pos',
                      title: '🖨️ POS থার্মাল রোল (58mm / 80mm)',
                      subtitle: 'পিওএস থার্মাল পেপার রোল প্রিন্টার (ESC/POS)। দ্রুত কাউন্টার বিলিং।',
                      badge: 'রোল পেপার',
                    },
                  ].map((fmt) => {
                    const isSelected = formData.voucherPaperSize === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            voucherPaperSize: fmt.id as any,
                            receiptType: fmt.id as any,
                          }))
                        }
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{fmt.title}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {fmt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {fmt.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Number of Copies */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  প্রিন্ট কপির সংখ্যা (Voucher Copies)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, voucherCopiesCount: 1 }))}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.voucherCopiesCount === 1
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>১ কপি (শুধুমাত্র গ্রাহক কপি)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, voucherCopiesCount: 2 }))}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.voucherCopiesCount === 2
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>২ কপি (গ্রাহক কপি + দোকান রেকর্ড কপি)</span>
                  </button>
                </div>
              </div>

              {/* Greeting Text */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  ভাউচারের উপরে শুভেচ্ছা বার্তা (Top Greeting)
                </label>
                <input
                  type="text"
                  value={formData.receiptGreeting || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, receiptGreeting: e.target.value }))
                  }
                  placeholder="যেমন: বিসমিল্লাহির রাহমানির রাহিম"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Receipt Footer Note */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  রসিদের নিচের ধন্যবাদ বার্তা ও শর্তাবলী (Footer Note)
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptFooterNote || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, receiptFooterNote: e.target.value }))
                  }
                  placeholder="যেমন: আমাদের সেবা গ্রহণ করার জন্য আপনাকে ধন্যবাদ। আবার আসবেন!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SHOP PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  দোকানের পরিচিতি ও যোগাযোগের তথ্য (Shop Profile)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  দোকানের নাম, স্বত্বাধিকারী, মোবাইল নম্বর ও ঠিকানা আপডেট করুন।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    দোকানের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shopName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    সাবটাইটেল / স্লোগান (ইংরেজি বা বাংলা)
                  </label>
                  <input
                    type="text"
                    value={formData.shopSubtitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, shopSubtitle: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    স্বত্বাধিকারী / পরিচালকের নাম
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    প্রাথমিক মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={formData.phone1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone1: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    দ্বিতীয় মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.phone2}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone2: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    ইমেইল ঠিকানা (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  দোকানের পূর্ণাঙ্গ ঠিকানা
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="যেমন: বটতলা বাজার, মদন, নেত্রকোনা"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY PIN & OPENING CASH */}
          {activeSubTab === 'security' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  নিরাপত্তা পিন ও রেজিস্ট্রেশন প্রারম্ভিক ক্যাশ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  অ্যাডমিন পিন কোড এবং দোকান রেজিস্ট্রেশনের উদ্বোধনী ক্যাশ ব্যালেন্স নিয়ন্ত্রণ।
                </p>
              </div>

              {/* Informational Box Explaining Formula requested by user */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>হাতে নগদ হিসাবের স্বয়ংক্রিয় ফর্মুলা:</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <b>প্রতিদিনের সকালের প্রারম্ভিক ক্যাশ</b> = পূর্ববর্তী দিনের সমাপনী ক্যাশ ব্যালেন্স।
                  <br />
                  <b>দোকান রেজিস্ট্রেশন উদ্বোধনী ক্যাশ</b> শুধুমাত্র প্রথম দিন দোকান খোলার সময় একবার সেট করতে হয়। এরপর থেকে সফটওয়্যার স্বয়ংক্রিয়ভাবে বিগত দিনগুলোর লাভ-ক্ষতি ও নগদ প্রবাহ টেনে এনে আজকের প্রারম্ভিক ক্যাশ হিসাব করে।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    দোকান রেজিস্ট্রেশন প্রারম্ভিক ক্যাশ (টাকা)
                  </label>
                  <input
                    type="number"
                    value={formData.openingCashBalance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        openingCashBalance: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    শুধুমাত্র রেজিস্ট্রেশনের দিন দেওয়া মূল ব্যালেন্স।
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    অ্যাডমিন সিকিউরিটি পিন (৪ সংখ্যার পিন)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formData.adminPin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        adminPin: e.target.value,
                        adminPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono tracking-widest text-center font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    গুরুত্বপূর্ণ তথ্য মুছে ফেলা বা পরিবর্তনের জন্য প্রয়োজন হবে।
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Voucher Preview Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-20">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                লাইভ ভাউচার প্রিভিউ
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                প্রিন্ট কেমন দেখাবে
              </span>
            </div>

            {/* Scaled Mini Voucher Preview Box */}
            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 flex justify-center">
              <div
                className="bg-white border border-slate-400 p-3 shadow-sm rounded-lg text-slate-900 w-full max-w-[260px] flex flex-col justify-between"
                style={{ fontSize: '8px', minHeight: '340px' }}
              >
                {/* Greeting */}
                {formData.receiptGreeting && (
                  <div className="text-center font-bold text-slate-700 pb-1" style={{ fontSize: '7px' }}>
                    {formData.receiptGreeting}
                  </div>
                )}

                {/* Header */}
                <div className="text-center border-b border-slate-800 pb-2">
                  {formData.shopLogo && formData.showLogoOnReceipt !== false && (
                    <img
                      src={formData.shopLogo}
                      alt={formData.shopName}
                      className="w-7 h-7 mx-auto mb-1 object-contain rounded"
                    />
                  )}
                  <div className="font-black text-[11px] leading-tight">{formData.shopName}</div>
                  {formData.shopSubtitle && (
                    <div className="text-[7.5px] font-semibold text-slate-600">
                      {formData.shopSubtitle}
                    </div>
                  )}
                  <div className="text-[6.5px] text-slate-500 mt-0.5">{formData.address}</div>
                  <div className="text-[7px] font-bold">মোবা: {formData.phone1}</div>
                  <div className="inline-block border border-slate-800 px-1.5 py-0.2 mt-1 text-[6.5px] font-bold bg-slate-50">
                    ক্যাশ মেমো • গ্রাহক কপি
                  </div>
                </div>

                {/* Meta */}
                <div className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5 text-[7.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">চালান:</span>
                    <b className="font-mono">INV-589214</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">তারিখ:</span>
                    <b>{new Date().toLocaleDateString('bn-BD')}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">গ্রাহক:</span>
                    <b>মো: রফিকুল ইসলাম</b>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2 border-b border-dashed border-slate-300">
                  <table className="w-full text-[7.5px]">
                    <thead>
                      <tr className="border-b border-slate-400 font-bold">
                        <th className="text-left pb-0.5">বিবরণ</th>
                        <th className="text-right pb-0.5">টাকা</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pt-1">কম্পিউটার টাইপিং ও প্রিন্ট</td>
                        <td className="pt-1 text-right font-bold">৳১৫০</td>
                      </tr>
                      <tr>
                        <td className="pt-0.5">অনলাইন আবেদন ফি</td>
                        <td className="pt-0.5 text-right font-bold">৳২০০</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="py-1.5 border-t border-slate-900 space-y-0.5 text-[8px]">
                  <div className="flex justify-between font-bold">
                    <span>মোট বিল:</span>
                    <span>৳ ৩৫০</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-700">
                    <span>পরিশোধ (নগদ):</span>
                    <span>৳ ৩৫০</span>
                  </div>
                </div>

                {/* Footer + Signature */}
                <div className="pt-2 border-t border-dashed border-slate-400 mt-auto">
                  {formData.receiptFooterNote && (
                    <p className="text-center text-slate-500 mb-2 text-[6.5px]">
                      {formData.receiptFooterNote}
                    </p>
                  )}

                  {formData.showSignatureOnReceipt !== false && (
                    <div className="flex justify-between items-end text-[7px] text-slate-600 mt-2">
                      <div className="text-center">
                        <div className="w-10 border-b border-dotted border-slate-400 mb-0.5"></div>
                        গ্রাহক
                      </div>
                      <div className="text-center flex flex-col items-center">
                        {formData.voucherSignature ? (
                          <img
                            src={formData.voucherSignature}
                            alt="স্বাক্ষর"
                            className="h-5 max-w-[50px] object-contain mb-0.5"
                          />
                        ) : (
                          <div className="w-12 border-b border-dotted border-slate-400 mb-0.5"></div>
                        )}
                        <span className="font-semibold text-[6.5px]">
                          {formData.voucherSignatureTitle || 'স্বত্বাধিকারী'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center mt-2">
              কাগজের সাইজ: <b>{formData.voucherPaperSize === 'laser_quarter_a4' ? 'A4 ডুয়েল কপি' : formData.voucherPaperSize === 'laser_full_a4' ? 'A4 ফুল পেইজ' : formData.voucherPaperSize === 'thermal_pos' ? 'থার্মাল রোল' : 'A4 কোয়ার্টার স্লিপ'}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
