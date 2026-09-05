import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Search,
  Send,
  Scissors,
} from 'lucide-react';
import { Customer, ShopSettings, Transaction } from '../types';
import { generateReceiptShareText } from '../lib/receiptPrinter';

interface ReportsAndReceiptsProps {
  transactions: Transaction[];
  customers: Customer[];
  activeReceiptTransaction: Transaction | null;
  onCloseReceipt: () => void;
  onSelectReceipt: (trx: Transaction) => void;
  settings: ShopSettings;
}

/* ── ফিক্সড @page: শুধুমাত্র A4 ল্যান্ডস্কেপ (297mm × 210mm) ── */
const PrintPageStyle: React.FC = () => (
  <style>{`
    @page {
      size: 297mm 210mm;
      margin: 0;
    }
    @media print {
      #a4-print-sheet {
        width: 297mm !important;
        height: 210mm !important;
      }
    }
  `}</style>
);

/* ── ভাউচার বডি (প্রিভিউ + প্রিন্ট) ── */
const VoucherContent: React.FC<{
  trx: Transaction;
  settings: ShopSettings;
  copyLabel?: string;
}> = ({ trx, settings, copyLabel = 'গ্রাহক কপি' }) => (
  <div
    className="h-full w-full flex flex-col text-slate-900 bg-white"
    style={{ fontSize: '9px', lineHeight: 1.45 }}
  >
    {/* Header */}
    <div className="text-center border-b-2 border-slate-900 pb-1.5 shrink-0">
      {settings.shopLogo && (
        <img
          src={settings.shopLogo}
          alt={settings.shopName}
          className="w-7 h-7 mx-auto mb-1 object-contain rounded"
        />
      )}
      <div className="font-black leading-tight" style={{ fontSize: '12px' }}>
        {settings.shopName}
      </div>
      {settings.shopSubtitle && (
        <div className="font-semibold text-slate-700" style={{ fontSize: '7.5px' }}>
          {settings.shopSubtitle}
        </div>
      )}
      <div className="text-slate-600 leading-tight mt-0.5" style={{ fontSize: '7px' }}>
        {settings.address}
      </div>
      <div className="font-bold" style={{ fontSize: '7.5px' }}>
        মোবা: {settings.phone1}
        {settings.phone2 ? `, ${settings.phone2}` : ''}
      </div>
      <div
        className="inline-block border border-slate-900 px-2 py-0.5 mt-1.5 font-black bg-slate-50"
        style={{ fontSize: '7px' }}
      >
        ক্যাশ মেমো • {copyLabel}
      </div>
    </div>

    {/* Meta */}
    <div
      className="py-1.5 border-b border-dashed border-slate-400 space-y-1 shrink-0"
      style={{ fontSize: '8.5px' }}
    >
      <div className="flex justify-between gap-1">
        <span className="text-slate-500 shrink-0">নং:</span>
        <b className="font-mono text-right">{trx.invoiceNo}</b>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">তারিখ:</span>
        <b>{new Date(trx.timestamp).toLocaleDateString('bn-BD')}</b>
      </div>
      <div className="flex justify-between gap-1">
        <span className="text-slate-500 shrink-0">গ্রাহক:</span>
        <b className="truncate text-right">{trx.customerName || 'সরাসরি কাস্টমার'}</b>
      </div>
      {trx.customerPhone && (
        <div className="flex justify-between">
          <span className="text-slate-500">মোবাইল:</span>
          <b>{trx.customerPhone}</b>
        </div>
      )}
    </div>

    {/* Item */}
    <div className="py-2 border-b border-dashed border-slate-400" style={{ minHeight: '25mm' }}>
      <table className="w-full" style={{ fontSize: '8.5px' }}>
        <thead>
          <tr className="border-b border-slate-800 font-bold">
            <th className="text-left pb-1">বিবরণ</th>
            <th className="text-right pb-1">টাকা</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pt-1.5 pr-1">
              <b>{trx.categoryLabelBn}</b>
              {trx.note && (
                <div className="text-slate-500 mt-0.5" style={{ fontSize: '7.5px' }}>
                  {trx.note}
                </div>
              )}
            </td>
            <td className="pt-1.5 text-right font-black align-top">
              ৳{trx.amount.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div
      className="py-2 border-t-2 border-slate-900 space-y-1 shrink-0"
      style={{ fontSize: '9px' }}
    >
      <div className="flex justify-between font-bold">
        <span>মোট বিল:</span>
        <span>৳ {trx.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-600">মাধ্যম:</span>
        <b>{trx.paymentMethodLabelBn}</b>
      </div>
      <div className="flex justify-between font-black border-t border-slate-400 pt-1">
        <span>পরিশোধ:</span>
        <span className={trx.paymentMethod === 'DUE' ? 'text-rose-600' : 'text-emerald-700'}>
          ৳ {trx.paymentMethod === 'DUE' ? '০.০০' : trx.amount.toLocaleString()}
        </span>
      </div>
      {trx.paymentMethod === 'DUE' && (
        <div className="flex justify-between font-bold text-rose-600">
          <span>বকেয়া:</span>
          <span>৳ {trx.amount.toLocaleString()}</span>
        </div>
      )}
    </div>

    {/* Footer + signatures */}
    <div className="pt-2 border-t border-dashed border-slate-400 shrink-0">
      <p className="text-center text-slate-600" style={{ fontSize: '7px' }}>
        {settings.receiptFooterNote}
      </p>
      <div
        className="flex justify-between items-end mt-5 text-slate-500"
        style={{ fontSize: '7.5px' }}
      >
        <div className="text-center">
          <div className="w-10 border-b border-dotted border-slate-500 mb-0.5"></div>
          গ্রাহক
        </div>
        <div className="text-center">
          <div className="w-12 border-b border-dotted border-slate-500 mb-0.5"></div>
          ক্যাশিয়ার
        </div>
      </div>
    </div>
  </div>
);

export const ReportsAndReceipts: React.FC<ReportsAndReceiptsProps> = ({
  transactions,
  activeReceiptTransaction,
  onSelectReceipt,
  settings,
}) => {
  const [searchReceiptQuery, setSearchReceiptQuery] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [previewTab, setPreviewTab] = useState<'sheet' | 'zoom'>('sheet');

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

  const triggerPrint = () => {
    if (!activeReceiptTransaction) return;
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!activeReceiptTransaction) return;
    const text = generateReceiptShareText(activeReceiptTransaction, settings);
    let targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (activeReceiptTransaction.customerPhone) {
      let cleanPhone = activeReceiptTransaction.customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('01')) cleanPhone = '88' + cleanPhone;
      targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    }
    window.open(targetUrl, '_blank');
  };

  const handleCopyText = () => {
    if (!activeReceiptTransaction) return;
    navigator.clipboard.writeText(generateReceiptShareText(activeReceiptTransaction, settings));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ফিক্সড ডাইনামিক @page স্টাইল (A4 Landscape 297mm × 210mm) */}
      <PrintPageStyle />

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>কাস্টমার ক্যাশ মেমো (Receipts)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ফরম্যাট: A4 ল্যান্ডস্কেপ পেপারের ডান পাশে একক ভাউচার (দৈর্ঘ্য: ৮ ইঞ্চি × প্রস্থ: ৩ ইঞ্চি)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: transaction list */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs no-print space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">রসিদ নির্বাচন করুন</h3>
            <span className="text-xs text-slate-400">{receiptTransactions.length} টি লেনদেন</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchReceiptQuery}
              onChange={(e) => setSearchReceiptQuery(e.target.value)}
              placeholder="চালান নং বা কাস্টমারের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {receiptTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো লেনদেন পাওয়া যায়নি
              </div>
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

        {/* Right: controls + preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col gap-2.5 no-print bg-slate-900 text-white p-3.5 rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-300 font-semibold">ভিউ মোড:</span>
                <div className="bg-slate-800 p-0.5 rounded-xl flex text-xs">
                  <button
                    onClick={() => setPreviewTab('sheet')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      previewTab === 'sheet'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    A4 ল্যান্ডস্কেপ শীট
                  </button>
                  <button
                    onClick={() => setPreviewTab('zoom')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      previewTab === 'zoom'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ভাউচার জুম ভিউ
                  </button>
                </div>
              </div>

              {activeReceiptTransaction && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">হোয়াটসঅ্যাপ</span>
                  </button>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedText ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                  <button
                    onClick={triggerPrint}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview: Either A4 Landscape with right-side voucher or Zoomed in voucher */}
          {activeReceiptTransaction ? (
            previewTab === 'sheet' ? (
              <div className="bg-slate-100 rounded-2xl p-4 border-2 border-slate-300 shadow-md max-w-3xl mx-auto overflow-x-auto">
                <div
                  className="bg-white border border-slate-400 rounded-lg overflow-hidden mx-auto shadow-sm min-w-[460px] sm:min-w-0"
                  style={{
                    aspectRatio: '297 / 210',
                    width: '100%',
                  }}
                >
                  <div className="flex h-full w-full">
                    {/* Left area: Empty A4 paper section */}
                    <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center select-none bg-slate-50/40 relative">
                      <div className="border border-dashed border-slate-300 rounded-xl p-4 max-w-xs text-center">
                        <p className="text-[11px] font-semibold text-slate-500">
                          A4 ল্যান্ডস্কেপ পেপার (বাম অংশ খালি)
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">
                          প্রিন্ট করার সময় ভাউচারটি পেপারের ডান প্রান্তে ৩ ইঞ্চি প্রশস্ত অংশে প্রিন্ট হবে।
                        </p>
                      </div>

                      {/* Scissor cutting line indicator on the right edge */}
                      <div className="absolute right-0 top-0 bottom-0 border-r border-dashed border-slate-400 flex flex-col justify-around items-center pr-0.5 text-slate-400 text-[8px]">
                        <span className="flex items-center gap-0.5 transform -rotate-90 origin-right">
                          <Scissors className="w-2.5 h-2.5" /> কাটার দাগ
                        </span>
                        <span className="flex items-center gap-0.5 transform -rotate-90 origin-right">
                          <Scissors className="w-2.5 h-2.5" /> কাটার দাগ
                        </span>
                      </div>
                    </div>

                    {/* Right area: Exactly 1/4 (approx 3 inch) voucher */}
                    <div
                      className="h-full p-2.5 bg-white shrink-0 border-l border-slate-200"
                      style={{ width: '25%' }}
                    >
                      <VoucherContent
                        trx={activeReceiptTransaction}
                        settings={settings}
                        copyLabel="গ্রাহক কপি"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-4 border-2 border-slate-300 shadow-md max-w-sm mx-auto">
                <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-sm">
                  <VoucherContent
                    trx={activeReceiptTransaction}
                    settings={settings}
                    copyLabel="গ্রাহক কপি"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 no-print">
              <Printer className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">কোনো রসিদ নির্বাচিত নেই</p>
              <p className="text-xs mt-1">বাম পাশের তালিকা থেকে লেনদেন নির্বাচন করুন।</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden print sheet: Only A4 landscape right side single voucher */}
      <div id="print-root" className="print-only">
        <div id="a4-print-sheet">
          <div className="voucher-right-print">
            {activeReceiptTransaction && (
              <VoucherContent
                trx={activeReceiptTransaction}
                settings={settings}
                copyLabel="গ্রাহক কপি"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
