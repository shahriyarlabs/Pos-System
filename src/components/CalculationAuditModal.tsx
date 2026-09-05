import React from 'react';
import { auditAllCalculations, formatTaka } from '../lib/calculations';
import {
  Customer,
  InventoryItem,
  MFSAccount,
  ShopSettings,
  Transaction,
} from '../types';
import {
  Calculator,
  X,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Users,
  Package,
} from 'lucide-react';

interface CalculationAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  transactions: Transaction[];
  mfsAccounts: MFSAccount[];
  customers: Customer[];
  inventory: InventoryItem[];
}

export const CalculationAuditModal: React.FC<CalculationAuditModalProps> = ({
  isOpen,
  onClose,
  settings,
  transactions,
  mfsAccounts,
  customers,
  inventory,
}) => {
  if (!isOpen) return null;

  const audit = auditAllCalculations(settings, transactions, mfsAccounts, customers, inventory);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">লাইভ ক্যালকুলেশন অডিট ও হিসাব মেলানো</h2>
              <p className="text-xs text-slate-300">
                ডাটাবেজ ভিত্তিক নিখুঁত গাণিতিক ফর্মুলা ও ব্যালেন্স যাচাইকরণ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Cash in Hand Math Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4 text-emerald-600" />
                ১. হাতে নগদ হিসাব (Cash in Drawer Formula)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                গাণিতিকভাবে পরীক্ষিত
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-700">
              {/* Inflow */}
              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  সকালের প্রারম্ভিক ক্যাশ (Opening Balance)
                </span>
                <span className="font-semibold text-slate-800">{formatTaka(audit.openingCash)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  আজকের নগদ বিক্রয় ও সেবা (Cash Sales)
                </span>
                <span className="font-semibold text-emerald-600">+{formatTaka(audit.cashSalesIncome)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  আজকের বাকি নগদ আদায় (Due Recovery)
                </span>
                <span className="font-semibold text-emerald-600">+{formatTaka(audit.dueCollectedInCash)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  এমএফএস ক্যাশ-ইন গ্রহণ (গ্রাহক ক্যাশ দিয়েছেন)
                </span>
                <span className="font-semibold text-emerald-600">+{formatTaka(audit.mfsCashInReceived)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-emerald-50/70 px-2 rounded-lg font-medium text-emerald-900 border border-emerald-100">
                <span>মোট ক্যাশ আগমন (Total Inflow)</span>
                <span>{formatTaka(audit.totalCashInflow)}</span>
              </div>

              {/* Outflow */}
              <div className="flex justify-between items-center py-1 pt-2">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
                  দোকানের নগদ খরচ (Cash Expenses)
                </span>
                <span className="font-semibold text-rose-600">-{formatTaka(audit.cashExpenses)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
                  এমএফএস ক্যাশ-আউট প্রদান (গ্রাহককে ক্যাশ দিয়েছেন)
                </span>
                <span className="font-semibold text-rose-600">-{formatTaka(audit.mfsCashOutPaid)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-rose-50/70 px-2 rounded-lg font-medium text-rose-900 border border-rose-100">
                <span>মোট ক্যাশ বহির্গমন (Total Outflow)</span>
                <span>{formatTaka(audit.totalCashOutflow)}</span>
              </div>

              {/* Final Hand Cash */}
              <div className="mt-3 pt-2.5 border-t-2 border-slate-300 flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl shadow-md">
                <div>
                  <div className="font-bold text-sm">হাতে বর্তমান ক্যাশ (Cash in Hand)</div>
                  <div className="text-[11px] text-slate-300">ক্যাশ আগমন ({formatTaka(audit.totalCashInflow)}) - ক্যাশ প্রদান ({formatTaka(audit.totalCashOutflow)})</div>
                </div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {formatTaka(audit.netCashInHand)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Profit & Income Math */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2 border-b border-slate-200 pb-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                ২. আজকের লাভ-লোকসান হিসাব
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>মোট বিক্রয় ও সেবা আয়:</span>
                  <span className="font-semibold text-slate-800">{formatTaka(audit.totalSalesAndServicesIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>এমএফএস অর্জিত কমিশন:</span>
                  <span className="font-semibold text-emerald-600">+{formatTaka(audit.mfsCommissionsEarned)}</span>
                </div>
                <div className="flex justify-between">
                  <span>মোট পরিচালন খরচ:</span>
                  <span className="font-semibold text-rose-600">-{formatTaka(audit.totalOperatingExpenses)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>নিট মুনাফা / ব্যালেন্স:</span>
                  <span className={audit.netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatTaka(audit.netOperatingProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2 border-b border-slate-200 pb-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                ৩. বাজার বাকি ও গ্রাহক খাতা
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>মোট বাকিদার খদ্দের:</span>
                  <span className="font-semibold text-slate-800">{audit.activeDueCustomersCount} জন</span>
                </div>
                <div className="flex justify-between">
                  <span>আজকের বাকি আদায়:</span>
                  <span className="font-semibold text-emerald-600">{formatTaka(audit.dueCollectedInCash)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-amber-700">
                  <span>মোট পাওনা বাজার বাকি:</span>
                  <span>{formatTaka(audit.totalPendingCustomerDues)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Stock & Total Liquidity */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2 border-b border-slate-200 pb-1.5">
              <Package className="w-4 h-4 text-purple-600" />
              ৪. স্টক মূল্যায়ন ও দোকানের মোট তরল সম্পদ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-medium">বর্তমান স্টকের ক্রয়মূল্য (ইনভেস্টমেন্ট)</div>
                <div className="text-base font-bold text-slate-900">{formatTaka(audit.totalInventoryPurchaseValue)}</div>
                <div className="text-[11px] text-slate-500">বিক্রয়মূল্য: {formatTaka(audit.totalInventoryRetailValue)} (প্রত্যাশিত লাভ: {formatTaka(audit.inventoryGrossMarginProjected)})</div>
              </div>

              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-medium">এমএফএস ডিজিটাল ব্যালেন্স</div>
                <div className="text-base font-bold text-purple-700">{formatTaka(audit.totalMfsElectronicBalance)}</div>
                <div className="text-[11px] text-slate-500">বিকাশ + নগদ + রকেট এজেন্ট মোট ব্যালেন্স</div>
              </div>
            </div>

            <div className="mt-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  দোকানের মোট চলতি সম্পদ ও তারল্য
                </span>
                <div className="text-[11px] text-emerald-700">
                  ক্যাশ ({formatTaka(audit.netCashInHand)}) + এমএফএস ({formatTaka(audit.totalMfsElectronicBalance)}) + বাজার বাকি ({formatTaka(audit.totalPendingCustomerDues)}) + স্টক ক্রয়মূল্য ({formatTaka(audit.totalInventoryPurchaseValue)})
                </div>
              </div>
              <div className="text-lg font-extrabold text-emerald-900">
                {formatTaka(audit.totalBusinessLiquidAssets)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>সরাসরি সেন্ট্রাল ডাটাবেজ থেকে রিয়েল-টাইম ক্যালকুলেট করা হয়েছে</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
