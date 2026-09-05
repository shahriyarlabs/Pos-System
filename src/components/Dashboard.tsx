import React, { useState } from 'react';
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
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [trxFilter, setTrxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // 1. Audit Calculation Result
  const audit = auditAllCalculations(settings, transactions, mfsAccounts, customers, inventory);

  // Filter transactions based on selected period
  const now = new Date();
  const filteredTransactions = transactions.filter((t) => {
    if (period === 'all') return true;
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

  // Calculate Period-specific Income and Expense
  const periodIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const periodExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const periodNetProfit = periodIncome - periodExpense;

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
                { id: 'today', label: 'আজ' },
                { id: 'yesterday', label: 'গতকাল' },
                { id: 'week', label: '৭ দিন' },
                { id: 'month', label: 'চলতি মাস' },
                { id: 'all', label: 'সব' },
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
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    কোনো লেনদেন পাওয়া যায়নি। নতুন ভাউচার তৈরি করতে উপরের বাটনে ক্লিক করুন।
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
