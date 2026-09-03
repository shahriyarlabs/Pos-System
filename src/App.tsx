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
import { DevicePairingModal } from './components/DevicePairingModal';
import { CounterLockScreen } from './components/CounterLockScreen';
import { AdminLoginPage } from './components/AdminLoginPage';
import {
  CLEAN_CUSTOMERS,
  CLEAN_INVENTORY,
  CLEAN_MFS_ACCOUNTS,
  CLEAN_TRANSACTIONS,
  DEMO_CUSTOMERS,
  DEMO_INVENTORY,
  DEMO_MFS_ACCOUNTS,
  DEMO_TRANSACTIONS,
  STARTER_INVENTORY_TEMPLATES,
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
import { CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles } from 'lucide-react';
import {
  getSupabaseClient,
  pushAllToSupabase,
  pullAllFromSupabase,
  testSupabaseConnection,
  subscribeToShopRealtime,
} from './lib/supabase';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'ব্রাদার্স ডিজিটাল সেন্টার',
  shopSubtitle: 'Brothers Digital Center & Cyber Point',
  ownerName: 'মোহাম্মদ রফিক ও পারভেজ',
  address: 'বাজার মেইন রোড, ডিজিটাল মোড়, ওয়ার্ড নং ০৩',
  phone1: '০১৭১২-৩৪৫৬৭৮',
  phone2: '০১৮১৯-৯৮৭৬৫৪',
  email: 'brothersdigital.bd@gmail.com',
  openingCashBalance: 0,
  receiptFooterNote: 'আমাদের সেবা গ্রহণ করার জন্য আপনাকে ধন্যবাদ। আবার আসবেন!',
  receiptType: 'quarter_a4',
  adminUsername: 'admin',
  adminPassword: '1234',
  adminPin: '1234',
  shopKey: 'brothers-digital',
  isPinProtectionEnabled: true,
  requireLoginForEntireApp: false,
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

  // Core Data State - clean by default for production/Netlify
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bdc_transactions');
    return saved ? JSON.parse(saved) : CLEAN_TRANSACTIONS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('bdc_customers');
    return saved ? JSON.parse(saved) : CLEAN_CUSTOMERS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('bdc_inventory');
    return saved ? JSON.parse(saved) : CLEAN_INVENTORY;
  });

  const [mfsAccounts, setMfsAccounts] = useState<MFSAccount[]>(() => {
    const saved = localStorage.getItem('bdc_mfs_accounts');
    return saved ? JSON.parse(saved) : CLEAN_MFS_ACCOUNTS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('bdc_audit_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-init',
            action: 'সিস্টেম প্রস্তুত',
            details: 'ব্রাদার্স ডিজিটাল সেন্টার POS সিস্টেম শুরু হয়েছে',
            timestamp: new Date().toISOString(),
            type: 'system',
          },
        ];
  });

  // Modals, Pairing & Security Screens
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isCounterLocked, setIsCounterLocked] = useState(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return (
      localStorage.getItem('bdc_admin_logged_in') === 'true' ||
      sessionStorage.getItem('bdc_admin_logged_in') === 'true'
    );
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdminLoginSuccess = (rememberMe: boolean) => {
    setIsAdminLoggedIn(true);
    if (rememberMe) {
      localStorage.setItem('bdc_admin_logged_in', 'true');
    } else {
      sessionStorage.setItem('bdc_admin_logged_in', 'true');
    }
    addAuditLog('অ্যাডমিন লগইন', 'অ্যাডমিন পোর্টালে সফলভাবে লগইন করা হয়েছে', 'system');
    showToast('অ্যাডমিন অ্যাকাউন্টে সফলভাবে লগইন হয়েছে!', 'success');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('bdc_admin_logged_in');
    sessionStorage.removeItem('bdc_admin_logged_in');
    addAuditLog('অ্যাডমিন লগআউট', 'অ্যাডমিন অ্যাকাউন্ট থেকে লগআউট সম্পন্ন হয়েছে', 'system');
    showToast('অ্যাডমিন সেশন সমাপ্ত ও লগআউট হয়েছে', 'info');
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

  // 1. First-time Netlify load initialization & Mobile QR Auto-Pairing
  useEffect(() => {
    // Check if paired via QR code URL (e.g. ?shopKey=brothers-digital&pin=1234&autoPair=1)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlShopKey = urlParams.get('shopKey');
      const urlPin = urlParams.get('pin');

      if (urlShopKey) {
        const cleanedKey = urlShopKey.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        setSettings((prev) => ({
          ...prev,
          shopKey: cleanedKey,
          adminPin: urlPin ? urlPin.trim() : prev.adminPin,
        }));

        // Clean query parameters from URL bar
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast(`মোবাইলে শপ "${cleanedKey}" সফলভাবে পেয়ার হয়েছে!`, 'success');
      }

      // First run cleanup: ensure no stale mock data persists
      const isInitialized = localStorage.getItem('bdc_clean_initialized_v25');
      if (!isInitialized) {
        // If it's a completely fresh start, ensure clean state
        if (!localStorage.getItem('bdc_transactions')) {
          setTransactions(CLEAN_TRANSACTIONS);
          setCustomers(CLEAN_CUSTOMERS);
          setInventory(CLEAN_INVENTORY);
          setMfsAccounts(CLEAN_MFS_ACCOUNTS);
        }
        localStorage.setItem('bdc_clean_initialized_v25', 'true');
      }
    }
  }, []);

  // 2. Sync to local storage
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

  // 3. Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setIsNewTransactionModalOpen(false);
        setIsPairingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. Background Supabase Push helper
  const triggerBackgroundCloudSync = useCallback(async () => {
    if (!supabaseConfig.isConnected || !supabaseConfig.autoSync) return;
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) return;

    try {
      await pushAllToSupabase(
        client,
        {
          transactions,
          customers,
          inventory,
          mfsAccounts,
          settings,
        },
        settings.shopKey || 'brothers-digital'
      );
      setSupabaseConfig((prev) => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Background Supabase sync failed:', err);
    }
  }, [supabaseConfig, transactions, customers, inventory, mfsAccounts, settings]);

  // 5. Supabase Realtime Listener (Instant sync between PC & Android Mobile)
  useEffect(() => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client || !supabaseConfig.isConnected) return;

    const shopKey = settings.shopKey || 'brothers-digital';

    // Initial pull when connected to load remote data
    pullAllFromSupabase(client, shopKey).then((res) => {
      if (res.success && res.data) {
        if (res.data.transactions.length > 0) setTransactions(res.data.transactions);
        if (res.data.customers.length > 0) setCustomers(res.data.customers);
        if (res.data.inventory.length > 0) setInventory(res.data.inventory);
        if (res.data.mfsAccounts.length > 0) setMfsAccounts(res.data.mfsAccounts);
      }
    });

    // Realtime changes subscription
    const unsubscribe = subscribeToShopRealtime(client, shopKey, () => {
      pullAllFromSupabase(client, shopKey).then((res) => {
        if (res.success && res.data) {
          setTransactions(res.data.transactions);
          setCustomers(res.data.customers);
          setInventory(res.data.inventory);
          setMfsAccounts(res.data.mfsAccounts);
          showToast('ক্লাউড থেকে রিয়েল-টাইম ডাটা আপডেট পাওয়া গেছে!', 'info');
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [supabaseConfig.isConnected, supabaseConfig.url, supabaseConfig.anonKey, settings.shopKey]);

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
  const cashInHand = Math.max(0, (settings.openingCashBalance || 0) + cashIncome - cashExpense);

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
      shopId: settings.shopKey || 'brothers-digital',
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
          shopId: settings.shopKey || 'brothers-digital',
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
      shopId: settings.shopKey || 'brothers-digital',
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
      shopId: settings.shopKey || 'brothers-digital',
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
        shopId: settings.shopKey || 'brothers-digital',
      };
      setTransactions((prev) => [mfsTrx, ...prev]);
    }

    addAuditLog(
      `মোবাইল ব্যাংকিং (${provider} ${actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'})`,
      `গ্রাহক: ${customerPhone} • পরিমাণ: ৳${amount.toLocaleString()} • কমিশন: ৳${commission}`,
      'mfs'
    );

    showToast(`${provider} ${actionType === 'CASH_OUT' ? 'ক্যাশ-আউট' : 'ক্যাশ-ইন'} সম্পন্ন হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Handler: Update MFS Balance manually
  const handleUpdateMfsBalance = (provider: MfsProvider, newBalance: number) => {
    setMfsAccounts((prev) =>
      prev.map((acc) => (acc.provider === provider ? { ...acc, balance: newBalance } : acc))
    );
    addAuditLog('MFS ব্যালেন্স সমন্বয়', `${provider} ওয়ালেট ব্যালেন্স: ৳${newBalance.toLocaleString()}`, 'mfs');
    showToast(`${provider} একাউন্ট ব্যালেন্স আপডেট করা হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Handler: Update Stock
  const handleUpdateStock = (itemId: string, newQty: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              stockQuantity: newQty,
              lastRestocked: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
    showToast('স্টক পরিমাণ সফলভাবে আপডেট হয়েছে!');
    triggerBackgroundCloudSync();
  };

  // Handler: Add New Item
  const handleAddNewItem = (
    itemData: Omit<InventoryItem, 'id' | 'stockQuantity' | 'lastRestocked'> & {
      initialStock: number;
    }
  ) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      stockQuantity: itemData.initialStock,
      lastRestocked: new Date().toISOString().slice(0, 10),
      shopId: settings.shopKey || 'brothers-digital',
    };
    setInventory((prev) => [newItem, ...prev]);
    addAuditLog('ইনভেন্টরি আইটেম যোগ', `পণ্য: ${newItem.nameBn} (${newItem.nameEn})`, 'inventory');
    showToast(`পণ্য "${newItem.nameBn}" ইনভেন্টরিতে যোগ করা হয়েছে!`);
    triggerBackgroundCloudSync();
  };

  // Handler: Clean All Data (Start fresh on Netlify)
  const handleClearAllData = () => {
    setTransactions([]);
    setCustomers([]);
    setInventory([]);
    setMfsAccounts(CLEAN_MFS_ACCOUNTS);
    localStorage.removeItem('bdc_transactions');
    localStorage.removeItem('bdc_customers');
    localStorage.removeItem('bdc_inventory');
    localStorage.setItem('bdc_mfs_accounts', JSON.stringify(CLEAN_MFS_ACCOUNTS));
    showToast('সকল পূর্ববর্তী ডেটা সফলভাবে মুছে ফেলা হয়েছে! অ্যাপটি সম্পূর্ণ ফ্রেশ প্রস্তুত।', 'success');
    addAuditLog('ডেটা ফ্রেশ ক্লিন', 'সকল ডেমো রেকর্ড মুছে ফেলা হয়েছে', 'system');
  };

  // Handler: Add Starter Templates
  const handleAddStarterTemplates = () => {
    setInventory(STARTER_INVENTORY_TEMPLATES);
    showToast('৭টি সাইবার ও স্টেশনারি আইটেম ইনভেন্টরিতে যুক্ত করা হয়েছে!');
    addAuditLog('স্টেশনারি টেমপ্লেট যোগ', '৭টি টেমপ্লেট পণ্য ইনভেন্টরিতে যুক্ত', 'inventory');
    triggerBackgroundCloudSync();
  };

  // Handler: Reset to Demo Data
  const handleResetToDemoData = () => {
    setTransactions(DEMO_TRANSACTIONS);
    setCustomers(DEMO_CUSTOMERS);
    setInventory(DEMO_INVENTORY);
    setMfsAccounts(DEMO_MFS_ACCOUNTS);
    showToast('নমুনা ডেমো ডেটা সফলভাবে লোড করা হয়েছে!', 'info');
  };

  // Handler: Restore All Data from Backup
  const handleRestoreAllData = (data: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
    settings?: ShopSettings;
  }) => {
    setTransactions(data.transactions);
    setCustomers(data.customers);
    setInventory(data.inventory);
    setMfsAccounts(data.mfsAccounts);
    if (data.settings) {
      setSettings(data.settings);
    }
    showToast('ব্যাকআপ ফাইল থেকে সফলভাবে তথ্য রিস্টোর করা হয়েছে!');
  };

  // Handler: Data Synced from Cloud
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
    showToast('ক্লাউড থেকে সফলভাবে ডেটা সিঙ্ক করা হয়েছে!');
  };

  // Handler: Pair from Lock Screen
  const handlePairNewShop = (newShopKey: string, newPin: string) => {
    setSettings((prev) => ({
      ...prev,
      shopKey: newShopKey,
      adminPin: newPin,
    }));
    showToast(`শপ "${newShopKey}" এর সাথে সফলভাবে কানেক্ট হয়েছে!`, 'success');
  };

  // Receipt Modal trigger
  const handleOpenReceipt = (trx: Transaction) => {
    setActiveReceiptTransaction(trx);
    setActiveTab('reports');
  };

  // Check tab selection
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
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

      {/* Counter Lock Screen Overlay */}
      {isCounterLocked && (
        <CounterLockScreen
          settings={settings}
          onUnlock={() => setIsCounterLocked(false)}
          onPairNewShop={handlePairNewShop}
        />
      )}

      {/* Main Top Navbar & Metrics */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenPairingModal={() => setIsPairingModalOpen(true)}
        onLockCounter={() => setIsCounterLocked(true)}
        cashInHand={cashInHand}
        todayNetProfit={todayNetProfit}
        lowStockCount={lowStockCount}
        totalDue={totalCustomerDue}
        settings={settings}
        supabaseConfig={supabaseConfig}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* If entire app requires admin login and user is not logged in */}
        {settings.requireLoginForEntireApp && !isAdminLoggedIn ? (
          <AdminLoginPage
            settings={settings}
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={() => {}}
          />
        ) : (
          <>
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
          settings.isPinProtectionEnabled !== false && !isAdminLoggedIn ? (
            <AdminLoginPage
              settings={settings}
              onLoginSuccess={handleAdminLoginSuccess}
              onCancel={() => setActiveTab('dashboard')}
            />
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
              onClearAllData={handleClearAllData}
              onAddStarterTemplates={handleAddStarterTemplates}
              onOpenPairingModal={() => setIsPairingModalOpen(true)}
              onDataSyncedFromCloud={handleDataSyncedFromCloud}
              onLogout={handleAdminLogout}
            />
          )
        )}

        {activeTab === 'architecture' && <ArchitectureDocs />}
          </>
        )}
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

      {/* Device QR Code Pairing Modal */}
      <DevicePairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        settings={settings}
        supabaseConfig={supabaseConfig}
        onUpdateShopKey={(newKey) => setSettings((prev) => ({ ...prev, shopKey: newKey }))}
      />

      {/* Minimalistic Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800">{settings.shopName}</span>
            <span className="text-slate-400 hidden sm:inline"> • পয়েন্ট অব সেল ও শপ ম্যানেজমেন্ট প্ল্যাটফর্ম</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>ড্রয়ার ক্যাশ: ৳{cashInHand.toLocaleString()}</span>
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
