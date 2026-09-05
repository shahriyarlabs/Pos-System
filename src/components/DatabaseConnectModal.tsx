import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  Server,
  Key,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Unlink,
} from 'lucide-react';
import {
  testSupabaseConnection,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  getStoredSupabaseConfig,
  SUPABASE_SETUP_SQL,
} from '../lib/supabase';
import { SupabaseConfig } from '../types';

interface DatabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: SupabaseConfig;
  onConfigSaved: (config: SupabaseConfig) => void;
  onDisconnect: () => void;
  shopKey: string;
  onUpdateShopKey?: (key: string) => void;
}

export const DatabaseConnectModal: React.FC<DatabaseConnectModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigSaved,
  onDisconnect,
  shopKey,
  onUpdateShopKey,
}) => {
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [currentShopKey, setCurrentShopKey] = useState(shopKey || 'brothers-digital');

  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlEditor, setShowSqlEditor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSupabaseConfig();
      setUrl(stored.url || currentConfig.url || '');
      setAnonKey(stored.anonKey || currentConfig.anonKey || '');
      setCurrentShopKey(shopKey || 'brothers-digital');
      setTestStatus(null);
    }
  }, [isOpen, currentConfig, shopKey]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestStatus({
        type: 'error',
        message: 'অনুগ্রহ করে Supabase Project URL এবং Anon Key উভয়ই প্রদান করুন।',
      });
      return;
    }

    setIsTesting(true);
    setTestStatus({ type: 'info', message: 'ডাটাবেজ সংযোগ পরীক্ষা করা হচ্ছে...' });

    try {
      const result = await testSupabaseConnection(cleanUrl, cleanKey);
      if (result.success) {
        setTestStatus({
          type: 'success',
          message: result.message || 'Supabase ডাটাবেজ সফলভাবে সংযুক্ত হয়েছে!',
        });
      } else {
        setTestStatus({
          type: 'error',
          message: result.message || 'সংযোগ স্থাপন করা সম্ভব হয়নি। URL এবং Key পরীক্ষা করুন।',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: err.message || 'সংযোগ ব্যর্থ হয়েছে।',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    const cleanShopKey = currentShopKey.trim() || 'brothers-digital';

    if (!cleanUrl || !cleanKey) {
      setTestStatus({
        type: 'error',
        message: 'অনুগ্রহ করে Supabase Project URL এবং Anon Key উভয়ই লিখুন।',
      });
      return;
    }

    setIsTesting(true);
    const result = await testSupabaseConnection(cleanUrl, cleanKey);
    setIsTesting(false);

    if (result.success) {
      const newConfig: SupabaseConfig = {
        url: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        autoSync: true,
      };

      saveStoredSupabaseConfig(newConfig);
      if (onUpdateShopKey) {
        onUpdateShopKey(cleanShopKey);
      }
      onConfigSaved(newConfig);
      onClose();
    } else {
      setTestStatus({
        type: 'error',
        message: `ডাটাবেজ সংযোগ ব্যর্থ: ${result.message}`,
      });
    }
  };

  const handleDisconnect = () => {
    if (confirm('আপনি কি এই ডিভাইস থেকে Supabase ডাটাবেজ সংযোগ বিচ্ছিন্ন করতে চান?')) {
      clearStoredSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestStatus(null);
      onDisconnect();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>আপনার Supabase ডাটাবেজ যুক্ত করুন</span>
                {currentConfig.isConnected && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    সংযুক্ত
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                কোনো ডেমো ডাটা বা লোকালস্টোর নয় — সরাসরি আপনার নিজস্ব ক্লাউড ডাটাবেজ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Status feedback box */}
          {testStatus && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                testStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : testStatus.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : testStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">{testStatus.message}</div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Supabase Project URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supabase Project URL</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  https://xyz.supabase.co
                </span>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
              />
            </div>

            {/* Supabase Anon Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Project API Key (Anon / Public)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">anon public key</span>
              </div>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
              />
            </div>

            {/* Shop Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  দোকানের শপ কী (Shop Identifier Key)
                </label>
                <span className="text-[11px] text-slate-400">মাল্টি-ডিভাইস সিঙ্ক কোড</span>
              </div>
              <input
                type="text"
                value={currentShopKey}
                onChange={(e) => setCurrentShopKey(e.target.value)}
                placeholder="brothers-digital"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
              />
            </div>
          </div>

          {/* Quick Setup Instructions & SQL Copy */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                <span>ডাটাবেজ টেবিল সেটআপ স্ক্রিপ্ট (SQL Script)</span>
              </span>
              <button
                type="button"
                onClick={copySql}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>১-ক্লিকে SQL কপি</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              আপনার Supabase ড্যাশবোর্ডে গিয়ে{' '}
              <strong className="text-slate-800">SQL Editor &gt; New Query</strong>-তে এই স্ক্রিপ্টটি
              পেস্ট করে <strong className="text-slate-800">RUN</strong> চাপুন। এটি স্বয়ংক্রিয়ভাবে
              Transactions, Customers, Inventory ও MFS টেবিল তৈরি করবে।
            </p>

            <button
              type="button"
              onClick={() => setShowSqlEditor(!showSqlEditor)}
              className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer block"
            >
              {showSqlEditor ? '▲ SQL কোড লুকান' : '▼ সম্পূর্ণ SQL কোড দেখতে ক্লিক করুন'}
            </button>

            {showSqlEditor && (
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 border border-slate-700">
                {SUPABASE_SETUP_SQL}
              </pre>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {currentConfig.isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>সংযোগ বিচ্ছিন্ন করুন</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url || !anonKey}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Server className="w-3.5 h-3.5" />
              )}
              <span>টেস্ট কানেকশন</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndConnect}
              disabled={isTesting || !url || !anonKey}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ডাটাবেজ কানেক্ট ও সক্রিয় করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
