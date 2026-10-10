import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Plus,
  Clock,
  CheckCircle2,
  DollarSign,
  Send,
  Download,
  X,
  Wallet,
} from 'lucide-react';
import { MFSAccount, MfsProvider, Transaction } from '../types';

interface MobileBankingLedgerProps {
  mfsAccounts: MFSAccount[];
  transactions: Transaction[];
  onProcessMfsTransaction: (params: {
    provider: MfsProvider;
    actionType: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    commission: number;
    customerPhone: string;
    trxId?: string;
  }) => void;
  onUpdateBalance: (accountId: string, newBalance: number) => void;
}

export const MobileBankingLedger: React.FC<MobileBankingLedgerProps> = ({
  mfsAccounts,
  transactions,
  onProcessMfsTransaction,
  onUpdateBalance,
}) => {
  // Modal states
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<MfsProvider>('BKASH');
  const [actionType, setActionType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [amount, setAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [commission, setCommission] = useState('');

  // Balance edit modal
  const [editingAccount, setEditingAccount] = useState<MFSAccount | null>(null);
  const [customBalance, setCustomBalance] = useState('');

  const { totalWalletBalance, totalCommissionToday } = useMemo(() => {
    let balance = 0;
    let commission = 0;
    for (let i = 0; i < mfsAccounts.length; i++) {
      balance += mfsAccounts[i].balance;
      commission += mfsAccounts[i].commissionEarnedToday;
    }
    return { totalWalletBalance: balance, totalCommissionToday: commission };
  }, [mfsAccounts]);

  // Auto calculate default agent commission (usually ~4-5 Tk per 1000 Tk cashout)
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = Number(val);
    if (num > 0) {
      if (actionType === 'CASH_OUT') {
        const estFee = Math.round((num / 1000) * 4); // Tk 4 per thousand for agent
        setCommission(String(Math.max(5, estFee)));
      } else {
        const estFee = Math.round((num / 1000) * 2);
        setCommission(String(Math.max(0, estFee)));
      }
    }
  };

  const handleOpenAction = (provider: MfsProvider, type: 'CASH_IN' | 'CASH_OUT') => {
    setSelectedProvider(provider);
    setActionType(type);
    setAmount('');
    setCommission(type === 'CASH_OUT' ? '10' : '5');
    setCustomerPhone('');
    setTrxId('');
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('সঠিক টাকার পরিমাণ প্রদান করুন');
      return;
    }
    if (!customerPhone.trim()) {
      alert('গ্রাহকের মোবাইল নম্বর দেওয়া আবশ্যক');
      return;
    }

    const numCommission = Number(commission) || 0;

    onProcessMfsTransaction({
      provider: selectedProvider,
      actionType,
      amount: numAmount,
      commission: numCommission,
      customerPhone: customerPhone.trim(),
      trxId: trxId.trim() || undefined,
    });

    setIsActionModalOpen(false);
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const newBal = Number(customBalance);
    if (isNaN(newBal) || newBal < 0) {
      alert('সঠিক ব্যালেন্স লিখুন');
      return;
    }
    onUpdateBalance(editingAccount.id, newBal);
    setEditingAccount(null);
  };

  // Filter MFS related transactions
  const mfsTransactions = transactions.filter(
    (t) =>
      t.category === 'mfs_fee' ||
      t.paymentMethod === 'BKASH' ||
      t.paymentMethod === 'NAGAD' ||
      t.paymentMethod === 'ROCKET'
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>মোবাইল ব্যাংকিং ও ক্যাশ ম্যানেজমেন্ট (MFS Agent Banking)</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              বিকাশ • নগদ • রকেট
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            এজেন্ট ওয়ালেট ব্যালেন্স ট্র্যাকিং, ক্যাশ-ইন / ক্যাশ-আউট প্রবাহ এবং উপার্জিত কমিশন হিসাব
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <p className="text-[11px] text-emerald-700 font-semibold">আজকের মোট কমিশন আয়</p>
            <p className="text-xl font-black text-emerald-900">
              ৳ {totalCommissionToday.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-right">
            <p className="text-[11px] text-slate-400 font-semibold">মোট ওয়ালেট ব্যালেন্স</p>
            <p className="text-xl font-black text-amber-400">
              ৳ {totalWalletBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 3 MFS Provider Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {mfsAccounts.map((account) => {
          const isBkash = account.provider === 'BKASH';
          const isNagad = account.provider === 'NAGAD';
          const isRocket = account.provider === 'ROCKET';

          return (
            <div
              key={account.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between relative overflow-hidden"
            >
              {/* Colored top accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: account.color }}
              ></div>

              <div>
                <div className="flex items-center justify-between mt-1 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold text-sm shadow-xs"
                      style={{ backgroundColor: account.color }}
                    >
                      {isBkash ? 'বিকাশ' : isNagad ? 'নগদ' : 'রকেট'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{account.accountName}</h3>
                      <p className="text-xs text-slate-500 font-mono">এজেন্ট: {account.agentNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setCustomBalance(String(account.balance));
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium"
                  >
                    ব্যালেন্স সমন্বয়
                  </button>
                </div>

                {/* Wallet Balance Display */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    বর্তমান ই-মানি ওয়ালেট ব্যালেন্স:
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    ৳ {account.balance.toLocaleString()}
                  </span>
                </div>

                {/* Flow Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-semibold">
                      আজকের ক্যাশ-আউট
                    </span>
                    <span className="font-black text-emerald-800">
                      ৳ {account.cashOutToday.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                    <span className="text-blue-700 block text-[10px] font-semibold">
                      আজকের ক্যাশ-ইন
                    </span>
                    <span className="font-black text-blue-800">
                      ৳ {account.cashInToday.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenAction(account.provider, 'CASH_OUT')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ক্যাশ-আউট (Cash Out)</span>
                  </button>
                  <button
                    onClick={() => handleOpenAction(account.provider, 'CASH_IN')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ক্যাশ-ইন (Cash In)</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>আজকের কমিশন:</span>
                  <span className="font-bold text-emerald-700">
                    ৳ {account.commissionEarnedToday.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MFS Flow Logic Informational Card */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">ক্যাশ-আউট হিসাবের নিয়ম (Cash-Out Flow):</h4>
            <p className="text-slate-600 mt-0.5">
              কাস্টমার দোকানে এসে এজেন্টের নম্বরে টাকা পাঠালে এজেন্ট ওয়ালেটে ব্যালেন্স বৃদ্ধি পায় এবং
              দোকানের ক্যাশ ড্রয়ার থেকে কাস্টমারকে নগদ টাকা দেওয়া হয়।
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">ক্যাশ-ইন হিসাবের নিয়ম (Cash-In Flow):</h4>
            <p className="text-slate-600 mt-0.5">
              কাস্টমার নিজের একাউন্টে টাকা পাঠানোর জন্য দোকানে নগদ টাকা দেয় (ক্যাশ বাড়ে) এবং এজেন্ট
              নিজের ওয়ালেট থেকে কাস্টমারকে ই-মানি ট্রান্সফার করে (ওয়ালেট কমে)।
            </p>
          </div>
        </div>
      </div>

      {/* MFS Transactions Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>মোবাইল ব্যাংকিং ও ডিজিটাল পেমেন্ট লেনদেনসমূহ</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            মোট {mfsTransactions.length}টি লেনদেন
          </span>
        </div>

        {mfsTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            এখনও কোনো মোবাইল ব্যাংকিং লেনদেন এন্ট্রি করা হয়নি।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">চালান ও সময়</th>
                  <th className="py-2.5 px-3">মাধ্যম (Provider)</th>
                  <th className="py-2.5 px-3">গ্রাহক / মোবাইল</th>
                  <th className="py-2.5 px-3">বিবরণ / নোট</th>
                  <th className="py-2.5 px-3 text-right">টাকা (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mfsTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-700">{t.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(t.timestamp).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold text-white ${
                          t.paymentMethod === 'BKASH'
                            ? 'bg-[#E2136E]'
                            : t.paymentMethod === 'NAGAD'
                            ? 'bg-[#F7941D]'
                            : 'bg-[#8C3494]'
                        }`}
                      >
                        {t.paymentMethodLabelBn}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {t.customerName || 'সরাসরি কাস্টমার'}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.customerPhone || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.note || t.categoryLabelBn}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-900 text-sm">
                        ৳ {t.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cash In / Cash Out Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="text-white p-5 flex items-center justify-between"
              style={{
                backgroundColor:
                  selectedProvider === 'BKASH'
                    ? '#E2136E'
                    : selectedProvider === 'NAGAD'
                    ? '#F7941D'
                    : '#8C3494',
              }}
            >
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedProvider === 'BKASH'
                    ? 'বিকাশ'
                    : selectedProvider === 'NAGAD'
                    ? 'নগদ'
                    : 'রকেট'}{' '}
                  {actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'}
                </h3>
                <p className="text-xs text-white/80">এজেন্ট ট্রানজেকশন এন্ট্রি</p>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAction} className="p-5 space-y-3.5">
              {/* Action type switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType('CASH_OUT')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    actionType === 'CASH_OUT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  ক্যাশ-আউট (ক্যাশ প্রদান)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('CASH_IN')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    actionType === 'CASH_IN'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  ক্যাশ-ইন (ই-মানি প্রেরণ)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টাকার পরিমাণ (Amount ৳) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="উদাঃ ২০০০"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কাস্টমারের মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017... বা 019..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কমিশন আয় (৳)
                  </label>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="১০"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="উদাঃ 9H8K2L..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  লেনদেন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Adjust Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingAccount.accountName} - ব্যালেন্স সমন্বয়
            </h3>
            <form onSubmit={handleSaveBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সঠিক ওয়ালেট ব্যালেন্স (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customBalance}
                  onChange={(e) => setCustomBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-base"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  হালনাগাদ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
