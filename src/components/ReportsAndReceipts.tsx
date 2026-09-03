import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Share2,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Sliders,
  Send,
} from 'lucide-react';
import { Customer, ShopSettings, Transaction } from '../types';
import {
  generateReceiptShareText,
  printReceiptNow,
} from '../lib/receiptPrinter';

interface ReportsAndReceiptsProps {
  transactions: Transaction[];
  customers: Customer[];
  activeReceiptTransaction: Transaction | null;
  onCloseReceipt: () => void;
  onSelectReceipt: (trx: Transaction) => void;
  settings: ShopSettings;
}

export const ReportsAndReceipts: React.FC<ReportsAndReceiptsProps> = ({
  transactions,
  customers,
  activeReceiptTransaction,
  onCloseReceipt,
  onSelectReceipt,
  settings,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [receiptFormat, setReceiptFormat] = useState<'standard' | 'thermal'>(
    settings.receiptType || 'standard'
  );
  const [searchReceiptQuery, setSearchReceiptQuery] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Filter based on period
  const now = new Date();
  const filtered = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    if (reportPeriod === 'daily') {
      const target = new Date(selectedDate);
      return (
        d.getDate() === target.getDate() &&
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear()
      );
    } else if (reportPeriod === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= sevenDaysAgo;
    } else {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
  });

  const totalIncome = filtered
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Print function with reliable printer utility
  const triggerPrint = () => {
    if (!activeReceiptTransaction) return;
    printReceiptNow(activeReceiptTransaction, settings, receiptFormat);
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    if (!activeReceiptTransaction) return;
    const text = generateReceiptShareText(activeReceiptTransaction, settings);
    let targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (activeReceiptTransaction.customerPhone) {
      let cleanPhone = activeReceiptTransaction.customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('01')) {
        cleanPhone = '88' + cleanPhone;
      }
      targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    }
    window.open(targetUrl, '_blank');
  };

  // Copy Receipt Text
  const handleCopyText = () => {
    if (!activeReceiptTransaction) return;
    const text = generateReceiptShareText(activeReceiptTransaction, settings);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filtered transactions for receipt list
  const receiptTransactions = transactions
    .filter((t) => t.type === 'INCOME')
    .filter((t) => {
      if (!searchReceiptQuery.trim()) return true;
      const q = searchReceiptQuery.toLowerCase();
      return (
        t.invoiceNo.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.customerPhone && t.customerPhone.includes(q)) ||
        t.categoryLabelBn.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Receipts & Report Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>রিপোর্ট ও কাস্টমার ক্যাশ মেমো (Reports & Receipts)</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              মুদ্রণ ও শেয়ার
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            দৈনিক, সাপ্তাহিক ও মাসিক লাভ-ক্ষতির সামারি এবং গ্রাহকের ডিজিটাল মানি রিসিট প্রিন্ট (A5 বা থার্মাল স্লিপ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setReportPeriod('daily')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                reportPeriod === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              দৈনিক (Daily)
            </button>
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                reportPeriod === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সাপ্তাহিক (Weekly)
            </button>
            <button
              onClick={() => setReportPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                reportPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              মাসিক (Monthly)
            </button>
          </div>
        </div>
      </div>

      {/* Financial Statement Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">নির্বাচিত সময়ে মোট বিক্রয় ও আয়</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ৳ {totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">মোট দোকান ব্যয় ও খরচ</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ৳ {totalExpense.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">প্রকৃত নিট মুনাফা (Net Profit)</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              ৳ {netProfit.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Transaction Selector (Left) & Live Printable Receipt Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction List to pick for receipt */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs no-print space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">রসিদ প্রিন্টের জন্য নির্বাচন করুন</h3>
            <span className="text-xs text-slate-400">{receiptTransactions.length} টি লেনদেন</span>
          </div>

          {/* Search box within receipt selector */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchReceiptQuery}
              onChange={(e) => setSearchReceiptQuery(e.target.value)}
              placeholder="চালান নং বা কাস্টমারের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {receiptTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">কোনো লেনদেন পাওয়া যায়নি</div>
            ) : (
              receiptTransactions.map((trx) => {
                const isSelected = activeReceiptTransaction?.id === trx.id;
                return (
                  <div
                    key={trx.id}
                    onClick={() => onSelectReceipt(trx)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{trx.categoryLabelBn}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {trx.invoiceNo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {trx.customerName || 'সরাসরি কাস্টমার'} •{' '}
                        {new Date(trx.timestamp).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">
                        ৳ {trx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {trx.paymentMethodLabelBn}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Printable Receipt Component */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Header Bar */}
          <div className="flex flex-wrap items-center justify-between no-print bg-slate-900 text-white p-3.5 rounded-3xl gap-2">
            {/* Format toggle: Standard vs Thermal */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-semibold">ফরম্যাট:</span>
              <div className="bg-slate-800 p-0.5 rounded-xl flex text-xs">
                <button
                  onClick={() => setReceiptFormat('standard')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    receiptFormat === 'standard'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  স্ট্যান্ডার্ড A5
                </button>
                <button
                  onClick={() => setReceiptFormat('thermal')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    receiptFormat === 'thermal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  থার্মাল POS স্লিপ
                </button>
              </div>
            </div>

            {/* Print & Share Action Buttons */}
            {activeReceiptTransaction && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  title="হোয়াটসঅ্যাপে পাঠান"
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">হোয়াটসঅ্যাপ</span>
                </button>

                <button
                  onClick={handleCopyText}
                  title="মেমো কপি করুন"
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>

                <button
                  onClick={triggerPrint}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>মুদ্রণ করুন (Print)</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Printable Cash Memo Paper Layout */}
          {activeReceiptTransaction ? (
            <div
              id="printable-receipt-card"
              className={`bg-white rounded-2xl border border-slate-300 shadow-md mx-auto text-slate-900 transition-all ${
                receiptFormat === 'thermal'
                  ? 'max-w-[320px] p-5 font-mono text-[11px]'
                  : 'max-w-md p-8 font-sans text-xs'
              }`}
            >
              {/* Receipt Shop Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <div className="inline-block border-2 border-slate-900 px-3 py-0.5 font-black text-xs uppercase tracking-wider mb-1">
                  ক্যাশ মেমো / মানি রিসিট
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {settings.shopName}
                </h2>
                <h3 className="text-xs font-semibold text-slate-700">
                  {settings.shopSubtitle}
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                  {settings.address} <br />
                  ফটোকপি, প্রিন্টিং, পাসপোর্ট/এনআইডি আবেদন, স্টুডিও ছবি ও এমএফএস সেবা <br />
                  <span className="font-semibold">
                    মোবাইল: {settings.phone1}
                    {settings.phone2 ? `, ${settings.phone2}` : ''}
                  </span>
                </p>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 mb-3 border-b border-dashed border-slate-300">
                <div>
                  <span className="text-slate-500">চালান নং:</span>{' '}
                  <span className="font-mono font-bold">{activeReceiptTransaction.invoiceNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">তারিখ:</span>{' '}
                  <span className="font-bold">
                    {new Date(activeReceiptTransaction.timestamp).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">গ্রাহক:</span>{' '}
                  <span className="font-bold">
                    {activeReceiptTransaction.customerName || 'সম্মানিত কাস্টমার'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">মোবাইল:</span>{' '}
                  <span className="font-bold">{activeReceiptTransaction.customerPhone || '—'}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-4">
                <thead>
                  <tr className="border-b border-slate-900 text-[11px] font-bold text-slate-800">
                    <th className="py-1.5">নং</th>
                    <th className="py-1.5">সেবা / পণ্যের বিবরণ</th>
                    <th className="py-1.5 text-right">পরিমাণ</th>
                    <th className="py-1.5 text-right">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 font-bold">১.</td>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">
                        {activeReceiptTransaction.categoryLabelBn}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {activeReceiptTransaction.note || activeReceiptTransaction.categoryLabelEn}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium">১ টি</td>
                    <td className="py-2.5 text-right font-black">
                      ৳ {activeReceiptTransaction.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation Box */}
              <div className="border-t-2 border-slate-900 pt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">মোট ধার্যকৃত বিল (Total):</span>
                  <span className="font-bold">৳ {activeReceiptTransaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    পরিশোধের মাধ্যম ({activeReceiptTransaction.paymentMethodLabelBn}):
                  </span>
                  <span className="font-bold text-emerald-700">
                    {activeReceiptTransaction.paymentMethod === 'DUE' ? '৳ 0.00' : `৳ ${activeReceiptTransaction.amount.toLocaleString()}`}
                  </span>
                </div>
                {activeReceiptTransaction.paymentMethod === 'DUE' && (
                  <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                    <span>অবশিষ্ট বকেয়া (Due Amount):</span>
                    <span>৳ {activeReceiptTransaction.amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-1.5 mt-1">
                  <span>পরিশোধিত অর্থ (Net Paid):</span>
                  <span>
                    ৳{' '}
                    {activeReceiptTransaction.paymentMethod === 'DUE'
                      ? '০.০০'
                      : activeReceiptTransaction.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer Signatures & Terms */}
              <div className="mt-8 pt-6 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1"></div>
                  <span>গ্রাহকের স্বাক্ষর</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-800">কর্তৃপক্ষের সিল ও স্বাক্ষর</span>
                </div>
              </div>

              <div className="mt-6 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-200 pt-3">
                <p>{settings.receiptFooterNote}</p>
                <p className="font-mono text-[9px] mt-0.5">Software by Brothers Digital POS System</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 no-print">
              <Printer className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">কোনো রসিদ নির্বাচিত নেই</p>
              <p className="text-xs mt-1">
                বাম পাশের তালিকা থেকে যেকোনো লেনদেন নির্বাচন করে রসিদ দেখুন ও প্রিন্ট করুন।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
