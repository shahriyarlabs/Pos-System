import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileSpreadsheet,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  Plus,
  Search,
} from 'lucide-react';
import { Customer, InventoryItem, MFSAccount, Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  customers: Customer[];
  inventory: InventoryItem[];
  mfsAccounts: MFSAccount[];
  onOpenNewTransaction: () => void;
  onOpenReceipt: (transaction: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  customers,
  inventory,
  mfsAccounts,
  onOpenNewTransaction,
  onOpenReceipt,
  onNavigateToTab,
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [trxFilter, setTrxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // Filter transactions based on selected period
  const now = new Date();
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.timestamp);
    if (period === 'today') {
      return (
        tDate.getDate() === now.getDate() &&
        tDate.getMonth() === now.getMonth() &&
        tDate.getFullYear() === now.getFullYear()
      );
    } else if (period === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return (
        tDate.getDate() === yesterday.getDate() &&
        tDate.getMonth() === yesterday.getMonth() &&
        tDate.getFullYear() === yesterday.getFullYear()
      );
    } else if (period === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return tDate >= sevenDaysAgo;
    } else {
      // Month
      return (
        tDate.getMonth() === now.getMonth() &&
        tDate.getFullYear() === now.getFullYear()
      );
    }
  });

  // Calculate Key Metrics
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Cash in Hand calculation (Cash income minus Cash expenses from all time or today)
  const cashIncome = transactions
    .filter((t) => t.type === 'INCOME' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashExpense = transactions
    .filter((t) => t.type === 'EXPENSE' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashInHand = Math.max(0, 15000 + cashIncome - cashExpense); // Assuming base float 15,000

  // Pending Customer Dues
  const totalPendingDues = customers.reduce((sum, c) => sum + c.currentDue, 0);

  // Category breakdown for Income
  const serviceRevenueMap: { [key: string]: { labelBn: string; labelEn: string; total: number; count: number } } = {};
  filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .forEach((t) => {
      if (!serviceRevenueMap[t.category]) {
        serviceRevenueMap[t.category] = {
          labelBn: t.categoryLabelBn,
          labelEn: t.categoryLabelEn,
          total: 0,
          count: 0,
        };
      }
      serviceRevenueMap[t.category].total += t.amount;
      serviceRevenueMap[t.category].count += 1;
    });

  const sortedServices = Object.values(serviceRevenueMap).sort((a, b) => b.total - a.total);

  // Low stock items
  const lowStockItems = inventory.filter((item) => item.stockQuantity <= item.lowStockThreshold);

  // Filtered list for the transactions table
  const displayedTransactions = filteredTransactions.filter((t) => {
    if (trxFilter !== 'ALL' && t.type !== trxFilter) return false;
    if (trxSearchQuery.trim()) {
      const q = trxSearchQuery.toLowerCase();
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

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Period Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              দোকানের সার্বিক চিত্র (Overview & Financial Summary)
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              লাইভ ডাটা
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            আজকের আয়, ব্যয়, নিট লাভ ও কাস্টমার বকেয়া খতিয়ান
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(
            [
              { id: 'today', label: 'আজ (Today)' },
              { id: 'yesterday', label: 'গতকাল (Yesterday)' },
              { id: 'week', label: 'বিগত ৭ দিন' },
              { id: 'month', label: 'চলতি মাস' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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

      {/* 5 Core Metrics Cards as strictly requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Income */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট আয় (Income)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              ৳ {totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700/80 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {filteredTransactions.filter((t) => t.type === 'INCOME').length} টি সফল সেবা বিক্রয়
            </span>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট খরচ (Expenses)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              ৳ {totalExpense.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700/80 font-medium flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>দোকান ভাড়া, কালি, কাগজ ও অন্যান্য খরচ</span>
          </div>
        </div>

        {/* 3. Net Profit */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">নিট লাভ (Net Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
              }`}
            >
              ৳ {netProfit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>লাভের মার্জিন:</span>
            <span className="font-bold text-blue-700">
              {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* 4. Cash-in-Hand Balance */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs hover:shadow-sm transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">হাতে নগদ (Cash in Hand)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              ৳ {cashInHand.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800/80 font-medium">
            দোকানের ক্যাশ ড্রয়ারে মজুদ টাকা
          </div>
        </div>

        {/* 5. Total Pending Customer Dues */}
        <div
          onClick={() => onNavigateToTab('due-ledger')}
          className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs hover:shadow-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">রানিং বকেয়া (Due Ledger)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-600 tracking-tight">
              ৳ {totalPendingDues.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-700 font-medium flex items-center justify-between">
            <span>{customers.filter((c) => c.currentDue > 0).length} জন কাস্টমার</span>
            <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition inline-flex items-center">
              খতিয়ান দেখুন &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Action Alert Bar (Low Stock & Dues) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Warning Alert */}
        {lowStockItems.length > 0 ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  স্টক সতর্কতা: {lowStockItems.length}টি পণ্যের স্টক শেষ পর্যায়ে!
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {lowStockItems.map((i) => i.nameBn).slice(0, 2).join(', ')}
                  {lowStockItems.length > 2 && ` এবং আরও ${lowStockItems.length - 2}টি`} পণ্য দ্রুত রিস্টক করুন।
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg shrink-0 shadow-xs transition"
            >
              স্টক দেখুন
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">স্টক পর্যাপ্ত আছে</h4>
              <p className="text-xs text-emerald-700">
                কাগজ, কালি ও স্টেশনারি সব পণ্যের স্টক নিরাপদ সীমার মধ্যে আছে।
              </p>
            </div>
          </div>
        )}

        {/* Mobile Financial Services Quick Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <span className="w-8 h-8 rounded-full bg-[#E2136E] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                বিকাশ
              </span>
              <span className="w-8 h-8 rounded-full bg-[#F7941D] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                নগদ
              </span>
              <span className="w-8 h-8 rounded-full bg-[#8C3494] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                রকেট
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                এমএফএস ওয়ালেট ব্যালেন্স (MFS Agent Wallets)
              </h4>
              <p className="text-xs text-slate-500">
                মোট ব্যালেন্স: ৳ {mfsAccounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('mfs-ledger')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition"
          >
            ক্যাশ-ইন / আউট
          </button>
        </div>
      </div>

      {/* Breakdown: Top Revenue Services & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Revenue Distribution (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>সেবাভিত্তিক আয়ের অনুপাত (Service Revenue Breakdown)</span>
              </h3>
              <p className="text-xs text-slate-400">সর্বাধিক আয় হওয়া ডিজিটাল সেবাসমূহ</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              মোট: ৳ {totalIncome.toLocaleString()}
            </span>
          </div>

          {sortedServices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              এই সময়কালে কোনো আয়ের লেনদেন পাওয়া যায়নি।
            </p>
          ) : (
            <div className="space-y-3.5">
              {sortedServices.map((srv, idx) => {
                const percentage = totalIncome > 0 ? (srv.total / totalIncome) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {srv.labelBn}
                        <span className="text-[10px] text-slate-400 font-normal">({srv.count}টি কাজ)</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        ৳ {srv.total.toLocaleString()}{' '}
                        <span className="text-slate-400 text-[10px]">({percentage.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Channels Distribution (1 Column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">পেমেন্ট চ্যানেল (Payment Modes)</h3>
              <span className="text-[11px] text-slate-400">সংগ্রহের মাধ্যম</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'CASH',
                  label: 'নগদ ক্যাশ (Cash)',
                  color: 'bg-emerald-500',
                  textColor: 'text-emerald-700',
                  bgLight: 'bg-emerald-50',
                },
                {
                  id: 'BKASH',
                  label: 'বিকাশ (bKash)',
                  color: 'bg-[#E2136E]',
                  textColor: 'text-[#E2136E]',
                  bgLight: 'bg-pink-50',
                },
                {
                  id: 'NAGAD',
                  label: 'নগদ (Nagad)',
                  color: 'bg-[#F7941D]',
                  textColor: 'text-[#F7941D]',
                  bgLight: 'bg-amber-50',
                },
                {
                  id: 'ROCKET',
                  label: 'রকেট (Rocket)',
                  color: 'bg-[#8C3494]',
                  textColor: 'text-[#8C3494]',
                  bgLight: 'bg-purple-50',
                },
                {
                  id: 'DUE',
                  label: 'বকেয়া / বাকি (Credit)',
                  color: 'bg-rose-500',
                  textColor: 'text-rose-700',
                  bgLight: 'bg-rose-50',
                },
              ].map((channel) => {
                const channelTotal = filteredTransactions
                  .filter((t) => t.type === 'INCOME' && t.paymentMethod === channel.id)
                  .reduce((sum, t) => sum + t.amount, 0);
                const count = filteredTransactions.filter(
                  (t) => t.type === 'INCOME' && t.paymentMethod === channel.id
                ).length;

                return (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-100 ${channel.bgLight}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{channel.label}</p>
                        <p className="text-[10px] text-slate-500">{count} টি রসিদ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${channel.textColor}`}>
                        ৳ {channelTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={onOpenNewTransaction}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>দ্রুত নতুন হিসাব এন্ট্রি করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions List with Receipt Printing option */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>সাম্প্রতিক লেনদেনের তালিকা (Recent Transactions)</span>
            </h3>
            <p className="text-xs text-slate-400">
              সর্বশেষ এন্ট্রি এবং গ্রাহক ক্যাশ মেমো
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={trxSearchQuery}
                onChange={(e) => setTrxSearchQuery(e.target.value)}
                placeholder="চালান নং বা কাস্টমার খুঁজুন..."
                className="pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 text-xs w-44 sm:w-56 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTrxFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  trxFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                সকল ({filteredTransactions.length})
              </button>
              <button
                onClick={() => setTrxFilter('INCOME')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  trxFilter === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                আয় ({filteredTransactions.filter((t) => t.type === 'INCOME').length})
              </button>
              <button
                onClick={() => setTrxFilter('EXPENSE')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  trxFilter === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                ব্যয় ({filteredTransactions.filter((t) => t.type === 'EXPENSE').length})
              </button>
            </div>
          </div>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">কোনো লেনদেন রেকর্ড নেই।</p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
            >
              + এখনই নতুন হিসাব যুক্ত করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">সময় ও চালান নং</th>
                  <th className="py-3 px-3">সেবা / খরচের ধরন</th>
                  <th className="py-3 px-3">গ্রাহক / বিবরণ</th>
                  <th className="py-3 px-3">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-3 text-right">টাকা (Amount)</th>
                  <th className="py-3 px-3 text-center">মেমো / রসিদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTransactions.map((trx) => {
                  const isIncome = trx.type === 'INCOME';
                  const dateObj = new Date(trx.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString('bn-BD', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-600 font-semibold">{trx.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400">{timeFormatted}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{trx.categoryLabelBn}</div>
                        <div className="text-[10px] text-slate-400">{trx.categoryLabelEn}</div>
                      </td>
                      <td className="py-3 px-3">
                        {trx.customerName ? (
                          <div>
                            <div className="font-semibold text-slate-700">{trx.customerName}</div>
                            {trx.customerPhone && (
                              <div className="text-[10px] text-slate-400">{trx.customerPhone}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">{trx.note || '—'}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            trx.paymentMethod === 'DUE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : trx.paymentMethod === 'BKASH'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : trx.paymentMethod === 'NAGAD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : trx.paymentMethod === 'ROCKET'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {trx.paymentMethodLabelBn}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-sm font-black ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'} ৳ {trx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isIncome && (
                          <button
                            onClick={() => onOpenReceipt(trx)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2 py-1 rounded-md border border-slate-200 text-[11px] font-medium transition"
                            title="কাস্টমার ক্যাশ মেমো প্রিন্ট করুন"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>রসিদ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
