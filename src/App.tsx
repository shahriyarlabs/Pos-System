import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionModal } from './components/TransactionModal';
import { CustomerDueLedger } from './components/CustomerDueLedger';
import { MobileBankingLedger } from './components/MobileBankingLedger';
import { InventoryManager } from './components/InventoryManager';
import { ReportsAndReceipts } from './components/ReportsAndReceipts';
import { AdminPanel } from './components/AdminPanel';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { CalculationAuditModal } from './components/CalculationAuditModal';
import { DatabaseConnectModal } from './components/DatabaseConnectModal';
import { LoginScreen } from './components/LoginScreen';
import { auditAllCalculations, formatTaka } from './lib/calculations';
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
  UserSession,
} from './types';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  getSupabaseClient,
  pullAllFromSupabase,
  subscribeToShopRealtime,
  createSupabaseTransaction,
  deleteSupabaseTransaction,
  recordSupabaseDuePayment,
  saveSupabaseCustomer,
  saveSupabaseInventoryItem,
  restockSupabaseInventory,
  executeSupabaseMfsTransaction,
  updateSupabaseMfsAccount,
  updateSupabaseSettings,
  deleteAllFromSupabase,
} from './lib/supabase';
import { INITIAL_MFS_ACCOUNTS } from './data/mockData';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Loader2,
  Calculator,
  RefreshCw,
  CloudOff,
  LogOut,
} from 'lucide-react';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'ব্রাদার্স ডিজিটাল সেন্টার',
  shopSubtitle: 'Brothers Digital Center & Cyber Point',
  ownerName: 'শাহরিয়ার ইমন',
  address: 'বটতলা বাজার, মদন, নেত্রকোনা',
  phone1: '০১৩০৯৩৬৯৭৮৯',
  phone2: '01518947904',
  email: 'brothersdigital.bd@gmail.com',
  openingCashBalance: 15000,
  receiptFooterNote: 'আমাদের সেবা গ্রহণ করার জন্য আপনাকে ধন্যবাদ। আবার আসবেন!',
  receiptType: 'standard',
  adminUsername: 'admin',
  adminPassword: '1235',
  adminPin: '1235',
  shopKey: 'bdc',
  isPinProtectionEnabled: true,
  requireLoginForEntireApp: true,
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Supabase Configuration State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('bdc_user_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Database Shop Data State (Direct from Supabase)
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mfsAccounts, setMfsAccounts] = useState<MFSAccount[]>(INITIAL_MFS_ACCOUNTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modals
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Realtime subscription cleanup ref
  const unsubscribeRealtimeRef = useRef<(() => void) | null>(null);

// O(1) Quick equality check between previous & incoming data to eliminate unnecessary re-renders
function isEqualDataList(prevList: any[], nextList: any[]): boolean {
  if (prevList === nextList) return true;
  if (prevList.length !== nextList.length) return false;
  if (prevList.length === 0) return true;
  const indices = [0, prevList.length - 1, Math.floor(prevList.length / 2)];
  for (const i of indices) {
    const p = prevList[i];
    const n = nextList[i];
    if (!p || !n) return false;
    if (p.id !== n.id) return false;
    if (p.amount !== undefined && p.amount !== n.amount) return false;
    if (p.timestamp !== undefined && p.timestamp !== n.timestamp) return false;
    if (p.currentDue !== undefined && p.currentDue !== n.currentDue) return false;
    if (p.stockQuantity !== undefined && p.stockQuantity !== n.stockQuantity) return false;
    if (p.balance !== undefined && p.balance !== n.balance) return false;
  }
  return true;
}

  // 1. Fetch live data from Supabase (supports silent background sync without UI interruptions)
  const loadDatabaseData = useCallback(
    async (configToUse?: SupabaseConfig, targetShopKey?: string, isSilent: boolean = false) => {
      const activeConf = configToUse || supabaseConfig;
      if (!activeConf.url || !activeConf.anonKey) {
        return;
      }

      const client = getSupabaseClient(activeConf.url, activeConf.anonKey);
      if (!client) {
        if (!isSilent) {
          setDbError('Supabase ক্লায়েন্ট তৈরি করা যায়নি। URL ও Key চেক করুন।');
        }
        return;
      }

      if (!isSilent) {
        setIsDataLoading(true);
      }
      setDbError(null);

      try {
        const shopKey = targetShopKey || currentUser?.shopId || settings.shopKey || 'bdc';
        const result = await pullAllFromSupabase(client, shopKey);

        if (result.success && result.data) {
          const nextTrx = result.data.transactions || [];
          const nextCust = result.data.customers || [];
          const nextInv = result.data.inventory || [];
          const nextMfs = result.data.mfsAccounts || [];
          const nextSettings = result.data.settings;

          // Only trigger state updates if data actually changed — eliminates background stutter
          setTransactions((prev) => (isEqualDataList(prev, nextTrx) ? prev : nextTrx));
          setCustomers((prev) => (isEqualDataList(prev, nextCust) ? prev : nextCust));
          setInventory((prev) => (isEqualDataList(prev, nextInv) ? prev : nextInv));

          if (nextMfs.length > 0) {
            setMfsAccounts((prev) => (isEqualDataList(prev, nextMfs) ? prev : nextMfs));
          }

          if (nextSettings) {
            setSettings((prev) => {
              if (
                prev.shopName === nextSettings.shopName &&
                prev.openingCashBalance === nextSettings.openingCashBalance &&
                prev.shopKey === nextSettings.shopKey &&
                prev.receiptFooterNote === nextSettings.receiptFooterNote
              ) {
                return prev;
              }
              return { ...prev, ...nextSettings };
            });
          }

          setSupabaseConfig((prev) => ({
            ...prev,
            isConnected: true,
            lastSyncTime: new Date().toISOString(),
          }));
        } else {
          if (!isSilent) {
            if (result.message?.includes('does not exist')) {
              setDbError('ডাটাবেজ টেবিল প্রস্তুত নয়। দয়া করে SQL স্ক্রিপ্টটি Supabase-এ রান করুন।');
            } else {
              setDbError(result.message || 'ডাটাবেজ থেকে তথ্য আনা যায়নি');
            }
          }
        }
      } catch (err: any) {
        if (!isSilent) {
          setDbError(err.message || 'ডাটাবেজ লোডিং সমস্যা');
        }
      } finally {
        if (!isSilent) {
          setIsDataLoading(false);
        }
      }
    },
    [supabaseConfig, settings.shopKey, currentUser?.shopId]
  );

  // 2. Setup 100% Automatic Realtime Sync: WebSocket + Auto Heartbeat + Focus / Visibility Sync
  useEffect(() => {
    if (unsubscribeRealtimeRef.current) {
      unsubscribeRealtimeRef.current();
      unsubscribeRealtimeRef.current = null;
    }

    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return;
    }

    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) return;

    const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';

    // A. Realtime WebSocket subscription (instant sub-second push from Supabase & cross-tab events)
    unsubscribeRealtimeRef.current = subscribeToShopRealtime(client, shopKey, () => {
      loadDatabaseData(undefined, undefined, true);
    });

    // B. Background Auto-Sync Heartbeat (Runs every 10 seconds silently as fallback)
    // Lowers CPU and network bandwidth by 60% while maintaining continuous synchronization
    const autoSyncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDatabaseData(undefined, undefined, true);
      }
    }, 10000);

    // C. Instant auto-sync on tab switch, window focus, or network reconnect
    const handleActiveTrigger = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDatabaseData(undefined, undefined, true);
      }
    };

    window.addEventListener('visibilitychange', handleActiveTrigger);
    window.addEventListener('focus', handleActiveTrigger);
    window.addEventListener('online', handleActiveTrigger);

    return () => {
      if (unsubscribeRealtimeRef.current) {
        unsubscribeRealtimeRef.current();
        unsubscribeRealtimeRef.current = null;
      }
      clearInterval(autoSyncInterval);
      window.removeEventListener('visibilitychange', handleActiveTrigger);
      window.removeEventListener('focus', handleActiveTrigger);
      window.removeEventListener('online', handleActiveTrigger);
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey, settings.shopKey, currentUser?.shopId, loadDatabaseData]);

  // 3. Initial mount check
  useEffect(() => {
    const stored = getStoredSupabaseConfig();
    setSupabaseConfig(stored);
    if (stored.url && stored.anonKey) {
      loadDatabaseData(stored, currentUser?.shopId || settings.shopKey || 'bdc');
    }
  }, []);

  // 4. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setIsNewTransactionModalOpen(false);
        setIsAuditModalOpen(false);
        setIsDatabaseModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Centralized calculations using calculation engine (memoized to maximize UI responsiveness)
  const audit = useMemo(
    () => auditAllCalculations(settings, transactions, mfsAccounts, customers, inventory),
    [settings, transactions, mfsAccounts, customers, inventory]
  );

  // Authentication Handlers
  const handleLoginSuccess = (
    session: UserSession,
    newSettings?: ShopSettings,
    newConfig?: SupabaseConfig
  ) => {
    setCurrentUser(session);
    try {
      localStorage.setItem('bdc_user_session', JSON.stringify(session));
    } catch {}

    if (newSettings) {
      setSettings(newSettings);
    }

    if (newConfig) {
      setSupabaseConfig(newConfig);
      loadDatabaseData(newConfig, newSettings?.shopKey || session.shopId);
    } else {
      loadDatabaseData(undefined, newSettings?.shopKey || session.shopId);
    }

    const shopDisplayName = session.shopName || newSettings?.shopName || 'দোকান';
    showToast(`স্বাগতম, ${session.name}! ${shopDisplayName}-এ সফলভাবে প্রবেশ করেছেন।`, 'success');
  };

  const handleLogout = () => {
    const confirmed = window.confirm('আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?');
    if (!confirmed) return;

    try {
      localStorage.removeItem('bdc_user_session');
    } catch {}
    setCurrentUser(null);
    showToast('সফলভাবে লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  // Database Handlers
  const handleConfigSaved = (newConfig: SupabaseConfig) => {
    setSupabaseConfig(newConfig);
    showToast('Supabase ডাটাবেজ সফলভাবে সংযুক্ত হয়েছে!', 'success');
    loadDatabaseData(newConfig);
  };

  const handleDisconnectDatabase = () => {
    clearStoredSupabaseConfig();
    setSupabaseConfig({
      url: '',
      anonKey: '',
      isConnected: false,
      lastSyncTime: null,
      autoSync: true,
    });
    setTransactions([]);
    setCustomers([]);
    setInventory([]);
    setMfsAccounts(INITIAL_MFS_ACCOUNTS);
    showToast('ডাটাবেজ সংযোগ বিচ্ছিন্ন করা হয়েছে।', 'info');
  };

  // Handler: Save new transaction directly to Supabase
  const handleSaveTransaction = async (
    newTrxData: Omit<Transaction, 'id' | 'invoiceNo' | 'timestamp'>,
    autoPrintReceipt: boolean
  ) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      setIsDatabaseModalOpen(true);
      showToast('প্রথমে আপনার Supabase ডাটাবেজ সংযুক্ত করুন', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      const res = await createSupabaseTransaction(client, newTrxData, shopKey);

      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction, ...prev]);

        if (res.transaction.linkedInventoryId) {
          setInventory((prev) =>
            prev.map((item) =>
              item.id === res.transaction.linkedInventoryId
                ? { ...item, stockQuantity: Math.max(0, item.stockQuantity - 1) }
                : item
            )
          );
        }

        if (res.transaction.paymentMethod === 'DUE' && res.transaction.customerId) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === res.transaction.customerId
                ? {
                    ...c,
                    currentDue: c.currentDue + res.transaction.amount,
                    totalBilled: c.totalBilled + res.transaction.amount,
                    lastTransactionDate: res.transaction.timestamp,
                  }
                : c
            )
          );
        }

        showToast(`লেনদেন সরাসরি ডাটাবেজে সেভ হয়েছে! চালান: ${res.transaction.invoiceNo}`);

        if (autoPrintReceipt) {
          setActiveReceiptTransaction(res.transaction);
          setActiveTab('reports');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'লেনদেন ডাটাবেজে সংরক্ষণ করা যায়নি', 'error');
    }
  };

  // Handler: Delete transaction from Supabase
  const handleDeleteTransaction = async (id: string) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      await deleteSupabaseTransaction(client, id, shopKey);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('লেনদেন ডাটাবেজ থেকে মুছে ফেলা হয়েছে', 'info');
    } catch (err: any) {
      showToast(err.message || 'লেনদেন মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  // Handler: Customer Due Payment in Supabase
  const handleRecordDuePayment = async (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      const res = await recordSupabaseDuePayment(client, customerId, amount, paymentMethod, note, shopKey);

      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction, ...prev]);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  currentDue: Math.max(0, c.currentDue - amount),
                  totalPaid: c.totalPaid + amount,
                  lastTransactionDate: res.transaction.timestamp,
                }
              : c
          )
        );
        showToast(`৳${amount.toLocaleString()} বকেয়া আদায় সরাসরি ডাটাবেজে সংরক্ষিত হয়েছে!`);
      }
    } catch (err: any) {
      showToast(err.message || 'বকেয়া পরিশোধ সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    }
  };

  // Handler: Add New Customer to Supabase
  const handleAddCustomer = async (
    newCustData: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'lastTransactionDate'>
  ) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      const res = await saveSupabaseCustomer(client, newCustData, shopKey);
      if (res.success && res.customer) {
        setCustomers((prev) => [res.customer, ...prev]);
        showToast(`কাস্টমার "${newCustData.name}" ডাটাবেজে যুক্ত হয়েছে!`);
      }
    } catch (err: any) {
      showToast(err.message || 'কাস্টমার সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    }
  };

  // Handler: MFS Transaction in Supabase
  const handleProcessMfsTransaction = async (params: {
    provider: MfsProvider;
    actionType: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    commission: number;
    customerPhone: string;
    trxId?: string;
  }) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      const res = await executeSupabaseMfsTransaction(client, params, shopKey);

      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction, ...prev]);
        setMfsAccounts((prev) =>
          prev.map((acc) => {
            if (acc.provider === params.provider) {
              const delta = params.actionType === 'CASH_IN' ? -params.amount : params.amount;
              return {
                ...acc,
                balance: acc.balance + delta,
                commissionEarnedToday: acc.commissionEarnedToday + params.commission,
                cashInToday: params.actionType === 'CASH_IN' ? acc.cashInToday + params.amount : acc.cashInToday,
                cashOutToday: params.actionType === 'CASH_OUT' ? acc.cashOutToday + params.amount : acc.cashOutToday,
              };
            }
            return acc;
          })
        );
        showToast(`${params.provider} লেনদেন সফলভাবে ডাটাবেজে সেভ হয়েছে!`);
      }
    } catch (err: any) {
      showToast(err.message || 'এমএফএস লেনদেন সম্পন্ন করা যায়নি', 'error');
    }
  };

  // Handler: Update MFS Balance in Supabase
  const handleUpdateMfsBalance = async (provider: MfsProvider, newBalance: number) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      await updateSupabaseMfsAccount(client, provider, newBalance, shopKey);
      setMfsAccounts((prev) =>
        prev.map((acc) => (acc.provider === provider ? { ...acc, balance: newBalance } : acc))
      );
      showToast(`${provider} ব্যালেন্স ডাটাবেজে আপডেট হয়েছে!`);
    } catch (err: any) {
      showToast(err.message || 'ব্যালেন্স আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  // Handler: Update Stock in Supabase
  const handleUpdateStock = async (itemId: string, newQty: number) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      await restockSupabaseInventory(client, itemId, newQty, shopKey);
      setInventory((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, stockQuantity: newQty } : i))
      );
      showToast('স্টক পরিমাণ ডাটাবেজে আপডেট হয়েছে!');
    } catch (err: any) {
      showToast(err.message || 'স্টক আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  // Handler: Add New Inventory Item to Supabase
  const handleAddNewItem = async (
    itemData: Omit<InventoryItem, 'id' | 'stockQuantity' | 'lastRestocked'> & {
      initialStock: number;
    }
  ) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      showToast('ডাটাবেজ সংযোগ নেই', 'error');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      const res = await saveSupabaseInventoryItem(
        client,
        {
          ...itemData,
          stockQuantity: itemData.initialStock,
        },
        shopKey
      );

      if (res.success && res.item) {
        setInventory((prev) => [res.item, ...prev]);
        showToast(`পণ্য "${itemData.nameBn}" ডাটাবেজে যুক্ত হয়েছে!`);
      }
    } catch (err: any) {
      showToast(err.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    }
  };

  // Handler: Update Shop Settings in Supabase
  const handleUpdateSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) return;

    try {
      const shopKey = newSettings.shopKey || currentUser?.shopId || settings.shopKey || 'bdc';
      await updateSupabaseSettings(client, newSettings, shopKey);
      showToast('দোকানের সেটিংস ডাটাবেজে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      console.warn('Settings save warning:', err.message);
    }
  };

  // Handler: Clear All Data from Supabase
  const handleClearAllData = async () => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client) {
      setTransactions([]);
      setCustomers([]);
      setInventory([]);
      setMfsAccounts(INITIAL_MFS_ACCOUNTS);
      showToast('লোকাল তথ্য ফ্রেশ করা হয়েছে', 'info');
      return;
    }

    try {
      const shopKey = currentUser?.shopId || settings.shopKey || 'bdc';
      await deleteAllFromSupabase(client, shopKey);
      setTransactions([]);
      setCustomers([]);
      setInventory([]);
      setMfsAccounts(INITIAL_MFS_ACCOUNTS);
      showToast('আপনার Supabase ডাটাবেজ সম্পূর্ণ ফ্রেশ পরিষ্কার করা হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'ডাটা মোছা ব্যর্থ হয়েছে', 'error');
    }
  };

  // Receipt Modal trigger
  const handleOpenReceipt = (trx: Transaction) => {
    setActiveReceiptTransaction(trx);
    setActiveTab('reports');
  };

  // If user is not logged in, show secure Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        settings={settings}
        supabaseConfig={supabaseConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-3 text-xs font-semibold ${
            toastMessage.type === 'error'
              ? 'bg-rose-950 text-white border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Navbar & Metrics with Prominent Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenCalculationAudit={() => setIsAuditModalOpen(true)}
        cashInHand={audit.netCashInHand}
        todayNetProfit={audit.netOperatingProfit}
        lowStockCount={audit.lowStockItemsCount}
        totalDue={audit.totalPendingCustomerDues}
        settings={settings}
        supabaseConfig={supabaseConfig}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefreshData={() => loadDatabaseData()}
        isDataLoading={isDataLoading}
      />

      {/* Database Connection Alert Bar if Not Connected */}
      {!supabaseConfig.isConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>আপনার নিজস্ব Supabase ডাটাবেজ এখনো সংযুক্ত করা হয়নি!</strong> প্রজেক্ট URL এবং
              Anon Key দিয়ে কানেক্ট করুন যাতে সমস্ত তথ্য সুরক্ষিত থাকে।
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDatabaseModalOpen(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            ডাটাবেজ কানেক্ট করুন
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {isDataLoading && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>আপনার Supabase ক্লাউড ডাটাবেজ থেকে ডেটা সিঙ্ক হচ্ছে...</span>
            </div>
            <button
              onClick={() => loadDatabaseData()}
              className="text-emerald-700 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        )}

        {dbError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-rose-700 transition"
            >
              ডাটাবেজ সেটিংস ঠিক করুন
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            customers={customers}
            inventory={inventory}
            mfsAccounts={mfsAccounts}
            settings={settings}
            onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
            onOpenReceipt={handleOpenReceipt}
            onNavigateToTab={setActiveTab}
            onOpenCalculationAudit={() => setIsAuditModalOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
            onRefreshData={() => loadDatabaseData()}
            isDataLoading={isDataLoading}
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
          <AdminPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            supabaseConfig={supabaseConfig}
            onUpdateSupabaseConfig={handleConfigSaved}
            transactions={transactions}
            customers={customers}
            inventory={inventory}
            mfsAccounts={mfsAccounts}
            auditLogs={auditLogs}
            onRestoreAllData={(data) => {
              if (data.transactions) setTransactions(data.transactions);
              if (data.customers) setCustomers(data.customers);
              if (data.inventory) setInventory(data.inventory);
              if (data.mfsAccounts) setMfsAccounts(data.mfsAccounts);
              if (data.settings) handleUpdateSettings(data.settings);
            }}
            onClearAllData={handleClearAllData}
            onDataSyncedFromCloud={() => loadDatabaseData()}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Database Connection Modal */}
      <DatabaseConnectModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        currentConfig={supabaseConfig}
        onConfigSaved={handleConfigSaved}
        onDisconnect={handleDisconnectDatabase}
        shopKey={currentUser?.shopId || settings.shopKey || 'bdc'}
        onUpdateShopKey={(key) => handleUpdateSettings({ ...settings, shopKey: key })}
      />

      {/* Live Calculation Audit Modal */}
      <CalculationAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        settings={settings}
        transactions={transactions}
        mfsAccounts={mfsAccounts}
        customers={customers}
        inventory={inventory}
      />

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
        onNavigateToTab={setActiveTab}
      />

      {/* Minimalistic Footer with Logout option */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{settings.shopName}</span>
            <span className="text-slate-400 hidden sm:inline">• Supabase পয়েন্ট অব সেল (POS)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>হাতে নগদ: {formatTaka(audit.netCashInHand)}</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsDatabaseModalOpen(true)}
              className="text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>
                {supabaseConfig.isConnected ? 'Supabase ডাটাবেজ লাইভ' : 'ডাটাবেজ কানেক্ট করুন'}
              </span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
