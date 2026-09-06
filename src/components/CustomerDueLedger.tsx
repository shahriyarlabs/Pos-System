import React, { useState, useMemo } from 'react';
import {
  User,
  Phone,
  MapPin,
  Clock,
  Search,
  Plus,
  CheckCircle,
  Copy,
  MessageSquare,
  DollarSign,
  ArrowRight,
  BookOpen,
  FileText,
  History,
  AlertCircle,
  X,
} from 'lucide-react';
import { Customer, PaymentMethod, Transaction } from '../types';

interface CustomerDueLedgerProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'lastTransactionDate'>) => void;
  onRecordDuePayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => void;
  onOpenReceipt: (transaction: Transaction) => void;
}

export const CustomerDueLedger: React.FC<CustomerDueLedgerProps> = ({
  customers,
  transactions,
  onAddCustomer,
  onRecordDuePayment,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(true);

  // Selected customer for viewing detailed ledger history
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNote, setPaymentNote] = useState('');

  // Add Customer modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Copied message alert state
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);

  // Filter customers (Memoized for smooth typing)
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customers.filter((c) => {
      if (filterDueOnly && c.currentDue <= 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
  }, [customers, searchTerm, filterDueOnly]);

  const { totalOutstandingDue, customersWithDueCount } = useMemo(() => {
    let dueSum = 0;
    let dueCount = 0;
    for (let i = 0; i < customers.length; i++) {
      const d = customers[i].currentDue;
      if (d > 0) {
        dueSum += d;
        dueCount++;
      }
    }
    return {
      totalOutstandingDue: dueSum,
      customersWithDueCount: dueCount,
    };
  }, [customers]);

  // Open Payment modal
  const handleOpenPayment = (customer: Customer) => {
    setPaymentCustomer(customer);
    setPaymentAmount(String(customer.currentDue)); // Default to full due
    setPaymentNote('বকেয়া পরিশোধ');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      alert('সঠিক টাকা লিখুন');
      return;
    }
    if (amt > paymentCustomer.currentDue) {
      if (!confirm(`পরিশোধের পরিমাণ (৳${amt}) বর্তমান বকেয়ার (৳${paymentCustomer.currentDue}) চেয়ে বেশি। আপনি কি এগিয়ে যেতে চান?`)) {
        return;
      }
    }

    onRecordDuePayment(paymentCustomer.id, amt, paymentMethod, paymentNote);
    setIsPaymentModalOpen(false);
    setPaymentCustomer(null);
  };

  // Add new customer submission
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('নাম এবং মোবাইল নম্বর দেওয়া বাধ্যতামূলক');
      return;
    }

    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || undefined,
      notes: newNotes.trim() || undefined,
      currentDue: 0,
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewNotes('');
    setIsAddCustomerOpen(false);
  };

  // Copy Bengali SMS Reminder template
  const handleCopySmsReminder = (customer: Customer) => {
    const message = `শ্রদ্ধেয় ${customer.name}, আসসালামু আলাইকুম। ব্রাদার্স ডিজিটাল সেন্টারে আপনার বর্তমান বকেয়া পাওনা ৳${customer.currentDue.toLocaleString()}। অনুগ্রহ করে বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। ধন্যবাদ। - ব্রাদার্স ডিজিটাল সেন্টার (মোবাইল: ০১৭XX-XXXXXX)`;
    navigator.clipboard.writeText(message);
    setCopiedCustomerId(customer.id);
    setTimeout(() => setCopiedCustomerId(null), 3000);
  };

  // Customer transactions history
  const customerHistory = activeCustomer
    ? transactions.filter(
        (t) =>
          t.customerId === activeCustomer.id ||
          (t.customerPhone && t.customerPhone === activeCustomer.phone)
      )
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Overall Due Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>কাস্টমার বকেয়া খাতা (Customer Due Ledger)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
              বকেয়া খতিয়ান
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            নিয়মিত ও বাকিতে সেবা নেওয়া গ্রাহকদের তালিকা, বাকি আদায় এবং হিসাব খতিয়ান
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl text-right">
            <p className="text-[11px] text-purple-700 font-semibold">সর্বমোট বকেয়া পাওনা</p>
            <p className="text-xl font-black text-purple-900">
              ৳ {totalOutstandingDue.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কাস্টমার যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কাস্টমারের নাম বা ফোন নম্বর খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterDueOnly(true)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterDueOnly
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            শুধু বকেয়া আছে ({customersWithDueCount})
          </button>
          <button
            onClick={() => setFilterDueOnly(false)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              !filterDueOnly
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            সকল কাস্টমার ({customers.length})
          </button>
        </div>
      </div>

      {/* Customers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">কোনো কাস্টমার তথ্য পাওয়া যায়নি</p>
            <p className="text-xs mt-1">অনুসন্ধানের শব্দ পরিবর্তন করুন বা নতুন কাস্টমার যোগ করুন</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const hasDue = customer.currentDue > 0;
            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        hasDue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {hasDue ? `বকেয়া: ৳${customer.currentDue.toLocaleString()}` : 'পরিশোধিত'}
                    </span>
                  </div>

                  {customer.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}

                  {customer.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mb-3">
                      নোট: {customer.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-2.5 rounded-xl text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">মোট বিল</span>
                      <span className="font-bold text-slate-800">
                        ৳ {customer.totalBilled.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">পরিশোধিত অর্থ</span>
                      <span className="font-bold text-emerald-600">
                        ৳ {customer.totalPaid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {hasDue ? (
                      <button
                        onClick={() => handleOpenPayment(customer)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>বাকি আদায় / পরিষদ</span>
                      </button>
                    ) : (
                      <div className="flex-1 text-center py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-500">
                        বকেয়া নেই
                      </div>
                    )}

                    <button
                      onClick={() => setActiveCustomer(customer)}
                      className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      title="বিস্তারিত খতিয়ান দেখুন"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>খতিয়ান</span>
                    </button>
                  </div>

                  {hasDue && (
                    <button
                      onClick={() => handleCopySmsReminder(customer)}
                      className="w-full text-center py-1.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {copiedCustomerId === customer.id ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">মেসেজ কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>তাগাদা মেসেজ কপি করুন (SMS / WhatsApp)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer / Modal for Detailed Customer Ledger History */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{activeCustomer.name} - খতিয়ান খাতা</span>
                </h3>
                <p className="text-xs text-slate-300">
                  মোবাইল: {activeCustomer.phone} • বর্তমান বকেয়া: ৳{activeCustomer.currentDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <div>
                  <p className="text-[11px] text-slate-500">মোট হিসাবকৃত বিল</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    ৳ {activeCustomer.totalBilled.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">পরিশোধিত টাকা</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    ৳ {activeCustomer.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">বর্তমান অবশিষ্ট বকেয়া</p>
                  <p className="text-sm font-black text-rose-600 mt-0.5">
                    ৳ {activeCustomer.currentDue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  লেনদেনের ইতিহাস (Transaction History)
                </h4>
                {customerHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    এই কাস্টমারের কোনো ডিজিটাল লেনদেন রেকর্ড পাওয়া যায়নি।
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customerHistory.map((trx) => (
                      <div
                        key={trx.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-emerald-300 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{trx.categoryLabelBn}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({trx.invoiceNo})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {trx.note || 'ডিজিটাল সার্ভিস'} •{' '}
                            {new Date(trx.timestamp).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              ৳ {trx.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-purple-700 font-semibold">
                              {trx.paymentMethodLabelBn}
                            </span>
                          </div>
                          <button
                            onClick={() => onOpenReceipt(trx)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 rounded-lg text-slate-600 hover:text-emerald-700 transition"
                            title="রসিদ প্রিন্ট করুন"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              {activeCustomer.currentDue > 0 ? (
                <button
                  onClick={() => {
                    handleOpenPayment(activeCustomer);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>এখনই বাকি আদায় রেকর্ড করুন</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700">✓ সমস্ত পাওনা পরিশোধিত</span>
              )}
              <button
                onClick={() => setActiveCustomer(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Due Payment Modal */}
      {isPaymentModalOpen && paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">বকেয়া আদায় গ্রহণ করুন</h3>
                <p className="text-xs text-emerald-100">{paymentCustomer.name}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                <span className="text-emerald-800">মোট বর্তমান বকেয়া:</span>
                <span className="font-bold text-emerald-900 text-sm">
                  ৳ {paymentCustomer.currentDue.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আদায়কৃত টাকার পরিমাণ (Tk) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'নগদ ক্যাশ' },
                    { id: 'BKASH', label: 'বিকাশ' },
                    { id: 'NAGAD', label: 'নগদ MFS' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        paymentMethod === m.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নোট বা মন্তব্য</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="বকেয়া আদায় বা খতিয়ান নোট..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  আদায় সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">নতুন কাস্টমার যোগ করুন</h3>
                <p className="text-xs text-slate-300">Brothers Digital Center Customer Directory</p>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="উদাঃ মোঃ সোহেল রানা"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="উদাঃ 01712-345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ঠিকানা / এলাকা</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="উদাঃ বাজার মসজিদ সংলগ্ন, ওয়ার্ড ৩"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কাস্টমার নোট</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="উদাঃ মাদ্রাসার প্রশ্ন প্রিন্ট করেন, নিয়মিত ক্লায়েন্ট..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
