import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Smartphone,
  Package,
  FileText,
  PlusCircle,
  Settings,
  Search,
  Server,
  Calculator,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  User,
  RefreshCw,
} from 'lucide-react';
import { ShopSettings, SupabaseConfig, UserSession } from '../types';
import { formatTaka } from '../lib/calculations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onOpenSearch: () => void;
  onOpenCalculationAudit: () => void;
  cashInHand: number;
  todayNetProfit: number;
  lowStockCount: number;
  totalDue: number;
  settings: ShopSettings;
  supabaseConfig?: SupabaseConfig;
  onOpenDatabaseModal: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onRefreshData?: () => void;
  isDataLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenSearch,
  onOpenCalculationAudit,
  cashInHand,
  todayNetProfit,
  lowStockCount,
  totalDue,
  settings,
  supabaseConfig,
  onOpenDatabaseModal,
  currentUser,
  onLogout,
  onRefreshData,
  isDataLoading,
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
      labelBn: 'বাকি খাতা',
      labelEn: 'Due Ledger',
      icon: BookOpen,
      badge: totalDue > 0 ? formatTaka(totalDue) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'mfs-ledger',
      labelBn: 'এমএফএস ব্যাংকিং',
      labelEn: 'MFS Banking',
      icon: Smartphone,
    },
    {
      id: 'inventory',
      labelBn: 'স্টক ও মালামাল',
      labelEn: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} টি কম` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse',
    },
    {
      id: 'reports',
      labelBn: 'রিপোর্ট ও ক্যাশশিট',
      labelEn: 'Reports',
      icon: FileText,
    },
    {
      id: 'admin',
      labelBn: 'শপ সেটিংস ও ডাটাবেজ',
      labelEn: 'Shop & DB',
      icon: Settings,
    },
  ];

  const isConnected = Boolean(supabaseConfig?.isConnected && supabaseConfig?.url);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Banner with Database Live Status, Math Metrics & Logout Button */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Shop & Database Indicator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDatabaseModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition cursor-pointer ${
                isConnected
                  ? 'bg-emerald-950/90 border border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-amber-950/90 border border-amber-500 text-amber-300 hover:bg-amber-900 animate-pulse'
              }`}
              title="Supabase ডাটাবেজ কনফিগারেশন পরিবর্তন করতে ক্লিক করুন"
            >
              {isConnected ? (
                <>
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Supabase ডাটাবেজ লাইভ</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>ডাটাবেজ কানেক্ট করুন (URL & Key)</span>
                </>
              )}
            </button>

            {isConnected && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-300 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>অটো-সেভ সক্রিয় ({settings.shopKey || 'bdc'})</span>
              </span>
            )}

            {isConnected && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-950/70 border border-emerald-700/70 text-emerald-300"
                title="সব ডিভাইস ও ব্রাউজার থেকে স্বয়ংক্রিয় রিয়েলটাইম সিঙ্ক চালু (ম্যানুয়াল রিফ্রেশ প্রয়োজন নেই)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">অটো-সিঙ্ক চালু (লাইভ)</span>
              </div>
            )}

            <span className="font-bold text-white hidden lg:inline">{settings.shopName}</span>
          </div>

          {/* Quick Cash & Profit Figures + User Session & Logout */}
          <div className="flex items-center gap-2 text-[11px] font-medium flex-wrap">
            {/* Calculation Audit Button */}
            <button
              type="button"
              onClick={onOpenCalculationAudit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600 text-white font-semibold transition cursor-pointer"
              title="সমস্ত হিসাবের গাণিতিক ফর্মুলা ও যাচাইকরণ দেখুন"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-300" />
              <span>হিসাব অডিট</span>
            </button>

            {/* Cash in Hand Pill */}
            <div
              onClick={onOpenCalculationAudit}
              className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 cursor-pointer hover:border-slate-500 transition"
              title="হাতে নগদ ব্যালেন্স"
            >
              <span className="text-slate-400">হাতে নগদ:</span>
              <span className="text-amber-300 font-bold">{formatTaka(cashInHand)}</span>
            </div>

            {/* Profit Pill */}
            <div
              onClick={onOpenCalculationAudit}
              className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 cursor-pointer hover:border-slate-500 transition"
              title="আজকের মোট নিট লাভ"
            >
              <span className="text-slate-400">নিট লাভ:</span>
              <span className="text-emerald-300 font-bold">{formatTaka(todayNetProfit)}</span>
            </div>

            {/* User Profile Info Pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
              <User className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-white">
                {currentUser?.name || settings.ownerName || 'শাহরিয়ার ইমন'}
              </span>
            </div>

            {/* PROMINENT LOGOUT BUTTON */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-950/40 border border-rose-500"
                title="অ্যাপ থেকে লগআউট করতে এখানে ক্লিক করুন"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span>লগআউট (Logout)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings.shopLogo ? (
              <img
                src={settings.shopLogo}
                alt={settings.shopName}
                className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-sm border border-emerald-500/30 shrink-0">
                {settings.shopName ? settings.shopName.slice(0, 3) : 'POS'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                  {settings.shopName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Supabase POS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.shopSubtitle || 'ডিজিটাল সেন্টার ও শপ ম্যানেজমেন্ট'}
              </p>
            </div>
          </div>

          {/* Mobile Fast Action Buttons */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenCalculationAudit}
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="হিসাব অডিট"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="খুঁজুন"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ভাউচার</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                title="লগআউট (Logout)"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>খুঁজুন (ভাউচার, খদ্দের, পণ্য)</span>
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-500">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ভাউচার / লেনদেন</span>
          </button>

          {/* Desktop Secondary Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="সেশন শেষ করে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>লগআউট</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.labelBn}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
