import React, { useState } from 'react';
import {
  Settings,
  Cloud,
  Database,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  Laptop,
  Smartphone,
  Info,
  Layers,
  Trash2,
  PackagePlus,
  QrCode,
  Lock,
  Globe,
  LogOut,
  User,
  KeyRound,
} from 'lucide-react';
import {
  AuditLog,
  Customer,
  InventoryItem,
  MFSAccount,
  ShopSettings,
  SupabaseConfig,
  Transaction,
} from '../types';
import {
  SUPABASE_SETUP_SQL,
  SUPABASE_CLEANUP_SQL,
  SUPABASE_CLEANUP_EXCEPT_CASH_SQL,
  SUPABASE_DELETE_SHOP_SQL,
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase,
  getSupabaseClient,
  deleteAllFromSupabase,
  updateSupabaseSettings,
} from '../lib/supabase';

interface AdminPanelProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  supabaseConfig: SupabaseConfig;
  onUpdateSupabaseConfig: (newConfig: SupabaseConfig) => void;
  transactions: Transaction[];
  customers: Customer[];
  inventory: InventoryItem[];
  mfsAccounts: MFSAccount[];
  auditLogs: AuditLog[];
  onRestoreAllData: (data: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
    settings?: ShopSettings;
  }) => void;
  onClearAllData: () => void;
  onDataSyncedFromCloud: (cloudData: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
  }) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  onUpdateSettings,
  supabaseConfig,
  onUpdateSupabaseConfig,
  transactions,
  customers,
  inventory,
  mfsAccounts,
  auditLogs,
  onRestoreAllData,
  onClearAllData,
  onDataSyncedFromCloud,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'cloud_sync' | 'shop_profile' | 'backup_restore' | 'security' | 'audit_logs'
  >('cloud_sync');

  // Supabase form state
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCleanupSql, setCopiedCleanupSql] = useState(false);
  const [isCleaningUpCloud, setIsCleaningUpCloud] = useState(false);
  const [cleanupMode, setCleanupMode] = useState<'except_cash' | 'truncate' | 'shop'>('except_cash');

  // Shop Profile state
  const [profileForm, setProfileForm] = useState<ShopSettings>({ ...settings });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Handle Supabase Test & Save
  const handleTestAndSaveSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestResult({
        success: false,
        message: 'অনুগ্রহ করে Supabase Project URL এবং Anon Key উভয়ই লিখুন।',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTestingConnection(false);
    setTestResult(result);

    if (result.success) {
      onUpdateSupabaseConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        autoSync: true,
      });
    }
  };

  // Push local data to Supabase
  const handlePushToCloud = async () => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      alert('প্রথমে Supabase সংযোগ সক্রিয় করুন!');
      return;
    }

    setIsSyncing(true);
    const res = await pushAllToSupabase(
      client,
      {
        transactions,
        customers,
        inventory,
        mfsAccounts,
        settings,
      },
      settings.shopKey || 'brothers-digital'
    );
    setIsSyncing(false);

    if (res.success) {
      onUpdateSupabaseConfig({
        ...supabaseConfig,
        lastSyncTime: new Date().toISOString(),
      });
      alert(res.message);
    } else {
      alert(`সিঙ্ক ত্রুটি: ${res.message}`);
    }
  };

  // Pull data from Supabase
  const handlePullFromCloud = async () => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      alert('প্রথমে Supabase সংযোগ সক্রিয় করুন!');
      return;
    }

    setIsSyncing(true);
    const res = await pullAllFromSupabase(client, settings.shopKey || 'brothers-digital');
    setIsSyncing(false);

    if (res.success && res.data) {
      onDataSyncedFromCloud({
        transactions: res.data.transactions,
        customers: res.data.customers,
        inventory: res.data.inventory,
        mfsAccounts: res.data.mfsAccounts,
      });
      if (res.data.settings) {
        onUpdateSettings({ ...settings, ...res.data.settings });
      }
      onUpdateSupabaseConfig({
        ...supabaseConfig,
        lastSyncTime: new Date().toISOString(),
      });
      alert('ক্লাউড থেকে সর্বশেষ ডেটা সফলভাবে ডাউনলোড করা হয়েছে!');
    } else {
      alert(res.message || 'ডেটা লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const copySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleCopyCleanupSql = () => {
    let code = SUPABASE_CLEANUP_EXCEPT_CASH_SQL;
    if (cleanupMode === 'truncate') {
      code = SUPABASE_CLEANUP_SQL;
    } else if (cleanupMode === 'shop') {
      code = SUPABASE_DELETE_SHOP_SQL(settings.shopKey || 'brothers-digital');
    }
    navigator.clipboard.writeText(code);
    setCopiedCleanupSql(true);
    setTimeout(() => setCopiedCleanupSql(false), 3000);
  };

  const handleWipeSupabaseFromApp = async () => {
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) {
      alert('Supabase ক্লায়েন্ট সংযুক্ত নয়! প্রথমে প্রজেক্ট URL এবং Anon Key চেক করুন।');
      return;
    }

    const shopKey = settings.shopKey || 'brothers-digital';
    const warningMsg =
      cleanupMode === 'except_cash'
        ? `⚠️ আপনি কি ক্যাশ ইন হ্যান্ড (হাতে নগদ উদ্বৃত্ত) ও সেটিংস অক্ষত রেখে লেনদেন, কাস্টমার ও স্টক ক্লাউড থেকে মুছে ফেলতে চান?`
        : cleanupMode === 'shop'
        ? `⚠️ আপনি কি দোকান "${shopKey}" এর সমস্ত লেনদেন, কাস্টমার, স্টক ও হিসাব Supabase ক্লাউড থেকে মুছে ফেলতে চান?`
        : `⚠️ আপনি কি Supabase ক্লাউড ডেটাবেজের সমস্ত টেবিল (Transactions, Customers, Inventory, MFS, Settings) সম্পূর্ণরূপে খালি করতে চান?`;

    const confirmPrompt = window.prompt(
      `${warningMsg}\n\nএই প্রক্রিয়াটি অপরিবর্তনীয়! নিশ্চিত হলে নিচে হুবহু "DELETE" শব্দটি লিখে OK চাপুন:`
    );

    if (confirmPrompt !== 'DELETE') {
      if (confirmPrompt !== null) {
        alert('সঠিক কোড না লেখায় ডেটা মোছা বাতিল করা হয়েছে।');
      }
      return;
    }

    setIsCleaningUpCloud(true);
    try {
      const res = await deleteAllFromSupabase(
        client,
        cleanupMode === 'shop' ? shopKey : undefined,
        cleanupMode === 'except_cash'
      );
      if (res.success) {
        alert(res.message);
      } else {
        alert(`ত্রুটি: ${res.message}`);
      }
    } catch (e: any) {
      alert(`ব্যর্থ হয়েছে: ${e.message}`);
    } finally {
      setIsCleaningUpCloud(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(profileForm);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);

    // Sync to Supabase if connected
    if (supabaseConfig.isConnected && supabaseUrl && supabaseAnonKey) {
      try {
        const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
        if (client) {
          await updateSupabaseSettings(client, profileForm, settings.shopKey || 'brothers-digital');
        }
      } catch (err) {
        console.error('Failed to sync updated profile to Supabase', err);
      }
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      shopSettings: settings,
      transactions,
      customers,
      inventory,
      mfsAccounts,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Brothers_Digital_Center_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.readAsText(file, 'UTF-8');
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.customers) {
          if (confirm('আপনি কি নিশ্চিত যে এই ব্যাকআপ ফাইলটি বর্তমান ডেটার উপর রিস্টোর করতে চান?')) {
            onRestoreAllData({
              transactions: parsed.transactions || [],
              customers: parsed.customers || [],
              inventory: parsed.inventory || [],
              mfsAccounts: parsed.mfsAccounts || [],
              settings: parsed.shopSettings,
            });
            alert('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!');
          }
        } else {
          alert('অবৈধ ব্যাকআপ ফাইল! ফাইলটিতে লেনদেন ও গ্রাহকের সঠিক তথ্য নেই।');
        }
      } catch (err) {
        alert('ফাইলটি পড়তে সমস্যা হয়েছে। দয়া করে সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
      }
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Panel Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">অ্যাডমিন ও কন্ট্রোল প্যানেল</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                Super Admin
              </span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                Shop: {settings.shopKey || 'brothers-digital'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              মাল্টি-ডিভাইস ক্লাউড সিঙ্ক (PC & Android), রিয়েল-টাইম ডাটা, দোকানের প্রোফাইল ও নিরাপত্তা
            </p>
          </div>
        </div>

        {/* Sync Status Badge & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>শপ আইডি: <strong className="text-emerald-700 font-mono">{settings.shopKey || 'brothers-digital'}</strong></span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              supabaseConfig.isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {supabaseConfig.isConnected
                ? 'Supabase ক্লাউড সক্রিয় (PC + Android Sync)'
                : 'লোকাল ডিভাইস মেমোরি মোড'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:text-rose-800 transition flex items-center gap-1.5"
              title="অ্যাডমিন সেশন শেষ করে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>লগআউট (Lock)</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('cloud_sync')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'cloud_sync'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>মাল্টি-ডিভাইস ক্লাউড সিঙ্ক (Supabase & Mobile)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('shop_profile')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'shop_profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>দোকানের তথ্য ও ক্যাশ মেমো</span>
        </button>
        <button
          onClick={() => setActiveSubTab('backup_restore')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'backup_restore'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ডাটা ক্লিন, ব্যাকআপ ও রিস্টোর</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>নিরাপত্তা, শপ কী ও পিন কোড</span>
        </button>
        <button
          onClick={() => setActiveSubTab('audit_logs')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'audit_logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>কার্যকলাপ লগ ({auditLogs.length})</span>
        </button>
      </div>

      {/* SubTab 1: Cloud Sync (Supabase) */}
      {activeSubTab === 'cloud_sync' && (
        <div className="space-y-6">
          {/* Explanation Card: PC + Android Simultaneous Use */}
          <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold">+</span>
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold">যেকোনো ডিভাইস (মোবাইল ও পিসি) থেকে সরাসরি লগইন</h2>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                  আপনার যেকোনো মোবাইল, ট্যাবলেট বা কম্পিউটার ব্রাউজারে এই সাইটটি ওপেন করে আপনার <b>শপ আইডি</b> ({settings.shopKey || 'brothers-digital'}) এবং <b>পিন কোড</b> দিয়ে সরাসরি প্রবেশ করুন। কোনো পেয়ারিং কোডের প্রয়োজন নেই—একই সাথে সকল ডিভাইসে লাইভ ডেটা সিঙ্ক হবে।
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-white/10 rounded-xl font-mono text-emerald-300">
                    লগইন শপ আইডি: <b>{settings.shopKey || 'brothers-digital'}</b>
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 rounded-xl text-indigo-200">
                    মাস্টার পিন: <b>••••</b>
                  </span>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10 text-xs shrink-0">
                <div className="text-slate-300">বর্তমান ক্লাউড অবস্থা:</div>
                <div className="text-sm font-black text-emerald-400 mt-1">
                  {supabaseConfig.isConnected ? 'সক্রিয় ও রিয়েলটাইম সিঙ্ক চালু' : 'অফলাইন / লোকাল মোড'}
                </div>
                <div className="text-[11px] text-indigo-200 mt-1">
                  দোকানের কোড: <b>{settings.shopKey || 'brothers-digital'}</b>
                </div>
                {supabaseConfig.lastSyncTime && (
                  <div className="text-[10px] text-slate-300 mt-1">
                    সর্বশেষ সিঙ্ক: {new Date(supabaseConfig.lastSyncTime).toLocaleTimeString('bn-BD')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Netlify Deployment & Realtime FAQ Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>লগইন সিস্টেম ছাড়া নেটলিফাই (Netlify) লিঙ্কে অন্য কেউ কি ডাটা দেখতে পারবে?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <b>না, দেখতে পারবে না!</b> অ্যাপটিতে প্রতিটি দোকানের ডাটা আলাদা <b>Shop Key</b> দিয়ে ফিল্টার করা থাকে।
                কোনো বহিরাগত ভিজিটর আপনার নেটলিফাই লিঙ্কে ঢুকলে সে সম্পূর্ণ ফাঁকা নতুন খাতা দেখতে পাবে।
                শুধুমাত্র আপনার মোবাইল দিয়ে কিউআর কোড স্ক্যান করলে বা আপনার সিক্রেট শপ কোড ও ৪-ডিজিট পিন দিলেই
                আপনার দোকানের ডাটা লোড হবে। এছাড়াও আপনি যেকোনো সময় হেডার থেকে <b>"লক"</b> বোতাম চেপে কাউন্টার বন্ধ রাখতে পারবেন।
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>মোবাইল ও পিসি কিভাবে পরস্পরকে চিনবে?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                পিসির হেডার থেকে <b>"মোবাইল পেয়ার (QR)"</b> চাপলে একটি বিশেষ লিঙ্কযুক্ত কিউআর কোড আসবে।
                মোবাইল ফোনের ক্যামেরা দিয়ে স্ক্যান করলেই ফোনে স্বয়ংক্রিয়ভাবে একই শপ কী ও পিন সেট হয়ে যাবে।
                উভয় ডিভাইসেই একই Supabase কানেকশন সক্রিয় থাকায় WebSockets দিয়ে নিমিষেই রিয়েল-টাইম ডাটা আদান-প্রদান হবে।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supabase Credentials Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ১. Supabase প্রজেক্ট ক্রেডেনশিয়াল প্রদান করুন
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    আপনার Supabase ড্যাশবোর্ডের Settings &gt; API থেকে URL এবং anon public key কপি করে পেস্ট করুন।
                  </p>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Supabase খুলুন <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon (Public) Key
                  </label>
                  <textarea
                    rows={2}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={handleTestAndSaveSupabase}
                    disabled={isTestingConnection}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    <span>{isTestingConnection ? 'সংযোগ পরীক্ষা হচ্ছে...' : 'সংযোগ পরীক্ষা ও সেভ করুন'}</span>
                  </button>

                  {supabaseConfig.isConnected && (
                    <>
                      <button
                        onClick={handlePushToCloud}
                        disabled={isSyncing}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>ক্লাউডে ডেটা পাঠান (Push Local Data)</span>
                      </button>
                      <button
                        onClick={handlePullFromCloud}
                        disabled={isSyncing}
                        className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ক্লাউড থেকে ডেটা আনুন (Pull Cloud Data)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* SQL Setup Instructions */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">২. ডেটাবেজ টেবিল তৈরি (SQL)</h3>
                <button
                  onClick={copySqlScript}
                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>SQL স্ক্রিপ্ট কপি</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Supabase এ প্রথমবার সংযোগ করার পর আপনার ডেটাবেজে টেবিলগুলো ও রিয়েল-টাইম পাবলিকেশন তৈরি করতে SQL Editor এ নিচের কোডটি পেস্ট করে <b>RUN</b> চাপুন:
              </p>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl text-[11px] font-mono h-48 overflow-y-auto border border-slate-800">
                <pre>{SUPABASE_SETUP_SQL}</pre>
              </div>

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>✓ Row Level Security (RLS) স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।</p>
                <p>✓ মাল্টি-ডিভাইস রিয়েল-টাইম পাবলিকেশন অন্তর্ভুক্ত।</p>
              </div>
            </div>

            {/* 3. Database Data Cleanup Card */}
            <div className="lg:col-span-3 bg-rose-50/50 border border-rose-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-rose-950">
                        ৩. Supabase ডেটাবেজ ডাটা ক্লিনআপ (Delete All Data from Supabase)
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                        Danger Zone
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Supabase ক্লাউড থেকে সব ডেটা সম্পূর্ণ মুছে ফেলার জন্য নিচের SQL কোডটি ব্যবহার করুন অথবা সরাসরি অ্যাপ থেকে ক্লিন করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyCleanupSql}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedCleanupSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SQL কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ক্লিনআপ SQL কপি করুন</span>
                      </>
                    )}
                  </button>
                  {supabaseConfig.isConnected && (
                    <button
                      type="button"
                      onClick={handleWipeSupabaseFromApp}
                      disabled={isCleaningUpCloud}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${isCleaningUpCloud ? 'animate-spin' : ''}`} />
                      <span>{isCleaningUpCloud ? 'মুছে ফেলা হচ্ছে...' : 'অ্যাপ থেকে ক্লাউড ওয়াইপ করুন'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700">ক্লিনআপ মোড:</span>
                <div className="bg-white p-1 rounded-xl border border-rose-200 flex flex-wrap text-xs gap-1">
                  <button
                    type="button"
                    onClick={() => setCleanupMode('except_cash')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      cleanupMode === 'except_cash'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛡️ ক্যাশ ইন হ্যান্ড বাদে মুছুন</span>
                    <span className="text-[10px] opacity-80">(সুরক্ষিত)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanupMode('truncate')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      cleanupMode === 'truncate'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সকল টেবিল সম্পূর্ণ খালি (TRUNCATE ALL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanupMode('shop')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      cleanupMode === 'shop'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    নির্দিষ্ট শপের ডেটা মুছুন ({settings.shopKey || 'brothers-digital'})
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                <pre>
                  {cleanupMode === 'except_cash'
                    ? SUPABASE_CLEANUP_EXCEPT_CASH_SQL
                    : cleanupMode === 'truncate'
                    ? SUPABASE_CLEANUP_SQL
                    : SUPABASE_DELETE_SHOP_SQL(settings.shopKey || 'brothers-digital')}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-rose-800/90 pt-1">
                <div className="bg-white/80 p-3 rounded-xl border border-rose-200">
                  <p className="font-bold text-slate-900 mb-1">পদ্ধতি ১: Supabase SQL Editor এ চালানো (প্রস্তাবিত)</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ১. উপরে <b>"ক্লিনআপ SQL কপি করুন"</b> বাটনে চাপুন।<br />
                    ২. Supabase ড্যাশবোর্ডে গিয়ে <b>SQL Editor &gt; New query</b> খুলুন।<br />
                    ৩. কোডটি পেস্ট করে <b>RUN</b> চাপুন। কয়েক মিলিসেকেন্ডেই টেবিল সম্পূর্ণ ক্লিন হয়ে যাবে।
                  </p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-rose-200">
                  <p className="font-bold text-slate-900 mb-1">পদ্ধতি ২: সরাসরি এই অ্যাপ থেকে মোছা</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    আপনার Supabase সংযোগ সক্রিয় থাকলে সরাসরি <b>"অ্যাপ থেকে ক্লাউড ওয়াইপ করুন"</b> বাটনে চাপ দিন। নিরাপত্তার স্বার্থে কনফার্মেশন কোড "DELETE" টাইপ করলেই ক্লাউডের ডেটা মুছে যাবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Shop Profile & Receipt Customization */}
      {activeSubTab === 'shop_profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">দোকানের পরিচিতি ও রসিদ কাস্টমাইজেশন</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                এখানে দেওয়া তথ্যগুলো ক্যাশ মেমো, মানি রিসিট ও হেডার অংশে প্রদর্শিত হবে।
              </p>
            </div>
            {profileSaveSuccess && (
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> সফলভাবে সেভ হয়েছে!
              </div>
            )}
          </div>

          {/* Shop Logo Customization */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>দোকানের লোগো (Shop Logo)</span>
              </label>
              {profileForm.shopLogo && (
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, shopLogo: undefined })}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  লোগো মুছুন
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                {profileForm.shopLogo ? (
                  <img
                    src={profileForm.shopLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <input
                  type="file"
                  id="admin-logo-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setProfileForm({
                          ...profileForm,
                          shopLogo: ev.target?.result as string,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="admin-logo-upload"
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>নতুন লোগো আপলোড</span>
                  </label>
                  <span className="text-[11px] text-slate-500">অথবা অনলাইন ইমেজ লিংক দিন:</span>
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={profileForm.shopLogo || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, shopLogo: e.target.value || undefined })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">দোকানের নাম (বাংলা)</label>
              <input
                type="text"
                required
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">দোকানের ইংরেজি নাম / স্লোগান</label>
              <input
                type="text"
                value={profileForm.shopSubtitle}
                onChange={(e) => setProfileForm({ ...profileForm, shopSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">স্বত্বাধিকারী / পরিচালকের নাম</label>
              <input
                type="text"
                value={profileForm.ownerName}
                onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">দোকানের ঠিকানা / লোকেশন</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">প্রধান মোবাইল নম্বর (রসিদের জন্য)</label>
              <input
                type="text"
                required
                value={profileForm.phone1}
                onChange={(e) => setProfileForm({ ...profileForm, phone1: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বিকল্প মোবাইল নম্বর</label>
              <input
                type="text"
                value={profileForm.phone2}
                onChange={(e) => setProfileForm({ ...profileForm, phone2: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রারম্ভিক ক্যাশ ব্যালেন্স (Opening Cash in Hand)
              </label>
              <input
                type="number"
                value={profileForm.openingCashBalance}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, openingCashBalance: Number(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                দোকানের ক্যাশ ড্রয়ারে সকালের প্রারম্ভিক নগদ টাকা
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">রসিদের প্রিন্ট ফরম্যাট (Print Format)</label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>A4 ল্যান্ডস্কেপ (ডান পাশে একক ভাউচার • L: 8″ × W: 3″)</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">স্থিরীকৃত</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                যেকোনো প্রিন্টারে (যেমন এপসন L3210 বা অন্য যেকোনো প্রিন্টার) A4 পেপারের ডান প্রান্তে ভাউচার প্রিন্ট হবে।
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">রসিদের ফুটারে শুভেচ্ছা বার্তা</label>
              <input
                type="text"
                value={profileForm.receiptFooterNote}
                onChange={(e) => setProfileForm({ ...profileForm, receiptFooterNote: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
            >
              প্রোফাইল তথ্য সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* SubTab 3: Backup & Restore, Data Clean & Starters */}
      {activeSubTab === 'backup_restore' && (
        <div className="space-y-6">
          {/* Fresh Clean Slate Control Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>নেটলিফাই ডিপ্লয়মেন্টের পর সম্পূর্ণ ডাটা পরিষ্কার করুন (Fresh Start)</span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                আপনি যদি আপনার দোকানে আসল ব্যবসার কাজ শুরু করার জন্য সমস্ত আগের ডেমো লেনদেন, কাস্টমার এবং স্টক মুছে সম্পূর্ণ ফাঁকা করতে চান, তবে নিচের বোতাম চাপুন।
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => {
                  if (confirm('আপনি কি নিশ্চিত যে সকল লেনদেন, কাস্টমার ও স্টক মুছে ফেলে অ্যাপটি সম্পূর্ণ নতুন ও ফাঁকা করতে চান?')) {
                    onClearAllData();
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব ডেটা মুছে ফ্রেশ করুন</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">সম্পূর্ণ ডাটাবেজ ব্যাকআপ ডাউনলোড</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  আপনার সমস্ত লেনদেন, গ্রাহকের বকেয়া খাতা, ইনভেন্টরি পণ্য ও মোবাইল ব্যাংকিং তথ্য একটি ফাইলে সংরক্ষণ করুন।
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>মোট লেনদেন রেকর্ড:</span>
                  <span className="font-bold text-slate-900">{transactions.length} টি</span>
                </div>
                <div className="flex justify-between">
                  <span>মোট রেজিস্টার্ড গ্রাহক:</span>
                  <span className="font-bold text-slate-900">{customers.length} জন</span>
                </div>
                <div className="flex justify-between">
                  <span>ইনভেন্টরি পণ্য:</span>
                  <span className="font-bold text-slate-900">{inventory.length} টি</span>
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>ব্যাকআপ ফাইল ডাউনলোড করুন (.JSON)</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ব্যাকআপ ফাইল থেকে ডাটা রিস্টোর</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  পূর্বে সেভ করা যেকোনো JSON ব্যাকআপ ফাইল আপলোড করে ডেটা রিকভার করুন।
                </p>
              </div>

              <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 transition">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">JSON ব্যাকআপ ফাইল নির্বাচন করুন</span>
                <span className="text-[10px] text-slate-400 mt-0.5">ফাইল নির্বাচন করলেই স্বয়ংক্রিয়ভাবে রিস্টোর হবে</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Security, Admin Login & PIN */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">অ্যাডমিন অ্যাকাউন্ট, লগইন ও সিকিউরিটি</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  অ্যাডমিন লগইন আইডি, পাসওয়ার্ড ও মাল্টি-ডিভাইস সিঙ্ক কোড পরিবর্তন করুন।
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট টেস্ট</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যাডমিন ইউজারনেম (Admin Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settings.adminUsername || 'admin'}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        adminUsername: e.target.value.trim(),
                      })
                    }
                    placeholder="admin"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  লগইন পেজে ইউজারনেম হিসেবে ব্যবহার হবে (ডিফল্ট: admin)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যাডমিন পাসওয়ার্ড (Admin Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settings.adminPassword || settings.adminPin || '1234'}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        adminPassword: e.target.value.trim(),
                        adminPin: e.target.value.trim(),
                      })
                    }
                    placeholder="1234"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  লগইন পেজ ও সিকিউরিটিতে ব্যবহৃত হবে (ডিফল্ট: 1234)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  দোকানের সিঙ্ক কোড (Shop Sync Key)
                </label>
                <input
                  type="text"
                  value={settings.shopKey || 'brothers-digital'}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      shopKey: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  পিসি এবং অ্যান্ড্রয়েড মোবাইলে একই কোড দিয়ে ডেটা সিঙ্ক হবে।
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কাউন্টার লক ৪-ডিজিট পিন (Counter PIN)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={settings.adminPin || '1234'}
                  onChange={(e) => onUpdateSettings({ ...settings, adminPin: e.target.value })}
                  placeholder="1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-widest focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  কাউন্টার লক স্ক্রিন আনলক করতে ব্যবহৃত হবে (ডিফল্ট: 1234)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">অ্যাডমিন প্যানেলে লগইন স্ক্রিন সক্রিয়</span>
                  <span className="text-[11px] text-slate-500">
                    অ্যাডমিন প্যানেলে ঢুকতে ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন আবশ্যক হবে
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isPinProtectionEnabled !== false}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, isPinProtectionEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">অ্যাপ খোলার শুরুতেই লগইন আবশ্যক (Full Lock)</span>
                  <span className="text-[11px] text-slate-500">
                    সক্রিয় থাকলে দোকান ওপেন করার সময় সরাসরি অ্যাডমিন লগইন স্ক্রিন আসবে
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={!!settings.requireLoginForEntireApp}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, requireLoginForEntireApp: e.target.checked })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 5: Audit Logs */}
      {activeSubTab === 'audit_logs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">সিস্টেম কার্যকলাপ ও পরিবর্তন লগ (Audit Trail)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                দোকানের সাম্প্রতিক লেনদেন, স্টক আপডেট ও সেটিংস পরিবর্তনের টাইমস্ট্যাম্প লগ।
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">সর্বমোট {auditLogs.length} টি রেকর্ড</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">এখনো কোনো লগ রেকর্ড তৈরি হয়নি।</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between text-xs gap-4">
                  <div>
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{log.details}</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString('bn-BD')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
