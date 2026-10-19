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
  Sliders,
  Coins,
  X,
  Landmark,
} from 'lucide-react';
import { Customer, InventoryItem, MFSAccount, ShopSettings, Transaction } from '../types';
import {
  auditAllCalculations,
  formatTaka,
  isOwnerDepositTrx,
  isOwnerDrawingTrx,
} from '../lib/calculations';

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
  onOwnerCashWithdrawal?: (amount: number, note?: string) => Promise<void> | void;
  onOwnerCashDeposit?: (amount: number, note?: string) => Promise<void> | void;
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
  onOwnerCashWithdrawal,
  onOwnerCashDeposit,
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [trxFilter, setTrxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // Owner drawer cash modal states (টাকা যুক্ত / টাকা উত্তোলন)
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [drawerCashAmount, setDrawerCashAmount] = useState('');
  const [drawerCashNote, setDrawerCashNote] = useState('');
  const [isSubmittingDrawerCash, setIsSubmittingDrawerCash] = useState(false);

  const openDrawerModal = (mode: 'DEPOSIT' | 'WITHDRAW') => {
    setDrawerMode(mode);
    setDrawerCashAmount('');
    setDrawerCashNote('');
    setIsDrawerModalOpen(true);
  };

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
  // রুল: মালিক টাকা উত্তোলন করুক বা যুক্ত করুক এটা সাধারণ বিক্রয় আয় নয়—এটা মূলধন বৃদ্ধি বা হ্রাস করে।
  // মূলধনের চেয়ে বেশি উত্তোলন করলে তা নিট লাভ/আয় হ্রাস করে। উত্তোলনকৃত টাকাও ড্রয়ারের খরচ।
  const {
    periodIncome,
    periodExpense,
    periodNetProfit,
    periodCapitalDeposits,
    periodOwnerDrawings,
    periodExcessDrawings,
  } = useMemo(() => {
    let salesIncome = 0;
    let operatingExpense = 0;
    let capitalDeposits = 0;
    let ownerDrawings = 0;

    for (let i = 0; i < filteredTransactions.length; i++) {
      const t = filteredTransactions[i];
      const isDraw = isOwnerDrawingTrx(t);
      const isDep = !isDraw && isOwnerDepositTrx(t);

      if (isDraw) {
        ownerDrawings += t.amount;
      } else if (isDep) {
        capitalDeposits += t.amount;
      } else if (t.type === 'INCOME') {
        salesIncome += t.amount;
      } else if (t.type === 'EXPENSE') {
        operatingExpense += t.amount; // ক্রয়মূল্য ও দোকান খরচ
      }
    }

    // সর্বমোট মূলধন ও ড্রয়িং হিসাব:
    const initialCap = Number(settings?.openingCashBalance || 0);
    let allTimeCap = initialCap;
    let allTimeDraw = 0;
    for (const trx of transactions) {
      if (isOwnerDrawingTrx(trx)) {
        allTimeDraw += trx.amount;
      } else if (isOwnerDepositTrx(trx)) {
        allTimeCap += trx.amount;
      }
    }
    const excessDrawings = Math.max(0, allTimeDraw - allTimeCap);

    // সহজ লাভ: বিক্রয়মূল্য - ক্রয়মূল্য ও দোকান খরচ
    const opProfit = salesIncome - operatingExpense;
    // যদি মূলধনের অতিরিক্ত উত্তোলন থাকে, তবে তা আয়/লাভ হ্রাস করে:
    const finalProfit = excessDrawings > 0 ? Math.max(0, opProfit - excessDrawings) : opProfit;

    return {
      periodIncome: salesIncome,
      periodExpense: operatingExpense + ownerDrawings, // উত্তোলনকৃত টাকাও ড্রয়ারের খরচ
      periodNetProfit: finalProfit,
      periodCapitalDeposits: capitalDeposits,
      periodOwnerDrawings: ownerDrawings,
      periodExcessDrawings: excessDrawings,
    };
  }, [filteredTransactions, transactions, settings]);

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

          <button
            type="button"
            onClick={() => openDrawerModal('DEPOSIT')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="মালিক যখন ক্যাশ ড্রয়ারে টাকা যুক্ত করবেন তখন শুধু ড্রয়ারের নগদ ক্যাশ বাড়বে"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>ড্রয়ারে টাকা যুক্ত</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawerModal('WITHDRAW')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border border-amber-600 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            title="মালিক যখন ক্যাশ ড্রয়ার থেকে টাকা নিবেন তখন শুধু ড্রয়ারের নগদ ক্যাশ কমবে"
          >
            <Coins className="w-4 h-4 text-white" />
            <span>ড্রয়ার থেকে উত্তোলন</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="দোকানের লোগো, ভাউচার স্বাক্ষর ও প্রিন্টার সেটিংস"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>সেটিংস ও ভাউচার</span>
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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openDrawerModal('DEPOSIT')}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                title="ড্রয়ারে ক্যাশ টাকা যুক্ত করুন (শুধু ড্রয়ার ক্যাশ বাড়বে)"
              >
                <Plus className="w-3 h-3" />
                <span>টাকা যুক্ত</span>
              </button>
              <button
                type="button"
                onClick={() => openDrawerModal('WITHDRAW')}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                title="মালিক যখন ক্যাশ ড্রয়ার থেকে টাকা নিবেন তখন শুধু ড্রয়ারের নগদ ক্যাশ কমবে"
              >
                <Coins className="w-3 h-3" />
                <span>উত্তোলন</span>
              </button>
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatTaka(audit.netCashInHand)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between flex-wrap gap-1">
              <span>প্রারম্ভিক: {formatTaka(audit.openingCash)}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openDrawerModal('DEPOSIT')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  +টাকা যুক্ত
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => openDrawerModal('WITHDRAW')}
                  className="text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  -উত্তোলন
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={onOpenCalculationAudit}
                  className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  সূত্র <HelpCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Total Income Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              {period === 'today' ? 'আজকের মোট বিক্রয়মূল্য (আয়)' : 'নির্বাচিত মেয়াদের মোট বিক্রয়'}
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
              <span>
                {periodCapitalDeposits > 0
                  ? `বিক্রি: ${formatTaka(periodIncome)} • মূলধন জমা: +${formatTaka(periodCapitalDeposits)} (আয় নয়)`
                  : 'মালিকের জমা বাদে সকল সেবা ও পণ্যের বিক্রয়মূল্য'}
              </span>
              <span className="text-emerald-700 font-semibold">{filteredTransactions.filter((t) => t.type === 'INCOME' && !isOwnerDepositTrx(t)).length} টি ভাউচার</span>
            </div>
          </div>
        </div>

        {/* 3. Total Expense / Purchase Cost Card */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-5 rounded-2xl border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              {period === 'today' ? 'মোট ক্রয়মূল্য ও দোকান খরচ' : 'নির্বাচিত মেয়াদের খরচ'}
            </span>
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {formatTaka(periodExpense - periodOwnerDrawings)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>
                {periodOwnerDrawings > 0
                  ? `ক্রয়/খরচ: ${formatTaka(periodExpense - periodOwnerDrawings)} • মালিকের ড্রয়িং: ${formatTaka(periodOwnerDrawings)} (আলাদা)`
                  : 'মালিকের উত্তোলন বাদে ক্রয়মূল্য, ভাড়া, বিদ্যুৎ ও মালামাল'}
              </span>
              <span className="text-rose-700 font-semibold">{filteredTransactions.filter((t) => t.type === 'EXPENSE' && !isOwnerDrawingTrx(t)).length} টি খরচ</span>
            </div>
          </div>
        </div>

        {/* 4. Simple Net Profit Card */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white p-5 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              সহজ নিট লাভ (বিক্রি - ক্রয়/খরচ)
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
              {periodExcessDrawings > 0 ? (
                <span className="text-purple-700 font-semibold">
                  মূলধনের অতিরিক্ত ৳{periodExcessDrawings} উত্তোলন লাভ থেকে সমন্বিত
                </span>
              ) : periodNetProfit >= 0 ? (
                'বিক্রয়মূল্য - ক্রয়মূল্য/খরচ + কমিশন = সহজ লাভ'
              ) : (
                'খরচ বেশি হয়েছে'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY STATUS PILLARS: Customer Dues, Owner Capital, MFS, and Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Customer Due Ledger Banner */}
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

        {/* 2. Owner Capital & Equity Ledger Banner */}
        <div
          onClick={() => onNavigateToTab('owner-ledger')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">মালিকের মূলধন খতিয়ান</div>
              <div className="text-xl font-extrabold text-indigo-700">{formatTaka(audit.netOwnerCapitalRemaining)}</div>
              <div className="text-[11px] text-slate-500">
                মূলধন: {formatTaka(audit.totalOwnerCapitalInvested)} • উত্তোলন: {formatTaka(audit.totalOwnerDrawings)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <ChevronRight className="w-5 h-5 text-indigo-500" />
            {audit.excessDrawingsFromIncome > 0 && (
              <span className="text-[9px] text-rose-600 font-bold">
                আয় হ্রাস: -{formatTaka(audit.excessDrawingsFromIncome)}
              </span>
            )}
          </div>
        </div>

        {/* 3. MFS Balances Banner */}
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

        {/* 4. Inventory Valuation Banner */}
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
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {trx.category === 'owner_drawing' && (
                          <span className="p-1 rounded bg-amber-100 text-amber-800">
                            <Coins className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {trx.category === 'owner_deposit' && (
                          <span className="p-1 rounded bg-emerald-100 text-emerald-800">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span>{trx.categoryLabelBn}</span>
                      </div>
                      {trx.note && <div className="text-[11px] text-slate-500">{trx.note}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {isOwnerDrawingTrx(trx) ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          মালিকের উত্তোলন • মূলধন হ্রাস
                        </span>
                      ) : isOwnerDepositTrx(trx) ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          মালিকের মূলধন জমা (+মূলধন)
                        </span>
                      ) : trx.customerName ? (
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
                          isOwnerDrawingTrx(trx)
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : isOwnerDepositTrx(trx)
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            : trx.paymentMethod === 'CASH'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : trx.paymentMethod === 'DUE'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {isOwnerDrawingTrx(trx)
                          ? 'ক্যাশ ড্রয়ার (উত্তোলন)'
                          : isOwnerDepositTrx(trx)
                          ? 'ক্যাশ ড্রয়ার (টাকা যুক্ত)'
                          : (trx.paymentMethodLabelBn || trx.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black text-sm ${
                          isOwnerDrawingTrx(trx)
                            ? 'text-amber-800'
                            : isOwnerDepositTrx(trx)
                            ? 'text-emerald-700 font-black'
                            : trx.type === 'INCOME'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isOwnerDrawingTrx(trx) ? '-' : isOwnerDepositTrx(trx) ? '+' : trx.type === 'INCOME' ? '+' : '-'}
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

      {/* Dedicated Owner Cash Drawer Modal (টাকা যুক্ত / টাকা উত্তোলন) */}
      {isDrawerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all">
            {/* Mode Tab Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setDrawerMode('DEPOSIT');
                  setDrawerCashAmount('');
                  setDrawerCashNote('');
                }}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerMode === 'DEPOSIT'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>টাকা যুক্ত করুন (জমা)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerMode('WITHDRAW');
                  setDrawerCashAmount('');
                  setDrawerCashNote('');
                }}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerMode === 'WITHDRAW'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>টাকা উত্তোলন (খরচ)</span>
              </button>
            </div>

            {/* Header */}
            <div
              className={`text-white px-6 py-4 flex items-center justify-between transition-colors ${
                drawerMode === 'DEPOSIT'
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  {drawerMode === 'DEPOSIT' ? (
                    <Plus className="w-5 h-5 text-white" />
                  ) : (
                    <Coins className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {drawerMode === 'DEPOSIT'
                      ? 'ড্রয়ারে নগদ টাকা যুক্ত করুন'
                      : 'ড্রয়ার থেকে টাকা উত্তোলন'}
                  </h3>
                  <p className="text-xs text-white/80">
                    {drawerMode === 'DEPOSIT'
                      ? 'মালিকের ক্যাশ জমা • শুধু ড্রয়ারের নগদ টাকা বাড়বে'
                      : 'মালিকের ক্যাশ উত্তোলন • শুধু ড্রয়ারের নগদ ক্যাশ কমবে'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const amt = Number(drawerCashAmount);
                if (!amt || amt <= 0) {
                  alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন');
                  return;
                }

                if (drawerMode === 'WITHDRAW' && amt > audit.netCashInHand) {
                  if (
                    !confirm(
                      `উত্তোলনের পরিমাণ (৳${amt}) ড্রয়ারে থাকা মোট ক্যাশ (৳${audit.netCashInHand}) এর চেয়ে বেশি। আপনি কি নিশ্চিত যে ড্রয়ার থেকে টাকা নিয়েছেন?`
                    )
                  ) {
                    return;
                  }
                }

                setIsSubmittingDrawerCash(true);
                try {
                  if (drawerMode === 'DEPOSIT') {
                    if (onOwnerCashDeposit) {
                      await onOwnerCashDeposit(
                        amt,
                        drawerCashNote.trim() || 'মালিকের ড্রয়ারে ক্যাশ টাকা যুক্ত'
                      );
                    }
                  } else {
                    if (onOwnerCashWithdrawal) {
                      await onOwnerCashWithdrawal(
                        amt,
                        drawerCashNote.trim() || 'মালিকের ড্রয়ার থেকে ক্যাশ উত্তোলন'
                      );
                    }
                  }
                  setIsDrawerModalOpen(false);
                  setDrawerCashAmount('');
                  setDrawerCashNote('');
                } finally {
                  setIsSubmittingDrawerCash(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {/* Current Drawer Cash Status & Projected Balance */}
              <div
                className={`border rounded-2xl p-4 flex items-center justify-between ${
                  drawerMode === 'DEPOSIT'
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      drawerMode === 'DEPOSIT' ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    ড্রয়ারে বর্তমান ক্যাশ টাকা:
                  </span>
                  <span
                    className={`text-2xl font-black ${
                      drawerMode === 'DEPOSIT' ? 'text-emerald-950' : 'text-amber-950'
                    }`}
                  >
                    {formatTaka(audit.netCashInHand)}
                  </span>
                  {drawerCashAmount && Number(drawerCashAmount) > 0 && (
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      {drawerMode === 'DEPOSIT' ? 'যুক্ত করার পর হবে: ' : 'উত্তোলনের পর থাকবে: '}
                      <strong
                        className={
                          drawerMode === 'DEPOSIT' ? 'text-emerald-700' : 'text-amber-800'
                        }
                      >
                        {formatTaka(
                          drawerMode === 'DEPOSIT'
                            ? audit.netCashInHand + Number(drawerCashAmount)
                            : audit.netCashInHand - Number(drawerCashAmount)
                        )}
                      </strong>
                    </div>
                  )}
                </div>
                <div
                  className={`p-2.5 text-white rounded-xl shadow-xs ${
                    drawerMode === 'DEPOSIT' ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                >
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {drawerMode === 'DEPOSIT'
                      ? 'টাকা যুক্তের পরিমাণ (৳) *'
                      : 'উত্তোলনের পরিমাণ (৳) *'}
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(drawerMode === 'DEPOSIT'
                      ? [500, 1000, 2000, 5000, 10000, 20000]
                      : [200, 500, 1000, 2000, 5000]
                    ).map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => {
                          const cur = Number(drawerCashAmount) || 0;
                          setDrawerCashAmount(String(cur + val));
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer ${
                          drawerMode === 'DEPOSIT'
                            ? 'bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900'
                            : 'bg-amber-100/80 hover:bg-amber-200 text-amber-900'
                        }`}
                      >
                        +৳{val >= 1000 ? `${val / 1000}k` : val}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={drawerCashAmount}
                    onChange={(e) => setDrawerCashAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-3 border rounded-2xl text-xl font-black text-slate-900 bg-white outline-hidden transition ${
                      drawerMode === 'DEPOSIT'
                        ? 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {drawerMode === 'DEPOSIT' ? 'টাকা যুক্ত করার কারণ / নোট' : 'উত্তোলনের কারণ / নোট'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(drawerMode === 'DEPOSIT'
                    ? [
                        'দোকানের চলতি ক্যাশ বৃদ্ধি',
                        'নতুন মালামাল কেনার ক্যাশ',
                        'মালিকের মূলধন জমা',
                        'জরুরি ক্যাশ ঘাটতি পূরণ',
                      ]
                    : [
                        'ব্যক্তিগত প্রয়োজন',
                        'বাজার ও ঘরের খরচ',
                        'মালিকের লভ্যাংশ',
                        'জরুরি ক্যাশ খরচ',
                      ]
                  ).map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setDrawerCashNote(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        drawerCashNote === preset
                          ? drawerMode === 'DEPOSIT'
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={drawerCashNote}
                  onChange={(e) => setDrawerCashNote(e.target.value)}
                  placeholder={
                    drawerMode === 'DEPOSIT'
                      ? 'উদাঃ নতুন মালামাল ক্রয়ের ক্যাশ বা চলতি মূলধন জমা...'
                      : 'উদাঃ ব্যক্তিগত বাজার খরচ বা জরুরি প্রয়োজন...'
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                />
              </div>

              {/* Rules & Guarantee Banner */}
              <div
                className={`border rounded-2xl p-3.5 text-xs space-y-1 ${
                  drawerMode === 'DEPOSIT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div
                  className={`font-bold flex items-center gap-1.5 ${
                    drawerMode === 'DEPOSIT' ? 'text-emerald-900' : 'text-amber-900'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      drawerMode === 'DEPOSIT' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  <span>
                    {drawerMode === 'DEPOSIT'
                      ? 'শুধুমাত্র ক্যাশ ড্রয়ারে টাকা বাড়বে (MFS দরকার নেই)'
                      : 'শুধুমাত্র ক্যাশ ড্রয়ার কমবে (MFS দরকার নেই)'}
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed ${
                    drawerMode === 'DEPOSIT' ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  ✓ ড্রয়ারে এই লেনদেন করলে{' '}
                  <strong>
                    {drawerMode === 'DEPOSIT'
                      ? 'শুধুমাত্র ক্যাশ ড্রয়ারের নগদ টাকা বাড়বে'
                      : 'শুধুমাত্র ক্যাশ ড্রয়ারের নগদ টাকা কমবে'}
                  </strong>
                  ।
                  <br />
                  ✓ <strong>হিসাব নীতি:</strong> এটি বিক্রয় আয় নয়, এটি মালিকের মূলধন পরিবর্তন করে। উত্তোলনকৃত টাকাও ড্রয়ারের নগদ খরচ। মূলধনের অতিরিক্ত উত্তোলন ব্যবসায়ের আয় হ্রাস করে।
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 mt-1">
                  <span className="text-[10px] text-slate-600">
                    বর্তমান অবশিষ্ট মূলধন: <strong>{formatTaka(audit.netOwnerCapitalRemaining)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerModalOpen(false);
                      onNavigateToTab('owner-ledger');
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Landmark className="w-3 h-3" />
                    <span>মালিকের পূর্ণাঙ্গ খতিয়ান খুলুন ➜</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDrawerCash}
                  className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    drawerMode === 'DEPOSIT'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  }`}
                >
                  {drawerMode === 'DEPOSIT' ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <Coins className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmittingDrawerCash
                      ? 'সংরক্ষণ হচ্ছে...'
                      : drawerMode === 'DEPOSIT'
                      ? `টাকা যুক্ত নিশ্চিত করুন ${drawerCashAmount ? `(৳${drawerCashAmount})` : ''}`
                      : `উত্তোলন নিশ্চিত করুন ${drawerCashAmount ? `(৳${drawerCashAmount})` : ''}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
