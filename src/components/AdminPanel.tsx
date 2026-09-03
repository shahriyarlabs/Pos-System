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
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase,
  getSupabaseClient,
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
  onResetToDemoData: () => void;
  onDataSyncedFromCloud: (cloudData: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
  }) => void;
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
  onResetToDemoData,
  onDataSyncedFromCloud,
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
    const res = await pushAllToSupabase(client, {
      transactions,
      customers,
      inventory,
      mfsAccounts,
    });
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
    const res = await pullAllFromSupabase(client);
    setIsSyncing(false);

    if (res.success && res.data) {
      onDataSyncedFromCloud(res.data);
      onUpdateSupabaseConfig({
        ...supabaseConfig,
        lastSyncTime: new Date().toISOString(),
      });
      alert('সফলভাবে ক্লাউড থেকে সর্বশেষ ডেটা লোড করা হয়েছে!');
    } else {
      alert(res.message || 'ক্লাউড থেকে ডেটা আনা যায়নি');
    }
  };

  // Copy SQL script
  const copySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Save Shop Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(profileForm);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopSettings: settings,
      transactions,
      customers,
      inventory,
      mfsAccounts,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
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
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              মাল্টি-ডিভাইস ক্লাউড সিঙ্ক (PC & Android), দোকানের প্রোফাইল, নিরাপত্তা ও ডাটা ব্যাকআপ
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-3">
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
          <span>মাল্টি-ডিভাইস ক্লাউড সিঙ্ক (Supabase)</span>
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
          <span>ডাটা ব্যাকআপ ও রিস্টোর</span>
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
          <span>নিরাপত্তা ও পিন কোড</span>
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
                  <h2 className="text-lg font-bold">পিসি ও অ্যান্ড্রয়েড মোবাইলে একযোগে ব্যবহার</h2>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                  হ্যাঁ! একই সাথে আপনার দোকানের কাউন্টার পিসি এবং অ্যান্ড্রয়েড মোবাইল থেকে একই একাউন্টে রিয়েল-টাইমে
                  লেনদেন, বকেয়া এবং স্টক পরিচালনা করতে একটি অনলাইন ক্লাউড ডেটাবেজ (যেমন <b>Supabase</b>) প্রয়োজন।
                  আপনার কাছে Supabase অ্যাক্সেস রয়েছে, তাই নিচের ৩টি সহজ ধাপে সংযোগ চালু করুন:
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10 text-xs shrink-0">
                <div className="text-slate-300">বর্তমান ক্লাউড অবস্থা:</div>
                <div className="text-sm font-black text-emerald-400 mt-1">
                  {supabaseConfig.isConnected ? 'সক্রিয় ও রিয়েলটাইম সিঙ্ক চালু' : 'অফলাইন / লোকাল মোড'}
                </div>
                {supabaseConfig.lastSyncTime && (
                  <div className="text-[10px] text-slate-300 mt-1">
                    সর্বশেষ সিঙ্ক: {new Date(supabaseConfig.lastSyncTime).toLocaleTimeString('bn-BD')}
                  </div>
                )}
              </div>
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
                        <span>ক্লাউড থেকে ডেটা লোড করুন (Pull Cloud Data)</span>
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
                Supabase এ প্রথমবার সংযোগ করার পর আপনার ডেটাবেজে ৪টি টেবিল (transactions, customers, inventory_items, mfs_accounts) স্বয়ংক্রিয়ভাবে তৈরি করতে SQL Editor এ নিচের কোডটি পেস্ট করে <b>RUN</b> চাপুন:
              </p>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl text-[11px] font-mono h-48 overflow-y-auto border border-slate-800">
                <pre>{SUPABASE_SETUP_SQL}</pre>
              </div>

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>✓ Row Level Security (RLS) স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।</p>
                <p>✓ Realtime ডেটা সিঙ্ক পলিসি অন্তর্ভুক্ত করা আছে।</p>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">ডিফল্ট রসিদের ধরন (Print Format)</label>
              <select
                value={profileForm.receiptType}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    receiptType: e.target.value as 'standard' | 'thermal',
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              >
                <option value="standard">স্ট্যান্ডার্ড ক্যাশ মেমো (A5 / হাফ-পেজ কালার প্রিন্ট)</option>
                <option value="thermal">থার্মাল পিওএস স্লিপ (58mm / 80mm মিনি প্রিন্টার)</option>
              </select>
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

      {/* SubTab 3: Backup & Restore */}
      {activeSubTab === 'backup_restore' && (
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">ডেমো টেস্ট ডেটা ফিরিয়ে আনতে চান?</span>
              <button
                onClick={() => {
                  if (confirm('আপনি কি টেস্ট নমুনা ডেটা রিস্টোর করতে চান?')) {
                    onResetToDemoData();
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট ডেমো ডেটা</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Security & PIN */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">অ্যাডমিন পিন কোড ও এক্সেস সিকিউরিটি</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কর্মচারী বা হেল্পার থাকা অবস্থায় স্পর্শকাতর হিসাব ও সেটিংস সুরক্ষিত রাখুন।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-800 block">৪-ডিজিট অ্যাডমিন পিন সুরক্ষা</span>
                <span className="text-[11px] text-slate-500">
                  সক্রিয় থাকলে অ্যাডমিন প্যানেল এবং রিপোর্ট দেখার সময় পিন প্রয়োজন হবে
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.isPinProtectionEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, isPinProtectionEnabled: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-600 rounded-md"
              />
            </div>

            {settings.isPinProtectionEnabled && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাডমিন পিন সেট করুন</label>
                <input
                  type="password"
                  maxLength={6}
                  value={settings.adminPin}
                  onChange={(e) => onUpdateSettings({ ...settings, adminPin: e.target.value })}
                  placeholder="যেমনঃ 1234"
                  className="w-48 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-widest focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">ডিফল্ট পিন: 1234</span>
              </div>
            )}
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
