import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Copy,
  Printer,
  FileText,
  Camera,
  Layers,
  Smartphone,
  ShoppingBag,
  Wrench,
  Coffee,
  Zap,
  Home,
  Wifi,
  PackageCheck,
  UserCheck,
} from 'lucide-react';
import { Customer, InventoryItem, PaymentMethod, ServiceCategory, ExpenseCategory, Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  inventory: InventoryItem[];
  onSaveTransaction: (
    newTrx: Omit<Transaction, 'id' | 'invoiceNo' | 'timestamp'>,
    autoPrintReceipt: boolean
  ) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  inventory,
  onSaveTransaction,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [selectedCategory, setSelectedCategory] = useState<string>('photocopy');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [inventoryQty, setInventoryQty] = useState<number>(1);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(false);

  // Predefined service categories for Brothers Digital Center
  const incomeServices: {
    id: ServiceCategory;
    nameBn: string;
    nameEn: string;
    icon: React.ElementType;
    defaultPrice?: number;
  }[] = [
    { id: 'photocopy', nameBn: 'ফটোকপি / ফটোরূপ', nameEn: 'Photocopy (Xerox)', icon: Copy, defaultPrice: 50 },
    { id: 'print_bw', nameBn: 'কম্পিউটার প্রিন্ট (B&W)', nameEn: 'B&W Printout', icon: Printer, defaultPrice: 60 },
    { id: 'print_color', nameBn: 'কালার ফটো ও ডকুমেন্ট প্রিন্ট', nameEn: 'Color Print / Studio', icon: Printer, defaultPrice: 120 },
    { id: 'online_form', nameBn: 'পাসপোর্ট / এনআইডি / আবেদন', nameEn: 'Online Form / Govt Application', icon: FileText, defaultPrice: 350 },
    { id: 'photo_studio', nameBn: 'স্টুডিও ছবি তোলা ও ল্যাব', nameEn: 'Studio Portrait & Stamp', icon: Camera, defaultPrice: 200 },
    { id: 'laminating', nameBn: 'লেমিনেশন সার্ভিস', nameEn: 'Lamination', icon: Layers, defaultPrice: 60 },
    { id: 'mfs_fee', nameBn: 'বিকাশ / নগদ এজেন্ট ফি', nameEn: 'MFS Commission / Cash-out Fee', icon: Smartphone, defaultPrice: 40 },
    { id: 'product_sale', nameBn: 'স্টেশনারি পণ্য বিক্রি', nameEn: 'Stationery & Accessories', icon: ShoppingBag },
    { id: 'other_income', nameBn: 'অন্যান্য ডিজিটাল আয়', nameEn: 'Other Income', icon: PlusCircle },
  ];

  // Predefined expense categories
  const expenseCategories: {
    id: ExpenseCategory;
    nameBn: string;
    nameEn: string;
    icon: React.ElementType;
  }[] = [
    { id: 'supplies', nameBn: 'কাগজ, কালি ও মালামাল ক্রয়', nameEn: 'Paper & Toner Refills', icon: ShoppingBag },
    { id: 'shop_rent', nameBn: 'দোকান ভাড়া', nameEn: 'Shop Rent', icon: Home },
    { id: 'electricity_bill', nameBn: 'বিদ্যুৎ বিল', nameEn: 'Electricity Bill', icon: Zap },
    { id: 'internet_bill', nameBn: 'ইন্টারনেট বিল (WiFi)', nameEn: 'Internet Bill', icon: Wifi },
    { id: 'tea_snacks', nameBn: 'নাস্তা ও আপ্যায়ন', nameEn: 'Tea & Snacks', icon: Coffee },
    { id: 'maintenance', nameBn: 'মেশিন ও প্রিন্টার মেরামত', nameEn: 'Printer Repair & Service', icon: Wrench },
    { id: 'other_expense', nameBn: 'অন্যান্য দোকান খরচ', nameEn: 'Other Shop Expense', icon: PlusCircle },
  ];

  // Handle service category selection
  const handleSelectService = (srvId: string, defaultPrice?: number) => {
    setSelectedCategory(srvId);
    if (defaultPrice && !amount) {
      setAmount(String(defaultPrice));
    }
  };

  // Handle inventory product selection
  const handleInventorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invId = e.target.value;
    setSelectedInventoryId(invId);
    const item = inventory.find((i) => i.id === invId);
    if (item) {
      const calculatedTotal = item.sellingPrice * inventoryQty;
      setAmount(String(calculatedTotal));
      if (!note) {
        setNote(`${item.nameBn} (${inventoryQty} ${item.unitBn})`);
      }
    }
  };

  // Handle customer auto-fill from existing database
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
    }
  };

  // Quick amount addition buttons
  const addQuickAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ প্রদান করুন (Please enter a valid amount)');
      return;
    }

    if (paymentMethod === 'DUE' && !customerName.trim()) {
      alert('বকেয়া লেনদেনের জন্য কাস্টমারের নাম প্রদান করা আবশ্যক (Customer name is required for Due)');
      return;
    }

    let categoryLabelBn = '';
    let categoryLabelEn = '';

    if (type === 'INCOME') {
      const srv = incomeServices.find((s) => s.id === selectedCategory);
      categoryLabelBn = srv?.nameBn || 'ডিজিটাল সেবা';
      categoryLabelEn = srv?.nameEn || 'Digital Service';
    } else {
      const exp = expenseCategories.find((e) => e.id === selectedCategory);
      categoryLabelBn = exp?.nameBn || 'দোকান খরচ';
      categoryLabelEn = exp?.nameEn || 'Shop Expense';
    }

    const paymentMethodLabelBnMap: Record<PaymentMethod, string> = {
      CASH: 'ক্যাশ নগদ',
      BKASH: 'বিকাশ (bKash)',
      NAGAD: 'নগদ (Nagad)',
      ROCKET: 'রকেট (Rocket)',
      DUE: 'বকেয়া (Due)',
    };

    onSaveTransaction(
      {
        type,
        category: selectedCategory as any,
        categoryLabelBn,
        categoryLabelEn,
        amount: numAmount,
        paymentMethod,
        paymentMethodLabelBn: paymentMethodLabelBnMap[paymentMethod],
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerId: selectedCustomerId || undefined,
        linkedInventoryId: selectedInventoryId || undefined,
        note: note.trim() || undefined,
      },
      autoPrintReceipt
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              BDC
            </div>
            <div>
              <h3 className="text-base font-bold text-white">নতুন হিসাব যুক্ত করুন</h3>
              <p className="text-xs text-slate-300">
                Brothers Digital Center • Record Daily Income or Expense
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setSelectedCategory('photocopy');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>+ আয় / জমা (Income)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setSelectedCategory('supplies');
                setPaymentMethod('CASH');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-rose-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>- ব্যয় / খরচ (Expense)</span>
            </button>
          </div>

          {/* Service Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {type === 'INCOME'
                ? 'সেবার ধরন নির্বাচন করুন (Select Service Category)'
                : 'খরচের খাত নির্বাচন করুন (Select Expense Category)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
              {type === 'INCOME'
                ? incomeServices.map((srv) => {
                    const Icon = srv.icon;
                    const isSelected = selectedCategory === srv.id;
                    return (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => handleSelectService(srv.id, srv.defaultPrice)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                          isSelected
                            ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-white/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{srv.nameBn}</p>
                          <p className="text-[10px] text-slate-400 truncate">{srv.nameEn}</p>
                        </div>
                      </button>
                    );
                  })
                : expenseCategories.map((exp) => {
                    const Icon = exp.icon;
                    const isSelected = selectedCategory === exp.id;
                    return (
                      <button
                        type="button"
                        key={exp.id}
                        onClick={() => setSelectedCategory(exp.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                          isSelected
                            ? 'bg-white border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                            : 'bg-white/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{exp.nameBn}</p>
                          <p className="text-[10px] text-slate-400 truncate">{exp.nameEn}</p>
                        </div>
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Conditional: If Product Sale is selected, link to Inventory */}
          {type === 'INCOME' && selectedCategory === 'product_sale' && (
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-emerald-900">
                স্টক থেকে পণ্য নির্বাচন করুন (Select Product to Deduct from Inventory)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={selectedInventoryId}
                  onChange={handleInventorySelect}
                  className="sm:col-span-2 px-3 py-2 border border-emerald-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- স্টক পণ্য পছন্দ করুন --</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameBn} (মজুদ: {item.stockQuantity} {item.unitBn} - ৳{item.sellingPrice})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">পরিমাণ:</span>
                  <input
                    type="number"
                    min="1"
                    value={inventoryQty}
                    onChange={(e) => {
                      const q = Math.max(1, Number(e.target.value));
                      setInventoryQty(q);
                      const item = inventory.find((i) => i.id === selectedInventoryId);
                      if (item) {
                        setAmount(String(item.sellingPrice * q));
                      }
                    }}
                    className="w-16 px-2 py-2 border border-emerald-300 rounded-xl text-xs font-bold text-center bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Amount & Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                টাকার পরিমাণ (Amount in ৳ BDT) *
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">কুইক এড:</span>
                {[50, 100, 200, 500, 1000].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => addQuickAmount(val)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] transition"
                  >
                    +৳{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ৳
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              পেমেন্ট মাধ্যম (Payment Method) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'CASH', labelBn: 'নগদ ক্যাশ', labelEn: 'Cash', color: 'emerald' },
                { id: 'BKASH', labelBn: 'বিকাশ', labelEn: 'bKash', color: 'pink' },
                { id: 'NAGAD', labelBn: 'নগদ', labelEn: 'Nagad', color: 'amber' },
                { id: 'ROCKET', labelBn: 'রকেট', labelEn: 'Rocket', color: 'purple' },
                ...(type === 'INCOME'
                  ? [{ id: 'DUE', labelBn: 'বকেয়া (বাকি)', labelEn: 'Due / Credit', color: 'rose' }]
                  : []),
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    type="button"
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`py-2 px-2 rounded-xl border text-center transition ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{pm.labelBn}</p>
                    <p className="text-[10px] opacity-70">{pm.labelEn}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Details Section (Required if payment method is DUE) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>
                  কাস্টমার তথ্য (Customer Information){' '}
                  {paymentMethod === 'DUE' && (
                    <span className="text-rose-600 font-bold">*বকেয়ার জন্য আবশ্যক</span>
                  )}
                </span>
              </label>

              {/* Fast Pick from Existing Customers */}
              <select
                onChange={handleCustomerSelect}
                value={selectedCustomerId}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700"
              >
                <option value="">-- নিয়মিত কাস্টমার তালিকা --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - বকেয়া: ৳{c.currentDue}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="কাস্টমারের নাম (Customer Name)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required={paymentMethod === 'DUE'}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="মোবাইল নম্বর (Phone 017...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              কাজের বিস্তারিত বা নোট (Note / Description)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="উদাঃ ৫০ কপি লিগ্যাল ফটোকপি, ই-পাসপোর্ট ফরম ইত্যাদি..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Auto Print Receipt Toggle (Only for Income) */}
          {type === 'INCOME' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoPrintReceipt"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label
                htmlFor="autoPrintReceipt"
                className="text-xs text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>সংরক্ষণের পর তাৎক্ষণিক ক্যাশ মেমো / রসিদ প্রিন্ট করুন</span>
              </label>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow transition transform active:scale-95 ${
                type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {type === 'INCOME' ? 'আয় সংরক্ষণ করুন (Save Income)' : 'খরচ সংরক্ষণ করুন (Save Expense)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
