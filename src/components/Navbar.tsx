import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Smartphone,
  Package,
  FileText,
  Code2,
  PlusCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Settings,
  Search,
  Cloud,
} from 'lucide-react';
import { ShopSettings, SupabaseConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onOpenSearch: () => void;
  cashInHand: number;
  todayNetProfit: number;
  lowStockCount: number;
  totalDue: number;
  settings: ShopSettings;
  supabaseConfig: SupabaseConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenSearch,
  cashInHand,
  todayNetProfit,
  lowStockCount,
  totalDue,
  settings,
  supabaseConfig,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'due-ledger',
      labelBn: 'বকেয়া খাতা',
      labelEn: 'Due Ledger',
      icon: BookOpen,
      badge: totalDue > 0 ? `৳${totalDue.toLocaleString()}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'mfs-ledger',
      labelBn: 'মোবাইল ব্যাংকিং',
      labelEn: 'MFS Banking',
      icon: Smartphone,
    },
    {
      id: 'inventory',
      labelBn: 'স্টক ও ইনভেন্টরি',
      labelEn: 'Stock Control',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} টি কম` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse',
    },
    {
      id: 'reports',
      labelBn: 'রিপোর্ট ও রসিদ',
      labelEn: 'Reports & Memo',
      icon: FileText,
    },
    {
      id: 'admin',
      labelBn: 'অ্যাডমিন প্যানেল',
      labelEn: 'Admin Panel',
      icon: Settings,
      badge: supabaseConfig.isConnected ? 'Cloud' : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      id: 'architecture',
      labelBn: 'সিস্টেম ডক্স',
      labelEn: 'System Docs',
      icon: Code2,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Banner with Quick Metrics & Cloud Sync Indicator */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                supabaseConfig.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-emerald-300">{settings.shopName}</span>
            <span className="text-slate-400 hidden sm:inline">
              | {settings.shopSubtitle}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium">
            {/* Cloud sync status pill */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="ক্লাউড সংযোগ ও সিঙ্ক সেটিংস দেখতে ক্লিক করুন"
            >
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>{supabaseConfig.isConnected ? 'ক্লাউড সিঙ্ক চালু' : 'লোকাল মেমোরি'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">ক্যাশ ইন হ্যান্ড:</span>
              <span className="text-amber-300 font-bold">৳ {cashInHand.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">আজকের লাভ:</span>
              <span className="text-emerald-300 font-bold">৳ {todayNetProfit.toLocaleString()}</span>
            </div>
            {lowStockCount > 0 && (
              <div
                onClick={() => setActiveTab('inventory')}
                className="hidden lg:flex items-center gap-1 bg-rose-950/70 border border-rose-700 text-rose-300 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-rose-900 transition"
                title="কম স্টকের পণ্য দেখতে ক্লিক করুন"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{lowStockCount} আইটেম সতর্কবার্তা</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-sm border border-emerald-500/30">
              BDC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                  {settings.shopName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  POS v2.5
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.shopSubtitle} • Point of Sale & Digital Services
              </p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="খুঁজুন (Search)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewTransaction}
              id="mobile-quick-add-btn"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Action Buttons on Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search Spotlight Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200 transition text-xs group w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              <span className="text-slate-600 font-medium">যেকোনো তথ্য খুঁজুন...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 rounded border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={onOpenNewTransaction}
            id="desktop-quick-add-btn"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xs hover:shadow transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন লেনদেন এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 border-t border-slate-100">
        <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-2xl whitespace-nowrap transition relative ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.labelBn}</span>
                <span className="text-[11px] text-slate-400 font-normal hidden xl:inline">
                  ({item.labelEn})
                </span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
