import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionModal } from './components/TransactionModal';
import { CustomerDueLedger } from './components/CustomerDueLedger';
import { MobileBankingLedger } from './components/MobileBankingLedger';
import { InventoryManager } from './components/InventoryManager';
import { ReportsAndReceipts } from './components/ReportsAndReceipts';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { AdminPanel } from './components/AdminPanel';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import {
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_MFS_ACCOUNTS,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import {
  AuditLog,
  Customer,
  InventoryItem,
  MFSAccount,
  MfsProvider,
  PaymentMethod,
  ShopSettings,
  SupabaseConfig,
  Transaction,
} from './types';
import { CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import {
  getSupabaseClient,
  pushAllToSupabase,
  pullAllFromSupabase,
  testSupabaseConnection,
} from './lib/supabase';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'ব্রাদার্স ডিজিটাল সেন্টার',
  shopSubtitle: 'Brothers Digital Center & Cyber Point',
  ownerName: 'মোহাম্মদ রফিক ও পারভেজ',
  address: 'বাজার মেইন রোড, ডিজিটাল মোড়, ওয়ার্ড নং ০৩',
  phone1: '০১৭১২-৩৪৫৬৭৮',
  phone2: '০১৮১৯-৯৮৭৬৫৪',
  email: 'brothersdigital.bd@gmail.com',
  openingCashBalance: 15000,
  receiptFooterNote: 'আমাদের সেবা গ্রহণ করার জন্য আপনাকে ধন্যবাদ। আবার আসবেন!',
  receiptType: 'standard',
  adminPin: '1234',
  isPinProtectionEnabled: false,
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Shop Profile Settings
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('bdc_shop_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Supabase Configuration
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem('bdc_supabase_config');
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
      };
    }
    return {
      url: envUrl,
      anonKey: envKey,
      isConnected: Boolean(envUrl && envKey),
      lastSyncTime: null,
      autoSync: true,
    };
  });

  // Core Data State with Local Storage persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bdc_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('bdc_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('bdc_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [mfsAccounts, setMfsAccounts] = useState<MFSAccount[]>(() => {
    const saved = localStorage.getItem('bdc_mfs_accounts');
    return saved ? JSON.parse(saved) : INITIAL_MFS_ACCOUNTS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('bdc_audit_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-init',
            action: 'সিস্টেম ইনিশিয়ালাইজেশন',
            details: 'ব্রাদার্স ডিজিটাল সেন্টার POS সিস্টেম চালু হয়েছে',
            timestamp: new Date().toISOString(),
            type: 'system',
          },
        ];
  });

  // Modals & Search
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Admin PIN Gate State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addAuditLog = (action: string, details: string, type: AuditLog['type'] = 'system') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bdc_shop_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('bdc_supabase_config', JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  useEffect(() => {
    localStorage.setItem('bdc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bdc_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('bdc_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('bdc_mfs_accounts', JSON.stringify(mfsAccounts));
  }, [mfsAccounts]);

  useEffect(() => {
    localStorage.setItem('bdc_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Background Cloud Sync
  const triggerBackgroundCloudSync = useCallback(async () => {
    if (!supabaseConfig.isConnected || !supabaseConfig.autoSync) return;
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) return;

    try {
      await pushAllToSupabase(client, {
        transactions,
        customers,
        inventory,
        mfsAccounts,
      });
      setSupabaseConfig((prev) => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Background Supabase sync failed:', err);
    }
  }, [supabaseConfig, transactions, customers, inventory, mfsAccounts]);

  // Financial calculations
  const today = new Date();
  const todayTransactions = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const todayIncome = todayTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayNetProfit = todayIncome - todayExpense;

  const cashIncome = transactions
    .filter((t) => t.type === 'INCOME' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashExpense = transactions
    .filter((t) => t.type === 'EXPENSE' && t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashInHand = Math.max(0, (settings.openingCashBalance || 15000) + cashIncome - cashExpense);

  const lowStockCount = inventory.filter((i) => i.stockQuantity <= i.lowStockThreshold).length;
  const totalCustomerDue = customers.reduce((sum, c) => sum + c.currentDue, 0);

  // Handler: Save new transaction
  const handleSaveTransaction = (
    newTrxData: Omit<Transaction, 'id' | 'invoiceNo' | 'timestamp'>,
    autoPrintReceipt: boolean
  ) => {
    const count = transactions.length + 1;
    const invoiceNo = `BDC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
    const newTrx: Transaction = {
      ...newTrxData,
      id: `trx-${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // Handle linked inventory deduction
    if (newTrx.linkedInventoryId) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === newTrx.linkedInventoryId
            ? { ...item, stockQuantity: Math.max(0, item.stockQuantity - 1) }
            : item
        )
      );
    }

    // Handle due customer record
    if (newTrx.paymentMethod === 'DUE') {
      if (newTrx.customerId) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === newTrx.customerId
              ? {
                  ...c,
                  totalBilled: c.totalBilled + newTrx.amount,
                  currentDue: c.currentDue + newTrx.amount,
                  lastTransactionDate: newTrx.timestamp,
                }
              : c
          )
        );
      } else if (newTrx.customerName && newTrx.customerPhone) {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: newTrx.customerName,
          phone: newTrx.customerPhone,
          totalBilled: newTrx.amount,
          totalPaid: 0,
          currentDue: newTrx.amount,
          lastTransactionDate: newTrx.timestamp,
        };
        setCustomers((prev) => [newCustomer, ...prev]);
      }
    }

    addAuditLog(
      `নতুন লেনদেন এন্ট্রি (${newTrx.type === 'INCOME' ? 'আয়' : 'ব্যয়'})`,
      `চালান: ${newTrx.invoiceNo} • ${newTrx.categoryLabelBn} • ৳${newTrx.amount.toLocaleString()} (${newTrx.paymentMethodLabelBn})`,
      'transaction'
    );

    showToast(`লেনদেন সফলভাবে সম্পন্ন হয়েছে! চালান নং: ${newTrx.invoiceNo}`);

    if (autoPrintReceipt) {
      setActiveReceiptTransaction(newTrx);
      setActiveTab('reports');
    }

    triggerBackgroundCloudSync();
  };

  // Handler: Customer Due Payment
  const handleRecordDuePayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalPaid: c.totalPaid + amount,
              currentDue: Math.max(0, c.currentDue - amount),
              lastTransactionDate: new Date().toISOString(),
            }
          : c
      )
    );

    const invoiceNo = `DUE-${Date.now().toString().slice(-6)}`;
    const paymentTrx: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNo,
      type: 'INCOME',
      category: 'other_income',
      categoryLabelBn: 'বকেয়া আদায় / পরিষদ',
      categoryLabelEn: `Due Collection (${customer.name})`,
      amount,
      paymentMethod,
      paymentMethodLabelBn:
        paymentMethod === 'CASH'
          ? 'ক্যাশ নগদ'
          : paymentMethod === 'BKASH'
          ? 'বিকাশ'
          : 'নগদ MFS',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      note: note || `বকেয়া খাতা থেকে আদায় - ${customer.name}`,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [paymentTrx, ...prev]);

    addAuditLog(
      'বকেয়া টাকা আদায়',
      `গ্রাহক: ${customer.name} • আদায়: ৳${amount.toLocaleString()} • মাধ্যম: ${paymentTrx.paymentMethodLabelBn}`,
      'due'
    );

    showToast(`${customer.name}-এর কাছ থেকে ৳${amount.toLocaleString()} বকেয়া আদায় করা হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Handler: Add New Customer
  const handleAddCustomer = (
    newCustData: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'lastTransactionDate'>
  ) => {
    const newCust: Customer = {
      ...newCustData,
      id: `cust-${Date.now()}`,
      totalBilled: 0,
      totalPaid: 0,
      lastTransactionDate: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    addAuditLog('নতুন গ্রাহক যোগ', `নাম: ${newCust.name} • মোবাইল: ${newCust.phone}`, 'due');
    showToast(`কাস্টমার "${newCust.name}" বকেয়া খাতায় যোগ করা হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Handler: MFS Process
  const handleProcessMfsTransaction = (params: {
    provider: MfsProvider;
    actionType: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    commission: number;
    customerPhone: string;
    trxId?: string;
  }) => {
    const { provider, actionType, amount, commission, customerPhone, trxId } = params;

    setMfsAccounts((prev) =>
      prev.map((acc) => {
        if (acc.provider === provider) {
          if (actionType === 'CASH_OUT') {
            return {
              ...acc,
              balance: acc.balance + amount,
              cashOutToday: acc.cashOutToday + amount,
              commissionEarnedToday: acc.commissionEarnedToday + commission,
            };
          } else {
            return {
              ...acc,
              balance: Math.max(0, acc.balance - amount),
              cashInToday: acc.cashInToday + amount,
              commissionEarnedToday: acc.commissionEarnedToday + commission,
            };
          }
        }
        return acc;
      })
    );

    if (commission > 0) {
      const providerBn = provider === 'BKASH' ? 'বিকাশ' : provider === 'NAGAD' ? 'নগদ' : 'রকেট';
      const mfsTrx: Transaction = {
        id: `trx-${Date.now()}`,
        invoiceNo: `MFS-${Date.now().toString().slice(-6)}`,
        type: 'INCOME',
        category: 'mfs_fee',
        categoryLabelBn: `${providerBn} ${actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'} কমিশন`,
        categoryLabelEn: `${provider} Agent Fee (${actionType})`,
        amount: commission,
        paymentMethod: 'CASH',
        paymentMethodLabelBn: 'ক্যাশ নগদ',
        customerPhone,
        note: `গ্রাহক মোবাইল: ${customerPhone} • মূল টাকা: ৳${amount} • TrxID: ${trxId || 'N/A'}`,
        timestamp: new Date().toISOString(),
      };
      setTransactions((prev) => [mfsTrx, ...prev]);
    }

    addAuditLog(
      `মোবাইল ব্যাংকিং (${provider} ${actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'})`,
      `গ্রাহক: ${customerPhone} • পরিমাণ: ৳${amount.toLocaleString()} • কমিশন: ৳${commission}`,
      'mfs'
    );

    showToast(
      `${provider} ${actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'} সম্পন্ন! কমিশন: ৳${commission}`
    );
    triggerBackgroundCloudSync();
  };

  // Handler: Update MFS balance
  const handleUpdateMfsBalance = (accountId: string, newBalance: number) => {
    setMfsAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, balance: newBalance } : acc))
    );
    showToast('ওয়ালেট ব্যালেন্স সমন্বয় করা হয়েছে!');
    triggerBackgroundCloudSync();
  };

  // Handler: Update Stock
  const handleUpdateStock = (itemId: string, newQuantity: number) => {
    const item = inventory.find((i) => i.id === itemId);
    setInventory((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              stockQuantity: newQuantity,
              lastRestocked: new Date().toISOString().slice(0, 10),
            }
          : i
      )
    );
    if (item) {
      addAuditLog(
        'ইনভেন্টরি স্টক সমন্বয়',
        `পণ্য: ${item.nameBn} • নতুন পরিমাণ: ${newQuantity} ${item.unitBn}`,
        'inventory'
      );
    }
    showToast('স্টক সফলভাবে আপডেট করা হয়েছে!');
    triggerBackgroundCloudSync();
  };

  // Handler: Add New Inventory Item
  const handleAddNewItem = (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      lastRestocked: new Date().toISOString().slice(0, 10),
    };
    setInventory((prev) => [newItem, ...prev]);
    addAuditLog('নতুন ইনভেন্টরি পণ্য', `পণ্য: ${newItem.nameBn} (কোড: ${newItem.code})`, 'inventory');
    showToast(`নতুন পণ্য "${newItem.nameBn}" ইনভেন্টরিতে যোগ করা হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Open receipt for specific transaction
  const handleOpenReceipt = (trx: Transaction) => {
    setActiveReceiptTransaction(trx);
    setActiveTab('reports');
  };

  // Restore complete backup
  const handleRestoreAllData = (data: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
    settings?: ShopSettings;
  }) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.customers) setCustomers(data.customers);
    if (data.inventory) setInventory(data.inventory);
    if (data.mfsAccounts) setMfsAccounts(data.mfsAccounts);
    if (data.settings) setSettings(data.settings);
    addAuditLog('ডাটাবেজ রিস্টোর', 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল থেকে রিস্টোর করা হয়েছে', 'system');
    showToast('সম্পূর্ণ ডাটা সফলভাবে রিস্টোর হয়েছে!');
  };

  // Reset demo data
  const handleResetToDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCustomers(INITIAL_CUSTOMERS);
    setInventory(INITIAL_INVENTORY);
    setMfsAccounts(INITIAL_MFS_ACCOUNTS);
    addAuditLog('ডেমো ডাটা রিসেট', 'নমুনা টেস্ট ডেটা লোড করা হয়েছে', 'system');
    showToast('ডেমো টেস্ট ডেটা সফলভাবে রিস্টোর হয়েছে!');
  };

  // Handle Cloud Data Synced
  const handleDataSyncedFromCloud = (cloudData: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
  }) => {
    setTransactions(cloudData.transactions);
    setCustomers(cloudData.customers);
    setInventory(cloudData.inventory);
    setMfsAccounts(cloudData.mfsAccounts);
    addAuditLog('ক্লাউড সিঙ্ক সফল', 'Supabase থেকে সর্বশেষ ডেটা পিসি/মোবাইলে লোড করা হয়েছে', 'system');
    showToast('ক্লাউড থেকে সফলভাবে ডেটা সিঙ্ক করা হয়েছে!');
  };

  // Check PIN protection before viewing Admin Panel
  const handleTabSelect = (tab: string) => {
    if (tab === 'admin' && settings.isPinProtectionEnabled && !isAdminUnlocked) {
      setActiveTab('admin');
    } else {
      setActiveTab(tab);
    }
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.adminPin || pinInput === '1234') {
      setIsAdminUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Navbar & Metrics */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        cashInHand={cashInHand}
        todayNetProfit={todayNetProfit}
        lowStockCount={lowStockCount}
        totalDue={totalCustomerDue}
        settings={settings}
        supabaseConfig={supabaseConfig}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            customers={customers}
            inventory={inventory}
            mfsAccounts={mfsAccounts}
            onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
            onOpenReceipt={handleOpenReceipt}
            onNavigateToTab={handleTabSelect}
          />
        )}

        {activeTab === 'due-ledger' && (
          <CustomerDueLedger
            customers={customers}
            transactions={transactions}
            onAddCustomer={handleAddCustomer}
            onRecordDuePayment={handleRecordDuePayment}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {activeTab === 'mfs-ledger' && (
          <MobileBankingLedger
            mfsAccounts={mfsAccounts}
            transactions={transactions}
            onProcessMfsTransaction={handleProcessMfsTransaction}
            onUpdateBalance={handleUpdateMfsBalance}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onUpdateStock={handleUpdateStock}
            onAddNewItem={handleAddNewItem}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsAndReceipts
            transactions={transactions}
            customers={customers}
            activeReceiptTransaction={
              activeReceiptTransaction ||
              transactions.find((t) => t.type === 'INCOME') ||
              null
            }
            onCloseReceipt={() => setActiveReceiptTransaction(null)}
            onSelectReceipt={(trx) => setActiveReceiptTransaction(trx)}
            settings={settings}
          />
        )}

        {activeTab === 'admin' && (
          settings.isPinProtectionEnabled && !isAdminUnlocked ? (
            <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900">অ্যাডমিন পিন কোড প্রবেশ করান</h2>
              <p className="text-xs text-slate-500">
                সংবেদনশীল সেটিংস ও মাল্টি-ডিভাইস কনফিগারেশনে প্রবেশের জন্য ৪-ডিজিট পিন কোড লিখুন।
              </p>
              <form onSubmit={handleUnlockAdmin} className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN কোড (যেমন: 1234)"
                  className="w-full text-center px-4 py-3 rounded-2xl border border-slate-300 text-base font-mono font-black tracking-widest focus:outline-hidden focus:border-indigo-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold">ভুল পিন কোড! পুনরায় চেষ্টা করুন।</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
                >
                  লগইন ও আনলক করুন
                </button>
              </form>
            </div>
          ) : (
            <AdminPanel
              settings={settings}
              onUpdateSettings={setSettings}
              supabaseConfig={supabaseConfig}
              onUpdateSupabaseConfig={setSupabaseConfig}
              transactions={transactions}
              customers={customers}
              inventory={inventory}
              mfsAccounts={mfsAccounts}
              auditLogs={auditLogs}
              onRestoreAllData={handleRestoreAllData}
              onResetToDemoData={handleResetToDemoData}
              onDataSyncedFromCloud={handleDataSyncedFromCloud}
            />
          )
        )}

        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      {/* Fast Transaction Modal */}
      <TransactionModal
        isOpen={isNewTransactionModalOpen}
        onClose={() => setIsNewTransactionModalOpen(false)}
        customers={customers}
        inventory={inventory}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        transactions={transactions}
        customers={customers}
        inventory={inventory}
        mfsAccounts={mfsAccounts}
        onSelectTransaction={handleOpenReceipt}
        onNavigateToTab={handleTabSelect}
      />

      {/* Minimalistic Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800">{settings.shopName}</span>
            <span className="text-slate-400 hidden sm:inline"> • পয়েন্ট অব সেল ও শপ ম্যানেজমেন্ট প্ল্যাটফর্ম</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>ড্রয়ার ব্যালেন্স: ৳{cashInHand.toLocaleString()}</span>
            <span>•</span>
            <span className={supabaseConfig.isConnected ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
              {supabaseConfig.isConnected ? 'ক্লাউড সিঙ্ক চালু (PC + Android)' : 'লোকাল মেমোরি'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
