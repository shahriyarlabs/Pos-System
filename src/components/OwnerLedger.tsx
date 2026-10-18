import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Printer,
  Download,
  Search,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  X,
  Clock,
  User,
} from 'lucide-react';
import { ShopSettings, Transaction } from '../types';
import {
  formatTaka,
  getOwnerLedgerData,
  isToday,
  isOwnerDepositTrx,
  isOwnerDrawingTrx,
} from '../lib/calculations';

interface OwnerLedgerProps {
  transactions: Transaction[];
  settings: ShopSettings;
  onOwnerCashWithdrawal: (amount: number, note?: string) => Promise<void> | void;
  onOwnerCashDeposit: (amount: number, note?: string) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onOpenReceipt?: (trx: Transaction) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const OwnerLedger: React.FC<OwnerLedgerProps> = ({
  transactions,
  settings,
  onOwnerCashWithdrawal,
  onOwnerCashDeposit,
  onDeleteTransaction,
  onOpenReceipt,
  onNavigateToTab,
}) => {
  // Modal states for quick actions
  const [modalMode, setModalMode] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute ledger data with progressive running capital balance
  const ledgerData = useMemo(() => {
    return getOwnerLedgerData(settings, transactions);
  }, [settings, transactions]);

  const {
    items,
    initialCapital,
    totalDeposited,
    totalWithdrawn,
    netCapitalRemaining,
    excessWithdrawn,
    todayDeposited,
    todayWithdrawn,
  } = ledgerData;

  const totalCapitalInvested = initialCapital + totalDeposited;

  // Filter items
  const filteredItems = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return items.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // Period filter
      if (periodFilter === 'TODAY' && !isToday(item.timestamp)) return false;
      if (periodFilter === 'THIS_MONTH') {
        const d = new Date(item.timestamp);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const noteMatch = (item.note || '').toLowerCase().includes(q);
        const invMatch = (item.invoiceNo || '').toLowerCase().includes(q);
        const amountMatch = item.amount.toString().includes(q);
        if (!noteMatch && !invMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [items, periodFilter, typeFilter, searchQuery]);

  // Handle Form Submit for Adding Capital or Withdrawing
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'DEPOSIT') {
        await onOwnerCashDeposit(
          num,
          noteInput.trim() || 'মালিকের মূলধন ক্যাশ জমা / ড্রয়ারে টাকা যুক্ত'
        );
      } else if (modalMode === 'WITHDRAW') {
        await onOwnerCashWithdrawal(
          num,
          noteInput.trim() || 'মালিকের ব্যক্তিগত উত্তোলন (ক্যাশ ড্রয়ার)'
        );
      }
      setModalMode(null);
      setAmountInput('');
      setNoteInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset Amounts
  const presets = [500, 1000, 2000, 5000, 10000];

  // Export to CSV
  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      'তারিখ ও সময়',
      'ইনভয়েস নং',
      'ধরন',
      'বিবরণ / নোট',
      'জমা (টাকা যুক্ত)',
      'উত্তোলন (টাকা গ্রহণ)',
      'অবশিষ্ট মূলধন ব্যালেন্স',
      'আয়ের ওপর প্রভাব',
    ];

    const rows = items.map((it) => [
      `"${new Date(it.timestamp).toLocaleString('bn-BD')}"`,
      `"${it.invoiceNo || ''}"`,
      `"${it.type === 'DEPOSIT' ? 'মূলধন জমা' : 'মালিকের উত্তোলন'}"`,
      `"${it.note.replace(/"/g, '""')}"`,
      it.type === 'DEPOSIT' ? it.amount : 0,
      it.type === 'WITHDRAWAL' ? it.amount : 0,
      it.runningCapitalBalance,
      `"${it.isExcessDrawing ? `মূলধনের অতিরিক্ত ৳${it.excessAmount} (আয় হ্রাস)` : 'মূলধনে সমন্বিত'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Owner_Ledger_${settings.shopName || 'Shop'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Landmark className="w-56 h-56 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                মালিকের ব্যক্তিগত ইকুইটি ও ড্রয়িং খাতা
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[11px]">
                {settings.ownerName ? `স্বত্বাধিকারী: ${settings.ownerName}` : 'মালিকের খতিয়ান'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              মালিকের মূলধন ও উত্তোলন খতিয়ান
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              মালিক টাকা যুক্ত করলে মূলধন বৃদ্ধি পায় এবং উত্তোলন করলে মূলধন কমে। মূলধনের বেশি উত্তোলন করলে তা ব্যবসার অর্জিত আয় হ্রাস করে। উত্তোলনকৃত টাকাও ড্রয়ারের নগদ খরচ।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setModalMode('DEPOSIT');
                setAmountInput('');
                setNoteInput('');
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ মূলধন / টাকা যুক্ত</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMode('WITHDRAW');
                setAmountInput('');
                setNoteInput('');
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>- মালিকের উত্তোলন</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={items.length === 0}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="এক্সেল বা সিএসভি ডাউনলোড"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CSV ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="খতিয়ান প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Capital Invested */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              মোট বিনিয়োগকৃত মূলধন
            </span>
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {formatTaka(totalCapitalInvested)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
              <div>প্রারম্ভিক মূলধন: {formatTaka(initialCapital)}</div>
              <div>পরবর্তীতে টাকা যুক্ত: +{formatTaka(totalDeposited)}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Owner Drawings */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              সর্বমোট মালিকের উত্তোলন
            </span>
            <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
              {formatTaka(totalWithdrawn)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
              <span>ক্যাশ ড্রয়ার থেকে খরচ/গৃহীত</span>
              <span className="font-semibold text-amber-800">
                {items.filter((i) => i.type === 'WITHDRAWAL').length} বার উত্তোলন
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Capital Balance */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
          netCapitalRemaining > 0
            ? 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white border-blue-200'
            : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              বর্তমান অবশিষ্ট মূলধন স্থিতি
            </span>
            <div className={`p-2 rounded-xl text-white shadow-xs ${
              netCapitalRemaining > 0 ? 'bg-blue-600' : 'bg-rose-600'
            }`}>
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              netCapitalRemaining > 0 ? 'text-blue-700' : 'text-rose-700'
            }`}>
              {formatTaka(netCapitalRemaining)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {netCapitalRemaining > 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> মূলধন অক্ষুণ্ণ রয়েছে
                </span>
              ) : (
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> মূলধন পুরোপুরি উত্তোলিত!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Excess Drawings / Impact on Net Income */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
          excessWithdrawn > 0
            ? 'bg-gradient-to-br from-purple-500/15 via-rose-500/10 to-white border-purple-300'
            : 'bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              আয়ের ওপর উত্তোলন প্রভাব
            </span>
            <div className={`p-2 rounded-xl text-white shadow-xs ${
              excessWithdrawn > 0 ? 'bg-purple-600' : 'bg-slate-600'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              excessWithdrawn > 0 ? 'text-purple-800' : 'text-slate-700'
            }`}>
              {excessWithdrawn > 0 ? `-${formatTaka(excessWithdrawn)}` : '৳০ (প্রভাবমুক্ত)'}
            </div>
            <div className="text-[11px] mt-1 leading-snug">
              {excessWithdrawn > 0 ? (
                <span className="text-purple-900 font-medium">
                  মূলধনের অতিরিক্ত উত্তোলন যা ব্যবসার আয়/লাভ কমিয়েছে
                </span>
              ) : (
                <span className="text-slate-500">
                  উত্তোলন মূলধনের সীমার মধ্যে রয়েছে (আয় অপরিবর্তিত)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S SNAPSHOT BANNER ── */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">আজকের মালিকের লেনদেন:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
            জমা: +{formatTaka(todayDeposited)}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
            উত্তোলন: -{formatTaka(todayWithdrawn)}
          </span>
        </div>
        <div className="text-slate-500">
          মোট এন্ট্রি: <strong className="text-slate-900">{items.length}</strong> টি লেনদেন সংরক্ষিত
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Period Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">সময়:</span>
          {(['ALL', 'TODAY', 'THIS_MONTH'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                periodFilter === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p === 'ALL' && 'সর্বমোট'}
              {p === 'TODAY' && 'আজকের'}
              {p === 'THIS_MONTH' && 'চলতি মাস'}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {/* Type Tabs */}
          {(['ALL', 'DEPOSIT', 'WITHDRAWAL'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                typeFilter === t
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t === 'ALL' && 'সব ধরন'}
              {t === 'DEPOSIT' && 'শুধু জমা (+)'}
              {t === 'WITHDRAWAL' && 'শুধু উত্তোলন (-)'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নোট বা ইনভয়েস খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm text-slate-900">
              মালিকের বিস্তারিত হিসাব বহি (Detailed Ledger Records)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            প্রদর্শিত: <strong>{filteredItems.length}</strong> / {items.length} টি
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="font-semibold text-slate-700 text-sm">
              কোনো মালিকের লেনদেন পাওয়া যায়নি
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              মালিকের টাকা যুক্ত বা ড্রয়ার থেকে উত্তোলন করতে উপরের বাটনগুলো ব্যবহার করুন।
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setModalMode('DEPOSIT')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                + টাকা যুক্ত করুন
              </button>
              <button
                type="button"
                onClick={() => setModalMode('WITHDRAW')}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer"
              >
                - টাকা উত্তোলন করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">ধরন</th>
                  <th className="py-3 px-4">বিবরণ ও উদ্দেশ্য</th>
                  <th className="py-3 px-4 text-right">টাকা যুক্ত (+)</th>
                  <th className="py-3 px-4 text-right">উত্তোলন (-)</th>
                  <th className="py-3 px-4 text-right">মূলধন ব্যালেন্স</th>
                  <th className="py-3 px-4 text-center">আয়ের ওপর প্রভাব</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const dateObj = new Date(item.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('bn-BD', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === 'DEPOSIT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            মূলধন জমা
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <ArrowDownRight className="w-3 h-3 text-amber-700" />
                            মালিকের উত্তোলন
                          </span>
                        )}
                      </td>

                      {/* Note / Purpose */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800">{item.note}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>পেমেন্ট: {item.paymentMethod}</span>
                          {item.invoiceNo && (
                            <>
                              <span>•</span>
                              <span>ভাউচার: #{item.invoiceNo}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Deposit Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.type === 'DEPOSIT' ? (
                          <span className="font-extrabold text-emerald-600 text-sm">
                            +{formatTaka(item.amount)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Withdrawal Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.type === 'WITHDRAWAL' ? (
                          <span className="font-extrabold text-amber-800 text-sm">
                            -{formatTaka(item.amount)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Running Capital Balance */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className={`font-bold text-xs ${
                          item.runningCapitalBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                        }`}>
                          {formatTaka(Math.max(0, item.runningCapitalBalance))}
                        </div>
                        {item.runningCapitalBalance < 0 && (
                          <div className="text-[9px] text-rose-500 font-semibold">
                            ঘাটতি: {formatTaka(Math.abs(item.runningCapitalBalance))}
                          </div>
                        )}
                      </td>

                      {/* Income Impact Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.type === 'DEPOSIT' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            মূলধন বৃদ্ধি
                          </span>
                        ) : item.isExcessDrawing ? (
                          <span className="text-[10px] text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200" title={`মূলধনের থেকে অতিরিক্ত ৳${item.excessAmount} তোলা হয়েছে যা নিট মুনাফা হ্রাস করেছে`}>
                            আয় হ্রাস: -{formatTaka(item.excessAmount)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                            মূলধন থেকে কর্তন
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenReceipt && (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(item.trx)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="রসিদ বা ভাউচার দেখুন"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান?')) {
                                  setDeletingId(item.id);
                                  try {
                                    await onDeleteTransaction(item.id);
                                  } finally {
                                    setDeletingId(null);
                                  }
                                }
                              }}
                              disabled={deletingId === item.id}
                              className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                              title="লেনদেন মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ACCOUNTING STANDARD NOTICE / INSTRUCTION CARD ── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs text-xs text-amber-950 space-y-3">
        <div className="font-bold text-sm flex items-center gap-2 text-amber-950">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          <span>মালিকের লেনদেন ও হিসাববিজ্ঞানের নিয়মাবলী (Accounting Guidelines)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-emerald-800 block mb-1">
              ১. মূলধন বৃদ্ধি (টাকা যুক্ত):
            </span>
            <p className="text-slate-700">
              মালিকের ড্রয়ারে টাকা যুক্ত করা সাধারণ বিক্রয় বা সেবা আয় নয়। এটি মালিকের মূলধন বাড়িয়ে দেয় এবং ড্রয়ারের নগদ ক্যাশ বৃদ্ধি করে।
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">
              ২. মালিকের উত্তোলন ও খরচ:
            </span>
            <p className="text-slate-700">
              মালিক ড্রয়ার থেকে টাকা নিলে তা ক্যাশ ড্রয়ারের নগদ বহির্গমন (খরচ)। এটি সাধারণ দোকান পরিচালনা খরচ নয়, বরং মালিকের নিজস্ব মূলধন হ্রাস করে।
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-purple-900 block mb-1">
              ৩. মূলধনের অতিরিক্ত উত্তোলন = আয় হ্রাস:
            </span>
            <p className="text-slate-700">
              মালিক যদি বিনিয়োগকৃত মোট মূলধনের চেয়ে বেশি টাকা উত্তোলন করেন, তবে অতিরিক্ত অংশ ব্যবসায়ের অর্জিত নিট মুনাফা বা আয় থেকে কেটে নেয়া হয়।
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD CAPITAL OR RECORD DRAWING ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between ${
              modalMode === 'DEPOSIT'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700'
                : 'bg-gradient-to-r from-amber-600 to-orange-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  {modalMode === 'DEPOSIT' ? (
                    <Plus className="w-5 h-5 text-white" />
                  ) : (
                    <Coins className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {modalMode === 'DEPOSIT' ? 'মালিকের মূলধন জমা / টাকা যুক্ত' : 'মালিকের ক্যাশ উত্তোলন (ড্রয়ার)'}
                  </h3>
                  <div className="text-[11px] text-white/80 mt-0.5">
                    {modalMode === 'DEPOSIT'
                      ? 'ক্যাশ ড্রয়ার ও মূলধন বৃদ্ধি পাবে (বিক্রয় আয় নয়)'
                      : 'ক্যাশ ড্রয়ার ও মূলধন কমবে (ড্রয়ার খরচ)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
              {/* Current Capital Snapshot */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center">
                <span className="text-slate-600">বর্তমান অবশিষ্ট মূলধন:</span>
                <span className="font-black text-slate-900">{formatTaka(netCapitalRemaining)}</span>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    autoFocus
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="যেমন: 1000"
                    className="w-full pl-8 pr-3 py-2.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {presets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountInput(String(amt))}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected Capital preview */}
              {amountInput && !isNaN(parseFloat(amountInput)) && (
                <div className={`p-3 rounded-xl border text-xs ${
                  modalMode === 'DEPOSIT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : parseFloat(amountInput) > netCapitalRemaining
                    ? 'bg-purple-50 border-purple-300 text-purple-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex justify-between items-center font-bold">
                    <span>লেনদেনের পর নতুন মূলধন:</span>
                    <span>
                      {modalMode === 'DEPOSIT'
                        ? formatTaka(netCapitalRemaining + parseFloat(amountInput))
                        : formatTaka(Math.max(0, netCapitalRemaining - parseFloat(amountInput)))}
                    </span>
                  </div>
                  {modalMode === 'WITHDRAW' && parseFloat(amountInput) > netCapitalRemaining && (
                    <div className="mt-1 text-[10px] text-purple-800 font-medium">
                      ⚠️ এটি মূলধনের চেয়ে ৳{parseFloat(amountInput) - netCapitalRemaining} বেশি! এটি ব্যবসার অর্জিত নিট আয় হ্রাস করবে।
                    </div>
                  )}
                </div>
              )}

              {/* Note / Purpose input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  বিবরণ / উদ্দেশ্য (নোট)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={
                    modalMode === 'DEPOSIT'
                      ? 'যেমন: ব্যবসায় অতিরিক্ত মূলধন বিনিয়োগ'
                      : 'যেমন: ব্যক্তিগত জরুরি খরচ / বাড়ি ভাড়া'
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 ${
                    modalMode === 'DEPOSIT'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isSubmitting
                    ? 'সংরক্ষণ হচ্ছে...'
                    : modalMode === 'DEPOSIT'
                    ? 'মূলধন জমা নিশ্চিত করুন'
                    : 'উত্তোলন নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
