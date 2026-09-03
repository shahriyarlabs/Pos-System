import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  User,
  Package,
  Smartphone,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Tag,
  CreditCard,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Customer, InventoryItem, MFSAccount, Transaction } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  customers: Customer[];
  inventory: InventoryItem[];
  mfsAccounts: MFSAccount[];
  onSelectTransaction: (trx: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  transactions,
  customers,
  inventory,
  mfsAccounts,
  onSelectTransaction,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TRANSACTIONS' | 'CUSTOMERS' | 'INVENTORY'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Search results
  const matchingTransactions = cleanQuery
    ? transactions.filter(
        (t) =>
          t.invoiceNo.toLowerCase().includes(cleanQuery) ||
          (t.customerName && t.customerName.toLowerCase().includes(cleanQuery)) ||
          (t.customerPhone && t.customerPhone.includes(cleanQuery)) ||
          t.categoryLabelBn.toLowerCase().includes(cleanQuery) ||
          t.categoryLabelEn.toLowerCase().includes(cleanQuery) ||
          (t.note && t.note.toLowerCase().includes(cleanQuery)) ||
          String(t.amount).includes(cleanQuery)
      ).slice(0, 8)
    : [];

  const matchingCustomers = cleanQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.phone.includes(cleanQuery) ||
          (c.address && c.address.toLowerCase().includes(cleanQuery)) ||
          (c.notes && c.notes.toLowerCase().includes(cleanQuery))
      ).slice(0, 6)
    : [];

  const matchingInventory = cleanQuery
    ? inventory.filter(
        (i) =>
          i.code.toLowerCase().includes(cleanQuery) ||
          i.nameBn.toLowerCase().includes(cleanQuery) ||
          i.nameEn.toLowerCase().includes(cleanQuery) ||
          i.category.toLowerCase().includes(cleanQuery)
      ).slice(0, 6)
    : [];

  const hasAnyResults =
    matchingTransactions.length > 0 ||
    matchingCustomers.length > 0 ||
    matchingInventory.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="চালান নং, কাস্টমারের নাম, ফোন নম্বর, সেবার নাম বা পণ্যের কোড দিয়ে খুঁজুন..."
            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 font-mono font-bold"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-xl font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সকল ফলাফল
          </button>
          <button
            onClick={() => setFilterType('TRANSACTIONS')}
            className={`px-3 py-1 rounded-xl font-semibold transition ${
              filterType === 'TRANSACTIONS'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            লেনদেনসমূহ ({matchingTransactions.length})
          </button>
          <button
            onClick={() => setFilterType('CUSTOMERS')}
            className={`px-3 py-1 rounded-xl font-semibold transition ${
              filterType === 'CUSTOMERS'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            কাস্টমার ও বকেয়া ({matchingCustomers.length})
          </button>
          <button
            onClick={() => setFilterType('INVENTORY')}
            className={`px-3 py-1 rounded-xl font-semibold transition ${
              filterType === 'INVENTORY'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            পণ্য ও স্টক ({matchingInventory.length})
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!cleanQuery ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">যেকোনো তথ্য সহজে খুঁজুন</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  উদাঃ "017...", "BDC-2026...", "A4 পেপার", "এনআইডি", "বকেয়া" লিখে সার্চ দিন
                </p>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <button
                  onClick={() => {
                    onNavigateToTab('dashboard');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition text-xs"
                >
                  <p className="font-bold text-slate-800">ড্যাশবোর্ড</p>
                  <p className="text-[10px] text-slate-400">আজকের হিসাব ও রিপোর্ট</p>
                </button>
                <button
                  onClick={() => {
                    onNavigateToTab('due-ledger');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition text-xs"
                >
                  <p className="font-bold text-slate-800">বকেয়া খাতা</p>
                  <p className="text-[10px] text-slate-400">গ্রাহকের পাওনা ও তাগাদা</p>
                </button>
                <button
                  onClick={() => {
                    onNavigateToTab('mfs-ledger');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-pink-500 hover:bg-pink-50/40 transition text-xs"
                >
                  <p className="font-bold text-slate-800">মোবাইল ব্যাংকিং</p>
                  <p className="text-[10px] text-slate-400">বিকাশ, নগদ, রকেট</p>
                </button>
                <button
                  onClick={() => {
                    onNavigateToTab('inventory');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition text-xs"
                >
                  <p className="font-bold text-slate-800">ইনভেন্টরি</p>
                  <p className="text-[10px] text-slate-400">পেপার রিম ও স্টক</p>
                </button>
              </div>
            </div>
          ) : !hasAnyResults ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">"{query}" দিয়ে কোনো তথ্য পাওয়া যায়নি।</p>
              <p className="text-xs text-slate-500 mt-1">দয়া করে নাম বা নম্বরের সঠিক বানান চেক করুন।</p>
            </div>
          ) : (
            <>
              {/* Transactions Matches */}
              {(filterType === 'ALL' || filterType === 'TRANSACTIONS') && matchingTransactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>লেনদেন ও রশিদসমূহ ({matchingTransactions.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingTransactions.map((trx) => (
                      <div
                        key={trx.id}
                        onClick={() => {
                          onSelectTransaction(trx);
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                            ৳
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{trx.categoryLabelBn}</span>
                              <span className="font-mono text-[10px] text-slate-400 font-semibold">
                                {trx.invoiceNo}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {trx.customerName || 'সরাসরি কাস্টমার'} • {trx.customerPhone || 'ফোন নেই'} •{' '}
                              {new Date(trx.timestamp).toLocaleDateString('bn-BD')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="font-black text-sm text-slate-900 block">
                              ৳{trx.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700">
                              {trx.paymentMethodLabelBn}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition text-slate-400">
                            <Printer className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Matches */}
              {(filterType === 'ALL' || filterType === 'CUSTOMERS') && matchingCustomers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>কাস্টমার ও বকেয়া খাতা ({matchingCustomers.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigateToTab('due-ledger');
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {c.phone} {c.address ? `• ${c.address}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span
                              className={`font-black text-sm block ${
                                c.currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              ৳{c.currentDue.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.currentDue > 0 ? 'বকেয়া পাওনা' : 'পরিশোধিত'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Matches */}
              {(filterType === 'ALL' || filterType === 'INVENTORY') && matchingInventory.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>পণ্য ও ইনভেন্টরি স্টক ({matchingInventory.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingInventory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateToTab('inventory');
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer transition flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                            {item.stockQuantity}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.nameBn}</div>
                            <div className="text-[11px] text-slate-500">
                              কোড: <span className="font-mono font-semibold">{item.code}</span> • বিক্রয়: ৳{item.sellingPrice}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stockQuantity <= item.lowStockThreshold
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            স্টক: {item.stockQuantity} {item.unitBn}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>দ্রুত সার্চ: ফলাফল নির্বাচন করে সরাসরি মেমো বা পেজে যান</span>
          <span className="font-mono text-[10px]">Brothers Digital Center Search Engine</span>
        </div>
      </div>
    </div>
  );
};
