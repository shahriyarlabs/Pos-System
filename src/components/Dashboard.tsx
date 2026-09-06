import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calculator,
  Plus,
  Search,
  Printer,
  ChevronRight,
  Package,
  Users,
  Smartphone,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Customer, InventoryItem, MFSAccount, ShopSettings, Transaction } from '../types';
import { auditAllCalculations, formatTaka } from '../lib/calculations';

interface DashboardProps {
  transactions: Transaction[];
  customers: Customer[];
  inventory: InventoryItem[];
  mfsAccounts: MFSAccount[];
  settings: ShopSettings;
  onOpenNewTransaction: () => void;
  onOpenReceipt: (transaction: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenCalculationAudit: () => void;
  onDeleteTransaction?: (id: string) => void;
  onRefreshData?: () => void;
  isDataLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  customers,
  inventory,
  mfsAccounts,
  settings,
  onOpenNewTransaction,
  onOpenReceipt,
  onNavigateToTab,
  onOpenCalculationAudit,
  onDeleteTransaction,
  onRefreshData,
  isDataLoading,
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [trxFilter, setTrxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // 1. Audit Calculation Result (Memoized for high-speed rendering)
  const audit = useMemo(
    () => auditAllCalculations(settings, transactions, mfsAccounts, customers, inventory),
    [settings, transactions, mfsAccounts, customers, inventory]
  );

  // Dynamic counts for each period tab (Memoized)
  const periodCounts = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;
    const weekMidnight = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let today = 0;
    let yesterday = 0;
    let week = 0;
    let month = 0;

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const time = new Date(t.timestamp).getTime();
      const d = new Date(t.timestamp);

      if (time >= todayMidnight) today++;
      if (time >= yesterdayMidnight && time < todayMidnight) yesterday++;
      if (time >= weekMidnight) week++;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) month++;
    }

    return {
      today,
      yesterday,
      week,
      month,
      all: transactions.length,
    };
  }, [transactions]);

  // Filter transactions based on selected period (Memoized)
  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;
    const now = new Date();
    const todayDate = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).getDate();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    return transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      if (period === 'today') {
        return (
          tDate.getDate() === todayDate &&
          tDate.getMonth() === todayMonth &&
          tDate.getFullYear() === todayYear
        );
      } else if (period === 'yesterday') {
        return (
          tDate.getDate() === yesterdayDate &&
          tDate.getMonth() === todayMonth &&
          tDate.getFullYear() === todayYear
        );
      } else if (period === 'week') {
        return tDate.getTime() >= sevenDaysAgo;
      } else {
        // Month
        return tDate.getMonth() === todayMonth && tDate.getFullYear() === todayYear;
      }
    });
  }, [transactions, period]);

  // Calculate Period-specific Income and Expense (Memoized)
  const { periodIncome, periodExpense, periodNetProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (let i = 0; i < filteredTransactions.length; i++) {
      const t = filteredTransactions[i];
      if (t.type === 'INCOME') income += t.amount;
      else if (t.type === 'EXPENSE') expense += t.amount;
    }
    return {
      periodIncome: income,
      periodExpense: expense,
      periodNetProfit: income - expense,
    };
  }, [filteredTransactions]);

  // If 'today' tab is active but today has 0 transactions while database contains existing transactions,
  // automatically show recent transactions so the user never sees an empty screen or feels the need to manually refresh!
  const isAutoShowingRecent = period === 'today' && periodCounts.today === 0 && transactions.length > 0;
  const targetTrxList = isAutoShowingRecent ? transactions : filteredTransactions;

  // Filtered list for the transactions table (Memoized so typing search does not recompute other stats)
  const displayedTransactions = useMemo(() => {
    const q = trxSearchQuery.trim().toLowerCase();
    return targetTrxList.filter((t) => {
      if (trxFilter !== 'ALL' && t.type !== trxFilter) return false;
      if (q) {
        const match =
          t.invoiceNo.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          (t.customerPhone && t.customerPhone.includes(q)) ||
          t.categoryLabelBn.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          String(t.amount).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [targetTrxList, trxFilter, trxSearchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Time Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            {settings.shopLogo ? (
              <img
                src={settings.shopLogo}
                alt={settings.shopName}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : null}
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {settings.shopName} — ড্যাশবোর্ড
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shrink-0">
              ডাটাবেজ সংযুক্ত
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            স্বত্বাধিকারী: <strong className="text-slate-700">{settings.ownerName || 'শপ ওনার'}</strong> • সরাসরি ক্লাউড ডাটাবেজে সংরক্ষিত রিয়েল-টাইম আয়, ব্যয়, নগদ ক্যাশ ও বাকি খাতা
          </p>
        </div>

        {/* Period Selector & Audit Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenCalculationAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>হিসাব মেলানো ও অডিট</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(
              [
                { id: 'today', label: `আজ (${periodCounts.today})` },
                { id: 'yesterday', label: `গতকাল (${periodCounts.yesterday})` },
                { id: 'week', label: `৭ দিন (${periodCounts.week})` },
                { id: 'month', label: `চলতি মাস (${periodCounts.month})` },
                { id: 'all', label: `সব (${periodCounts.all})` },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPeriod(btn.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === btn.id
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Cloud Auto-Save Status Strip */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ক্লাউড অটো-সেভ সক্রিয়</span>
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300">
            দোকান আইডি: <strong className="text-emerald-300 font-mono">{settings.shopKey || 'bdc'}</strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300">
            ডাটাবেজে মোট: <b className="text-white">{transactions.length}</b>টি ভাউচার, <b className="text-white">{inventory.length}</b>টি পণ্য, <b className="text-white">{customers.length}</b>জন কাস্টমার
          </span>
        </div>

        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isDataLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
            title="Supabase ক্লাউড থেকে সর্বশেষ ডাটা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isDataLoading ? 'animate-spin' : ''}`} />
            <span>{isDataLoading ? 'সিঙ্ক হচ্ছে...' : 'ডাটাবেজ রিফ্রেশ'}</span>
          </button>
        )}
      </div>

      {/* 4 PRIMARY METRIC CARDS (Fresh, High-Craft Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash in Hand Card (Mathematical & Verifiable) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              হাতে নগদ (ক্যাশ ড্রয়ার)
            </span>
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatTaka(audit.netCashInHand)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>প্রারম্ভিক: {formatTaka(audit.openingCash)}</span>
              <button
                type="button"
                onClick={onOpenCalculationAudit}
                className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                সূত্র দেখুন <HelpCircle className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Total Income Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              {period === 'today' ? 'আজকের মোট আয় ও বিক্রি' : 'নির্বাচিত মেয়াদের আয়'}
            </span>
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {formatTaka(periodIncome)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>ফটোকপি, প্রিন্ট, পণ্য ও সেবা</span>
              <span className="text-emerald-700 font-semibold">{filteredTransactions.filter((t) => t.type === 'INCOME').length} টি ভাউচার</span>
            </div>
          </div>
        </div>

        {/* 3. Total Expense Card */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-5 rounded-2xl border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              {period === 'today' ? 'আজকের মোট খরচ' : 'নির্বাচিত মেয়াদের খরচ'}
            </span>
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {formatTaka(periodExpense)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>দোকান ভাড়া, বিদ্যুৎ, চা ও মাল ক্রয়</span>
              <span className="text-rose-700 font-semibold">{filteredTransactions.filter((t) => t.type === 'EXPENSE').length} টি খরচ</span>
            </div>
          </div>
        </div>

        {/* 4. Net Operating Profit Card */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white p-5 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              নিট লাভ / উদ্বৃত্ত (Net Profit)
            </span>
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              periodNetProfit >= 0 ? 'text-blue-700' : 'text-rose-700'
            }`}>
              {formatTaka(periodNetProfit)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {periodNetProfit >= 0 ? 'আয় থেকে ব্যয় বাদ দিয়ে মুনাফা' : 'খরচ বেশি হয়েছে'}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY STATUS PILLARS: Customer Dues, MFS, and Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Due Ledger Banner */}
        <div
          onClick={() => onNavigateToTab('due-ledger')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">মোট বাজার বাকি (Due)</div>
              <div className="text-xl font-extrabold text-amber-700">{formatTaka(audit.totalPendingCustomerDues)}</div>
              <div className="text-[11px] text-slate-500">{audit.activeDueCustomersCount} জন খদ্দেরের কাছে পাওনা</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        {/* MFS Balances Banner */}
        <div
          onClick={() => onNavigateToTab('mfs-ledger')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">এমএফএস ডিজিটাল ব্যালেন্স</div>
              <div className="text-xl font-extrabold text-purple-700">{formatTaka(audit.totalMfsElectronicBalance)}</div>
              <div className="text-[11px] text-slate-500">আজকের কমিশন: {formatTaka(audit.mfsCommissionsEarned)}</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        {/* Inventory Valuation Banner */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">মোট মালামাল ক্রয়মূল্য</div>
              <div className="text-xl font-extrabold text-teal-700">{formatTaka(audit.totalInventoryPurchaseValue)}</div>
              <div className="text-[11px] text-slate-500">
                {audit.lowStockItemsCount > 0 ? (
                  <span className="text-rose-600 font-bold">{audit.lowStockItemsCount} টি পণ্যের স্টক কম</span>
                ) : (
                  <span>মোট {inventory.length} টি মালামাল আইটেম</span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Auto-Sync Reassurance Notice when today is empty but past transactions exist in DB */}
        {isAutoShowingRecent && (
          <div className="p-4 bg-emerald-50/90 border-b border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-950">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-900">আজকের তারিখে এখনো কোনো ভাউচার কাটা হয়নি</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 font-semibold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    অটো-সিঙ্ক লাইভ
                  </span>
                </div>
                <span className="text-emerald-800">
                  ম্যানুয়াল রিফ্রেশ করার প্রয়োজন নেই — ডাটাবেজের পূর্ববর্তী <b>{transactions.length}টি লেনদেনের</b> সর্বশেষগুলো স্বয়ংক্রিয়ভাবে নিচে প্রদর্শিত হচ্ছে।
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {periodCounts.yesterday > 0 && (
                <button
                  type="button"
                  onClick={() => setPeriod('yesterday')}
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold cursor-pointer transition shadow-2xs"
                >
                  গতকালকের লেনদেন ({periodCounts.yesterday})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
              >
                সব লেনদেন দেখুন ({transactions.length}টি)
              </button>
            </div>
          </div>
        )}

        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">সাম্প্রতিক ভাউচার ও লেনদেন হিসাব</h3>
            <p className="text-xs text-slate-500">সরাসরি সেন্ট্রাল ডাটাবেজে সংরক্ষিত রেকর্ড</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTrxFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  trxFilter === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                }`}
              >
                সব
              </button>
              <button
                type="button"
                onClick={() => setTrxFilter('INCOME')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  trxFilter === 'INCOME' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                }`}
              >
                আয় / বিক্রি
              </button>
              <button
                type="button"
                onClick={() => setTrxFilter('EXPENSE')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  trxFilter === 'EXPENSE' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'
                }`}
              >
                খরচ
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={trxSearchQuery}
                onChange={(e) => setTrxSearchQuery(e.target.value)}
                placeholder="ভাউচার বা খদ্দের খুঁজুন..."
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ভাউচার নং</th>
                <th className="py-3 px-4">তারিখ ও সময়</th>
                <th className="py-3 px-4">বিবরণ ও ক্যাটাগরি</th>
                <th className="py-3 px-4">গ্রাহক / বিবরণ</th>
                <th className="py-3 px-4">পেমেন্ট মেথড</th>
                <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 px-4 text-slate-500 bg-slate-50/50">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-semibold text-slate-800 text-sm">
                        {period === 'today'
                          ? 'আজকের তারিখে কোনো লেনদেন পাওয়া যায়নি'
                          : 'নির্বাচিত ফিল্টারে কোনো লেনদেন মেলেনি'}
                      </p>
                      {transactions.length > 0 ? (
                        <>
                          <p className="text-xs text-slate-500">
                            ক্লাউড ডাটাবেজে আপনার মোট <b>{transactions.length}</b>টি লেনদেন সম্পূর্ণ সুরক্ষিতভাবে সংরক্ষিত রয়েছে।
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                            {periodCounts.yesterday > 0 && (
                              <button
                                type="button"
                                onClick={() => setPeriod('yesterday')}
                                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                              >
                                গতকালকের লেনদেন ({periodCounts.yesterday}টি)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPeriod('all')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              সব লেনদেন দেখুন ({transactions.length}টি)
                            </button>
                            <button
                              type="button"
                              onClick={onOpenNewTransaction}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                              + নতুন ভাউচার করুন
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">
                          কোনো লেনদেন পাওয়া যায়নি। নতুন ভাউচার তৈরি করতে উপরের বাটনে ক্লিক করুন।
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {trx.invoiceNo || 'BDC-VCHR'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(trx.timestamp).toLocaleString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{trx.categoryLabelBn}</div>
                      {trx.note && <div className="text-[11px] text-slate-500">{trx.note}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {trx.customerName ? (
                        <div>
                          <span className="font-medium text-slate-800">{trx.customerName}</span>
                          {trx.customerPhone && (
                            <div className="text-[11px] text-slate-500">{trx.customerPhone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          trx.paymentMethod === 'CASH'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : trx.paymentMethod === 'DUE'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {trx.paymentMethodLabelBn || trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black text-sm ${
                          trx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {trx.type === 'INCOME' ? '+' : '-'}
                        {formatTaka(trx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(trx)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="ভাউচার রসিদ প্রিন্ট করুন"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`আপনি কি সত্যিই ভাউচার #${trx.invoiceNo} মুছে ফেলতে চান?`)) {
                                onDeleteTransaction(trx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="লেনদেন মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
