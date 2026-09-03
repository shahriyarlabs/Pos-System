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
  Scissors,
  LayoutGrid,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Customer, ShopSettings, Transaction } from '../types';
import {
  generateReceiptShareText,
  printReceiptNow,
  printBatch4QuarterA4Now,
  QuarterA4Mode,
  QuarterA4Quadrant,
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
  const [receiptFormat, setReceiptFormat] = useState<'standard' | 'thermal' | 'quarter_a4'>(
    settings.receiptType || 'quarter_a4'
  );
  const [quarterA4Mode, setQuarterA4Mode] = useState<QuarterA4Mode>('left_single');
  const [quarterA4Quadrant, setQuarterA4Quadrant] = useState<QuarterA4Quadrant>('left_top');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedBatchTrxIds, setSelectedBatchTrxIds] = useState<string[]>([]);
  const [viewDetailedSingle, setViewDetailedSingle] = useState(false);
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
    printReceiptNow(
      activeReceiptTransaction,
      settings,
      receiptFormat,
      quarterA4Mode,
      quarterA4Quadrant
    );
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

          {/* Quick Batch 4-in-1 voucher print button */}
          <button
            onClick={() => {
              const default4 = receiptTransactions.slice(0, 4).map((t) => t.id);
              setSelectedBatchTrxIds(default4);
              setIsBatchModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-2 px-3 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>১ পাতায় ৪টি ভিন্ন ভাউচার প্রিন্ট করুন (4-in-1 A4)</span>
          </button>

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
          <div className="flex flex-col gap-2.5 no-print bg-slate-900 text-white p-3.5 rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Format toggle: 1/4 A4 vs Standard vs Thermal */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">ফরম্যাট:</span>
                <div className="bg-slate-800 p-0.5 rounded-xl flex flex-wrap text-xs">
                  <button
                    onClick={() => setReceiptFormat('quarter_a4')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      receiptFormat === 'quarter_a4'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>★ ১/৪ ল্যান্ডস্কেপ A4 (Epson L3210)</span>
                  </button>
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
                    থার্মাল স্লিপ
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

            {/* Sub-bar for Quarter A4 Layout Modes */}
            {receiptFormat === 'quarter_a4' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-300">
                  <span className="text-[11px] text-emerald-400 font-bold">Epson L3210 মোড:</span>
                  <div className="inline-flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setQuarterA4Mode('left_single')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        quarterA4Mode === 'left_single'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="কাগজের বাম পাশে ১টি ভাউচার (148mm × 105mm)"
                    >
                      বাম পাশে ১টি ভাউচার (1/4 A4)
                    </button>
                    <button
                      onClick={() => setQuarterA4Mode('4in1')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        quarterA4Mode === '4in1'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="সম্পূর্ণ A4 ল্যান্ডস্কেপ শিটে ৪টি ভাউচার (2x2 গ্রিড কাটার দাগ সহ)"
                    >
                      ১ পাতায় ৪টি ভাউচার (4-in-1)
                    </button>
                    <button
                      onClick={() => setQuarterA4Mode('dual')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        quarterA4Mode === 'dual'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="পাশাপাশি ২টি ভাউচার (গ্রাহক কপি + দোকান কপি)"
                    >
                      ডাবল কপি (গ্রাহক + অফিস)
                    </button>
                  </div>

                  {quarterA4Mode === 'left_single' && (
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[10.5px]">
                      <span className="text-slate-400 font-semibold">অবস্থান:</span>
                      <button
                        onClick={() => setQuarterA4Quadrant('left_top')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          quarterA4Quadrant === 'left_top'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="কাগজের বাম পাশে উপরে"
                      >
                        ★ বাম-উপর (প্রধান)
                      </button>
                      <button
                        onClick={() => setQuarterA4Quadrant('left_bottom')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          quarterA4Quadrant === 'left_bottom'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="কাগজের বাম পাশে নিচে"
                      >
                        বাম-নিচ
                      </button>
                      <button
                        onClick={() => setQuarterA4Quadrant('right_top')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          quarterA4Quadrant === 'right_top'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="কাগজের ডান পাশে উপরে"
                      >
                        ডান-উপর
                      </button>
                      <button
                        onClick={() => setQuarterA4Quadrant('right_bottom')}
                        className={`px-2 py-0.5 rounded font-bold transition ${
                          quarterA4Quadrant === 'right_bottom'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="কাগজের ডান পাশে নিচে"
                      >
                        ডান-নিচ
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  📐 সাইজ: <b className="text-white">১৪৮.৫ × ১০৫ মিমি</b> (ল্যান্ডস্কেপ A4 এর ১/৪ অংশ)
                </div>
              </div>
            )}
          </div>

          {/* Live Printable Cash Memo Paper Layout */}
          {activeReceiptTransaction ? (
            <div className="space-y-3">
              {receiptFormat === 'quarter_a4' ? (
                /* Epson L3210 Quarter A4 Landscape Live Preview */
                <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
                  {viewDetailedSingle ? (
                    /* Detailed Zoomed-in Card View */
                    <div className="space-y-3">
                      <div className="flex justify-between items-center max-w-lg mx-auto">
                        <span className="text-xs font-bold text-slate-600">🔍 সম্পূর্ণ ভাউচার জুম ভিউ</span>
                        <button
                          onClick={() => setViewDetailedSingle(false)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
                        >
                          ↶ ল্যান্ডস্কেপ A4 শিট ভিউতে ফিরে যান
                        </button>
                      </div>

                      <div
                        id="printable-receipt-card"
                        className="bg-white rounded-xl border-2 border-slate-900 p-4 max-w-lg mx-auto shadow-md text-slate-900 text-[11px] space-y-2.5"
                      >
                        {/* Top Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
                          <div>
                            <h2 className="text-base font-black text-slate-900 leading-tight">
                              {settings.shopName}
                            </h2>
                            <div className="text-[10px] font-semibold text-slate-700">
                              {settings.shopSubtitle}
                            </div>
                            <div className="text-[9px] text-slate-600 mt-0.5">
                              {settings.address} • মোবা: <b className="text-slate-900">{settings.phone1}</b>
                              {settings.phone2 ? `, ${settings.phone2}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-block border border-slate-900 px-2 py-0.5 font-black text-[9px] uppercase rounded-sm bg-slate-50">
                              ক্যাশ ভাউচার
                            </div>
                            <div className="text-[9px] font-bold text-emerald-700 mt-1">
                              মূল কপি / রসিদ
                            </div>
                          </div>
                        </div>

                        {/* Invoice Meta Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-500">ভাউচার নং:</span>{' '}
                            <span className="font-mono font-bold text-slate-900">
                              {activeReceiptTransaction.invoiceNo}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">তারিখ:</span>{' '}
                            <span className="font-bold">
                              {new Date(activeReceiptTransaction.timestamp).toLocaleDateString('bn-BD', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">গ্রাহক:</span>{' '}
                            <span className="font-bold">
                              {activeReceiptTransaction.customerName || 'সরাসরি কাস্টমার'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">মোবাইল:</span>{' '}
                            <span className="font-bold">
                              {activeReceiptTransaction.customerPhone || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Compact Table */}
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-100 font-bold text-slate-800">
                              <th className="py-1 px-2">নং</th>
                              <th className="py-1 px-2">সেবা / পণ্যের বিবরণ</th>
                              <th className="py-1 px-2 text-center">পরিমাণ</th>
                              <th className="py-1 px-2 text-right">মূল্য</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <td className="py-1.5 px-2 font-bold">১.</td>
                              <td className="py-1.5 px-2">
                                <div className="font-bold text-slate-900">
                                  {activeReceiptTransaction.categoryLabelBn}
                                </div>
                                {activeReceiptTransaction.note && (
                                  <div className="text-[9px] text-slate-500">
                                    {activeReceiptTransaction.note}
                                  </div>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-center">১ টি</td>
                              <td className="py-1.5 px-2 text-right font-black text-slate-900">
                                ৳ {activeReceiptTransaction.amount.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Total and Payment */}
                        <div className="border-t border-slate-900 pt-2 flex justify-between items-end text-[10px]">
                          <div>
                            <div className="text-slate-600">
                              মাধ্যম: <b className="text-slate-900">{activeReceiptTransaction.paymentMethodLabelBn}</b>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              {settings.receiptFooterNote}
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div className="text-slate-600">
                              মোট বিল: <b className="text-slate-900">৳ {activeReceiptTransaction.amount.toLocaleString()}</b>
                            </div>
                            {activeReceiptTransaction.paymentMethod === 'DUE' && (
                              <div className="text-rose-600 font-bold">
                                বকেয়া: ৳ {activeReceiptTransaction.amount.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xs font-black border-t border-slate-900 pt-0.5 text-slate-900">
                              পরিশোধ:{' '}
                              <span className={activeReceiptTransaction.paymentMethod === 'DUE' ? 'text-rose-600' : 'text-emerald-700'}>
                                ৳ {activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="pt-4 flex justify-between items-end text-[9px] text-slate-500">
                          <div className="text-center">
                            <div className="w-16 border-b border-dotted border-slate-400 mb-1"></div>
                            <span>গ্রাহক স্বাক্ষর</span>
                          </div>
                          <div className="text-[8px] font-mono text-slate-400">
                            Epson L3210 • 1/4 A4 Landscape
                          </div>
                          <div className="text-center">
                            <div className="w-20 border-b border-dotted border-slate-400 mb-1"></div>
                            <span className="font-bold text-slate-800">স্বত্বাধিকারী / ক্যাশিয়ার</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Full Landscape A4 Simulation Box (2x2 Grid with Scissor Cut Guides) */
                    <div className="bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-md max-w-2xl mx-auto space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">
                            📄 ল্যান্ডস্কেপ A4 শিট ভিউ (২৯৭ × ২১০ মিমি • Epson L3210)
                          </span>
                        </div>
                        <span className="text-[10.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          {quarterA4Mode === 'left_single'
                            ? `ভাউচার অবস্থান: ${
                                quarterA4Quadrant === 'left_top'
                                  ? 'বাম-উপর (Left-Top)'
                                  : quarterA4Quadrant === 'left_bottom'
                                  ? 'বাম-নিচ (Left-Bottom)'
                                  : quarterA4Quadrant === 'right_top'
                                  ? 'ডান-উপর'
                                  : 'ডান-নিচ'
                              }`
                            : quarterA4Mode === '4in1'
                            ? '১ পাতায় ৪টি ভাউচার (পূর্ণ A4)'
                            : 'ডাবল কপি (গ্রাহক + অফিস)'}
                        </span>
                      </div>

                      {/* 2x2 Quadrant Grid */}
                      <div className="grid grid-cols-2 gap-3 relative bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                        {/* Vertical center cutting guideline */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-slate-300 z-10 flex flex-col justify-around items-center pointer-events-none">
                          <span className="bg-white px-1 text-[8px] text-slate-500 font-bold rounded-sm border border-slate-200 shadow-2xs rotate-90">
                            ✂ কাটার দাগ
                          </span>
                          <span className="bg-white px-1 text-[8px] text-slate-500 font-bold rounded-sm border border-slate-200 shadow-2xs rotate-90">
                            ✂ কাটার দাগ
                          </span>
                        </div>

                        {/* Horizontal center cutting guideline */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-300 z-10 flex justify-around items-center pointer-events-none">
                          <span className="bg-white px-1 text-[8px] text-slate-500 font-bold rounded-sm border border-slate-200 shadow-2xs">
                            ✂ কাটার দাগ
                          </span>
                          <span className="bg-white px-1 text-[8px] text-slate-500 font-bold rounded-sm border border-slate-200 shadow-2xs">
                            ✂ কাটার দাগ
                          </span>
                        </div>

                        {/* Cell 1: Top-Left (LEFT SIDE TOP) */}
                        <div className="min-h-[185px]">
                          {quarterA4Mode === 'left_single' ? (
                            quarterA4Quadrant === 'left_top' ? (
                              /* Active Single Voucher Rendered at Left-Top */
                              <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                  <div>
                                    <div className="font-black text-[11px] text-slate-900 leading-tight">
                                      {settings.shopName}
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                  </div>
                                  <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs">
                                    গ্রাহক কপি (বাম-উপর)
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                  <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                  <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                  <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-black">
                                  <span>পরিশোধ:</span>
                                  <span className="text-emerald-700">
                                    ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[7px] text-slate-400 border-t border-slate-200 pt-0.5">
                                  <span>গ্রাহক স্বাক্ষর</span>
                                  <span>স্বত্বাধিকারী</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                                <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold text-slate-500">বাম-উপর (ফাঁকা কাগজ)</span>
                                <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে</span>
                              </div>
                            )
                          ) : quarterA4Mode === '4in1' || quarterA4Mode === 'dual' ? (
                            <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                              <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                <div>
                                  <div className="font-black text-[11px] text-slate-900 leading-tight">
                                    {settings.shopName}
                                  </div>
                                  <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                </div>
                                <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs">
                                  ১. গ্রাহক কপি
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-black">
                                <span>পরিশোধ:</span>
                                <span className="text-emerald-700">
                                  ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-[7px] text-slate-400 border-t border-slate-200 pt-0.5">
                                <span>গ্রাহক স্বাক্ষর</span>
                                <span>স্বত্বাধিকারী</span>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* Cell 2: Top-Right (RIGHT SIDE TOP) */}
                        <div className="min-h-[185px]">
                          {quarterA4Mode === 'left_single' ? (
                            quarterA4Quadrant === 'right_top' ? (
                              <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                  <div>
                                    <div className="font-black text-[11px] text-slate-900 leading-tight">
                                      {settings.shopName}
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                  </div>
                                  <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs">
                                    গ্রাহক কপি (ডান-উপর)
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                  <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                  <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                  <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-black">
                                  <span>পরিশোধ:</span>
                                  <span className="text-emerald-700">
                                    ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                                <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold text-slate-500">ডান-উপর (ফাঁকা কাগজ)</span>
                                <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে (পুনঃব্যবহারযোগ্য)</span>
                              </div>
                            )
                          ) : quarterA4Mode === '4in1' || quarterA4Mode === 'dual' ? (
                            <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                              <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                <div>
                                  <div className="font-black text-[11px] text-slate-900 leading-tight">
                                    {settings.shopName}
                                  </div>
                                  <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                </div>
                                <span className="text-[7.5px] font-black bg-blue-100 text-blue-800 px-1 py-0.2 rounded-xs">
                                  ২. অফিস / দোকান কপি
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-black">
                                <span>পরিশোধ:</span>
                                <span className="text-emerald-700">
                                  ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* Cell 3: Bottom-Left (LEFT SIDE BOTTOM) */}
                        <div className="min-h-[185px]">
                          {quarterA4Mode === 'left_single' ? (
                            quarterA4Quadrant === 'left_bottom' ? (
                              <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                  <div>
                                    <div className="font-black text-[11px] text-slate-900 leading-tight">
                                      {settings.shopName}
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                  </div>
                                  <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs">
                                    গ্রাহক কপি (বাম-নিচ)
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                  <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                  <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                  <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-black">
                                  <span>পরিশোধ:</span>
                                  <span className="text-emerald-700">
                                    ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                                <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold text-slate-500">বাম-নিচ (ফাঁকা কাগজ)</span>
                                <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে (পুনঃব্যবহারযোগ্য)</span>
                              </div>
                            )
                          ) : quarterA4Mode === '4in1' ? (
                            <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                              <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                <div>
                                  <div className="font-black text-[11px] text-slate-900 leading-tight">
                                    {settings.shopName}
                                  </div>
                                  <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                </div>
                                <span className="text-[7.5px] font-black bg-purple-100 text-purple-800 px-1 py-0.2 rounded-xs">
                                  ৩. কাউন্টার কপি
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-black">
                                <span>পরিশোধ:</span>
                                <span className="text-emerald-700">
                                  ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                              <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                              <span className="text-[9px] font-bold text-slate-500">নিচের অংশ (ফাঁকা কাগজ)</span>
                              <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে (পরবর্তী প্রিন্টের জন্য)</span>
                            </div>
                          )}
                        </div>

                        {/* Cell 4: Bottom-Right (RIGHT SIDE BOTTOM) */}
                        <div className="min-h-[185px]">
                          {quarterA4Mode === 'left_single' ? (
                            quarterA4Quadrant === 'right_bottom' ? (
                              <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                  <div>
                                    <div className="font-black text-[11px] text-slate-900 leading-tight">
                                      {settings.shopName}
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                  </div>
                                  <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-xs">
                                    গ্রাহক কপি (ডান-নিচ)
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                  <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                  <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                  <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8.5px] font-black">
                                  <span>পরিশোধ:</span>
                                  <span className="text-emerald-700">
                                    ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                                <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold text-slate-500">ডান-নিচ (ফাঁকা কাগজ)</span>
                                <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে (পুনঃব্যবহারযোগ্য)</span>
                              </div>
                            )
                          ) : quarterA4Mode === '4in1' ? (
                            <div className="bg-white border-1.5 border-slate-900 rounded-lg p-2.5 text-[9px] space-y-1.5 shadow-xs h-full flex flex-col justify-between">
                              <div className="flex justify-between items-start border-b border-slate-900 pb-1">
                                <div>
                                  <div className="font-black text-[11px] text-slate-900 leading-tight">
                                    {settings.shopName}
                                  </div>
                                  <div className="text-[7.5px] text-slate-500">{settings.phone1}</div>
                                </div>
                                <span className="text-[7.5px] font-black bg-amber-100 text-amber-800 px-1 py-0.2 rounded-xs">
                                  ৪. অতিরিক্ত কপি
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1 rounded-sm border border-slate-200">
                                <div>নং: <b>{activeReceiptTransaction.invoiceNo}</b></div>
                                <div className="text-right">গ্রাহক: <b>{activeReceiptTransaction.customerName || 'কাস্টমার'}</b></div>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-bold py-0.5 border-y border-slate-200">
                                <span>{activeReceiptTransaction.categoryLabelBn}</span>
                                <span>৳{activeReceiptTransaction.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[8.5px] font-black">
                                <span>পরিশোধ:</span>
                                <span className="text-emerald-700">
                                  ৳{activeReceiptTransaction.paymentMethod === 'DUE' ? '০.০০' : activeReceiptTransaction.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border-2 border-dotted border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/60">
                              <Scissors className="w-4 h-4 text-slate-400 mb-1" />
                              <span className="text-[9px] font-bold text-slate-500">নিচের অংশ (ফাঁকা কাগজ)</span>
                              <span className="text-[8px] text-slate-400 mt-0.5">অক্ষত থাকবে (পরবর্তী প্রিন্টের জন্য)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Tip & Toggle to Detail Zoom */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                        <div className="text-[11px] text-slate-500">
                          ✂️ <b className="text-slate-800">Epson L3210 গাইড:</b> ভাউচারটি কাগজের বাম পাশে মুদ্রিত হবে। কাটার পর বাকি অংশ সংরক্ষণ করে আবার প্রিন্টারে দিতে পারবেন।
                        </div>
                        <button
                          onClick={() => setViewDetailedSingle(true)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>🔍 সম্পূর্ণ ভাউচার বড় করে দেখুন</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard A5 or Thermal Slip layout */
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
              )}

              {/* Epson L3210 Quick Print Tip Card */}
              {receiptFormat === 'quarter_a4' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Printer className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900">Epson L3210 কালার/ইঙ্কজেট প্রিন্ট গাইড:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-emerald-800">
                      <li>
                        <b>কাগজ সাশ্রয় পদ্ধতি:</b> <span className="font-semibold">৪-ইন-১ মোড</span> দিয়ে এক পাতা A4 কাগজে ৪টি ভাউচার এক ক্লিকে প্রিন্ট করুন এবং দাগ বরাবর কেঁচি দিয়ে কেটে নিন।
                      </li>
                      <li>
                        <b>অফিস রেকর্ড:</b> <span className="font-semibold">ডাবল কপি মোড</span> ব্যবহার করলে একই পাতায় গ্রাহক কপি ও দোকান কপি পাশাপাশি মুদ্রিত হবে।
                      </li>
                      <li>
                        <b>প্রিন্টার সেটিং:</b> ব্রাউজারের প্রিন্ট উইন্ডোতে Layout: <b>Landscape (আড়াআড়ি)</b> এবং Paper Size: <b>A4</b> রাখুন।
                      </li>
                    </ul>
                  </div>
                </div>
              )}
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
      {/* Batch 4-in-1 Voucher Printing Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-emerald-600" />
                  <span>১ পাতায় ৪টি ভিন্ন ভাউচার প্রিন্ট করুন (Batch 4-in-1)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Epson L3210 প্রিন্টারে ১টি পূর্ণ A4 ল্যান্ডস্কেপ শিটে ৪টি আলাদা কাস্টমারের ভাউচার এক ক্লিকে প্রিন্ট করুন।
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left: Checkbox Selection List */}
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    সর্বোচ্চ ৪টি লেনদেন নির্বাচন করুন ({selectedBatchTrxIds.length}/৪)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBatchTrxIds(receiptTransactions.slice(0, 4).map((t) => t.id));
                      }}
                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      সর্বশেষ ৪টি
                    </button>
                    <button
                      onClick={() => setSelectedBatchTrxIds([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      রিসেট
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 border border-slate-100 p-1.5 rounded-2xl">
                  {receiptTransactions.map((trx) => {
                    const isChecked = selectedBatchTrxIds.includes(trx.id);
                    return (
                      <div
                        key={trx.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedBatchTrxIds((prev) => prev.filter((id) => id !== trx.id));
                          } else {
                            if (selectedBatchTrxIds.length >= 4) {
                              return;
                            }
                            setSelectedBatchTrxIds((prev) => [...prev, trx.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{trx.categoryLabelBn}</div>
                            <div className="text-[10px] text-slate-500">
                              {trx.invoiceNo} • {trx.customerName || 'কাস্টমার'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">৳{trx.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: 2x2 Sheet Preview of the 4 Selected Transactions */}
              <div className="md:col-span-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>📄 A4 ল্যান্ডস্কেপ শিট প্রিভিউ</span>
                  <span className="text-[10px] text-slate-500 font-normal">কাটার দাগ সহ ২×২ গ্রিড</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-300 min-h-[300px]">
                  {[0, 1, 2, 3].map((index) => {
                    const trxId = selectedBatchTrxIds[index];
                    const trx = transactions.find((t) => t.id === trxId);
                    const quadrantNames = ['১. বাম-উপর (Top-Left)', '২. ডান-উপর (Top-Right)', '৩. বাম-নিচ (Bottom-Left)', '৪. ডান-নিচ (Bottom-Right)'];
                    return (
                      <div key={index} className="border border-dashed border-slate-300 rounded-lg p-2 min-h-[140px] flex flex-col justify-between bg-slate-50/50">
                        <div className="flex justify-between items-center text-[9px] border-b border-slate-200 pb-1">
                          <span className="font-bold text-slate-500">{quadrantNames[index]}</span>
                          {trx && <span className="font-bold text-emerald-700 font-mono">{trx.invoiceNo}</span>}
                        </div>
                        {trx ? (
                          <div className="my-auto text-[10px] space-y-1 py-1">
                            <div className="font-black text-slate-900 leading-tight">{trx.categoryLabelBn}</div>
                            <div className="text-[9px] text-slate-500 truncate">{trx.customerName || 'কাস্টমার'}</div>
                            <div className="text-xs font-black text-emerald-800">৳ {trx.amount.toLocaleString()}</div>
                          </div>
                        ) : (
                          <div className="my-auto text-center text-[9px] text-slate-400">
                            (ভাউচার নির্বাচন করুন)
                          </div>
                        )}
                        <div className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                          <span>Epson L3210</span>
                          <span>1/4 A4</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    disabled={selectedBatchTrxIds.length === 0}
                    onClick={() => {
                      const selected = transactions.filter((t) => selectedBatchTrxIds.includes(t.id));
                      if (selected.length === 0) return;
                      printBatch4QuarterA4Now(selected, settings);
                      setIsBatchModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>৪টি ভাউচার এক পাতায় প্রিন্ট করুন ({selectedBatchTrxIds.length} টি)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
