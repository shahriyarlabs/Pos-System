import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  User,
  Store,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Database,
  Upload,
  Image as ImageIcon,
  Phone,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Laptop,
  Smartphone,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Code,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { ShopSettings, SupabaseConfig, UserSession } from '../types';
import {
  getSupabaseClient,
  testSupabaseConnection,
  registerNewShopInSupabase,
  loginShopFromSupabase,
  saveStoredSupabaseConfig,
  listShopsFromSupabase,
  RegisteredShopSummary,
} from '../lib/supabase';

interface LoginScreenProps {
  settings: ShopSettings;
  supabaseConfig: SupabaseConfig;
  onLoginSuccess: (session: UserSession, newSettings?: ShopSettings, newConfig?: SupabaseConfig) => void;
}

const PRESET_LOGOS = [
  {
    id: 'digital',
    label: 'ডিজিটাল সেন্টার',
    icon: '💻',
    bg: 'from-emerald-600 to-teal-700',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'telecom',
    label: 'টেলিকম ও ব্যাংকিং',
    icon: '📱',
    bg: 'from-rose-600 to-pink-700',
    url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'general',
    label: 'জেনারেল স্টোর',
    icon: '🛍️',
    bg: 'from-amber-600 to-orange-700',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'pharmacy',
    label: 'ফার্মেসি ও ড্রাগস',
    icon: '💊',
    bg: 'from-cyan-600 to-blue-700',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'electronics',
    label: 'ইলেকট্রনিক্স',
    icon: '⚡',
    bg: 'from-indigo-600 to-purple-700',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=160&auto=format&fit=crop&q=80',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  supabaseConfig,
  onLoginSuccess,
}) => {
  // Mode: 'login' (for existing shop on any device) or 'register' (new shop)
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // --- LOGIN FORM STATE ---
  const [loginShopId, setLoginShopId] = useState(settings.shopKey || 'bdc');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registered shops loaded from Supabase
  const [registeredShops, setRegisteredShops] = useState<RegisteredShopSummary[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  // Manual SQL accordion state
  const [showManualSql, setShowManualSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Optional custom DB accordion on login
  const [showCustomDbLogin, setShowCustomDbLogin] = useState(false);
  const [customDbUrl, setCustomDbUrl] = useState(supabaseConfig.url || '');
  const [customDbKey, setCustomDbKey] = useState(supabaseConfig.anonKey || '');

  // Fetch registered shops in this Supabase database
  const fetchRegisteredShops = async () => {
    const url = (showCustomDbLogin && customDbUrl.trim()) || supabaseConfig.url || 'https://sjudmshppklwhwgivnzw.supabase.co';
    const key = (showCustomDbLogin && customDbKey.trim()) || supabaseConfig.anonKey || 'sb_publishable_YhEUvRLOVOA5pPTLiAHn1A_3Ye1djfx';
    const client = getSupabaseClient(url, key);
    if (!client) return;

    setIsLoadingShops(true);
    try {
      const shops = await listShopsFromSupabase(client);
      setRegisteredShops(shops);
      if (shops.length > 0) {
        if (!loginShopId || loginShopId === 'brothers-digital' || loginShopId === '') {
          setLoginShopId(shops[0].shopId);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingShops(false);
    }
  };

  useEffect(() => {
    fetchRegisteredShops();
  }, [supabaseConfig.url, supabaseConfig.anonKey, showCustomDbLogin, customDbUrl, customDbKey]);

  // --- REGISTRATION FORM STATE ---
  const [regShopName, setRegShopName] = useState('');
  const [regShopSubtitle, setRegShopSubtitle] = useState('ডিজিটাল সেন্টার ও শপ ম্যানেজমেন্ট');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regOpeningCash, setRegOpeningCash] = useState<number>(10000);

  // Logo selection: file upload or URL or preset
  const [logoMode, setLogoMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [regLogoUrl, setRegLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Credentials
  const [regShopId, setRegShopId] = useState('');
  const [regPin, setRegPin] = useState('1235');
  const [regConfirmPin, setRegConfirmPin] = useState('1235');
  const [showRegPin, setShowRegPin] = useState(false);

  // Database credentials for registration
  const [regDbUrl, setRegDbUrl] = useState(supabaseConfig.url || 'https://sjudmshppklwhwgivnzw.supabase.co');
  const [regDbKey, setRegDbKey] = useState(supabaseConfig.anonKey || 'sb_publishable_YhEUvRLOVOA5pPTLiAHn1A_3Ye1djfx');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestStatus, setDbTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Database table creation (SQL) in registration
  const [showRegSql, setShowRegSql] = useState(false);
  const [regSqlCopied, setRegSqlCopied] = useState(false);

  const getRegistrationSql = () => {
    const targetShopId = (regShopId.trim() || 'brothers-digital').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const targetShopName = regShopName.trim() || 'ব্রাদার্স ডিজিটাল সেন্টার';
    const targetSubtitle = regShopSubtitle.trim() || 'Brothers Digital Center & Cyber Point';
    const targetOwner = regOwnerName.trim() || 'শাহরিয়ার ইমন';
    const targetPhone = regPhone.trim() || '01309369789';
    const targetAddress = regAddress.trim() || 'বটতলা বাজার, মদন, নেত্রকোনা';
    const targetPin = regPin.trim() || '1235';
    const targetCash = regOpeningCash || 0;
    const targetLogo = regLogoUrl || '';

    return `-- ==========================================
-- ডেটাবেজ টেবিল তৈরি (SQL Script)
-- দোকান: ${targetShopName} (ID: ${targetShopId})
-- Supabase SQL Editor -> New Query -> Run
-- ==========================================

-- ১. শপ সেটিংস টেবিল (Shop Settings)
CREATE TABLE IF NOT EXISTS shop_settings (
    shop_id TEXT PRIMARY KEY,
    shop_name TEXT NOT NULL,
    shop_subtitle TEXT,
    owner_name TEXT,
    phone1 TEXT,
    phone2 TEXT,
    address TEXT,
    email TEXT,
    opening_cash_balance NUMERIC DEFAULT 0,
    receipt_footer_note TEXT,
    receipt_type TEXT DEFAULT 'standard',
    admin_pin TEXT DEFAULT '1235',
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. কাস্টমার বকেয়া খাতা (Customers)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT '${targetShopId}',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    total_billed NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    current_due NUMERIC DEFAULT 0,
    last_transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. ইনভেন্টরি ও পণ্য স্টক (Inventory Items)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT '${targetShopId}',
    code TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    stock_quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'Pcs',
    unit_bn TEXT DEFAULT 'টি',
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    low_stock_threshold NUMERIC DEFAULT 5,
    last_restocked TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. মোবাইল ব্যাংকিং ওয়ালেট (MFS Accounts)
CREATE TABLE IF NOT EXISTS mfs_accounts (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT '${targetShopId}',
    provider TEXT NOT NULL,
    account_name TEXT NOT NULL,
    agent_number TEXT,
    balance NUMERIC NOT NULL DEFAULT 0,
    commission_earned_today NUMERIC DEFAULT 0,
    cash_in_today NUMERIC DEFAULT 0,
    cash_out_today NUMERIC DEFAULT 0,
    color TEXT DEFAULT '#10b981'
);

-- ৫. দৈনিক হিসাব ও লেনদেন (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT '${targetShopId}',
    invoice_no TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label_bn TEXT NOT NULL,
    category_label_en TEXT NOT NULL,
    service_id TEXT,
    amount NUMERIC NOT NULL,
    fee_or_cost NUMERIC DEFAULT 0,
    profit NUMERIC DEFAULT 0,
    payment_method TEXT NOT NULL,
    mfs_provider TEXT,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    is_due BOOLEAN DEFAULT false,
    due_amount NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    note TEXT,
    status TEXT DEFAULT 'COMPLETED',
    operator_id TEXT,
    operator_name TEXT
);

-- ৬. সিকিউরিটি পলিসি (Row Level Security - RLS)
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public shop_settings access" ON shop_settings;
CREATE POLICY "Public shop_settings access" ON shop_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public customers access" ON customers;
CREATE POLICY "Public customers access" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public inventory access" ON inventory_items;
CREATE POLICY "Public inventory access" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public mfs access" ON mfs_accounts;
CREATE POLICY "Public mfs access" ON mfs_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public transactions access" ON transactions;
CREATE POLICY "Public transactions access" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ৭. রিয়েলটাইম লাইভ সিঙ্ক অ্যাক্টিভেশন
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings, customers, inventory_items, mfs_accounts, transactions;

-- ৮. দোকানের প্রাথমিক তথ্য ইনসার্ট (${targetShopName})
INSERT INTO shop_settings (
    shop_id, shop_name, shop_subtitle, owner_name,
    phone1, address, opening_cash_balance, admin_pin, logo_url, updated_at
) VALUES (
    '${targetShopId}',
    '${targetShopName}',
    '${targetSubtitle}',
    '${targetOwner}',
    '${targetPhone}',
    '${targetAddress}',
    ${targetCash},
    '${targetPin}',
    '${targetLogo}',
    NOW()
) ON CONFLICT (shop_id) DO UPDATE SET
    shop_name = EXCLUDED.shop_name,
    owner_name = EXCLUDED.owner_name,
    phone1 = EXCLUDED.phone1,
    admin_pin = EXCLUDED.admin_pin,
    updated_at = NOW();

-- ৯. মোবাইল ব্যাংকিং এজেন্ট একাউন্টস
INSERT INTO mfs_accounts (id, shop_id, provider, account_name, agent_number, balance, color)
VALUES
  ('mfs-bkash-${targetShopId}', '${targetShopId}', 'BKASH', 'বিকাশ এজেন্ট', '${targetPhone}', 10000, '#E2136E'),
  ('mfs-nagad-${targetShopId}', '${targetShopId}', 'NAGAD', 'নগদ এজেন্ট', '${targetPhone}', 10000, '#F7941D'),
  ('mfs-rocket-${targetShopId}', '${targetShopId}', 'ROCKET', 'রকেট এজেন্ট', '${targetPhone}', 5000, '#8C3494')
ON CONFLICT (id) DO NOTHING;
`;
  };

  const handleCopyRegSql = () => {
    navigator.clipboard.writeText(getRegistrationSql());
    setRegSqlCopied(true);
    setTimeout(() => setRegSqlCopied(false), 2500);
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Auto-generate Shop ID when shop name changes
  const handleShopNameChange = (val: string) => {
    setRegShopName(val);
    if (!regShopId || regShopId.startsWith('shop-')) {
      // Suggest clean ID
      const transliterated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 15);
      setRegShopId(transliterated.length > 2 ? transliterated : `shop-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  // Handle Logo File Upload with automatic image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে ছবি ফাইল (JPG, PNG, WEBP) নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 240;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setLogoPreview(compressed);
        setRegLogoUrl(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Test Supabase Connection in Registration
  const handleTestDatabaseConnection = async () => {
    const url = regDbUrl.trim();
    const key = regDbKey.trim();

    if (!url || !key) {
      setDbTestStatus({ success: false, message: 'প্রজেক্ট URL এবং Anon Key দিন' });
      return;
    }

    setIsTestingDb(true);
    setDbTestStatus(null);

    try {
      const res = await testSupabaseConnection(url, key);
      setDbTestStatus(res);
    } catch (err: any) {
      setDbTestStatus({ success: false, message: err.message || 'সংযোগ ব্যর্থ' });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Handle Login Submit (works from ANY phone, laptop, or browser!)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const enteredId = loginShopId.trim();
    const enteredPin = loginPin.trim();

    if (!enteredId) {
      setLoginError('অনুগ্রহ করে আপনার শপ আইডি বা ইউজারনেম লিখুন');
      return;
    }
    if (!enteredPin) {
      setLoginError('অনুগ্রহ করে আপনার পিন কোড বা পাসওয়ার্ড দিন');
      return;
    }

    setIsLoggingIn(true);

    try {
      // Determine which Supabase URL/Key to query
      const urlToUse = (showCustomDbLogin && customDbUrl.trim()) || supabaseConfig.url || 'https://sjudmshppklwhwgivnzw.supabase.co';
      const keyToUse = (showCustomDbLogin && customDbKey.trim()) || supabaseConfig.anonKey || 'sb_publishable_YhEUvRLOVOA5pPTLiAHn1A_3Ye1djfx';

      const client = getSupabaseClient(urlToUse, keyToUse);
      if (!client) {
        setLoginError('ডাটাবেজ সংযোগ পাওয়া যায়নি। URL ও Key চেক করুন।');
        setIsLoggingIn(false);
        return;
      }

      // Query shop_settings directly on Supabase
      const loginRes = await loginShopFromSupabase(client, enteredId, enteredPin);

      if (loginRes.success && loginRes.shopSettings) {
        const loadedShop = loginRes.shopSettings;

        const session: UserSession = {
          username: loadedShop.shopKey,
          name: loadedShop.ownerName || 'শপ ওনার',
          shopId: loadedShop.shopKey,
          shopName: loadedShop.shopName,
          shopLogo: loadedShop.shopLogo,
          role: 'owner',
          loginTime: new Date().toISOString(),
        };

        const newDbConfig: SupabaseConfig = {
          url: urlToUse,
          anonKey: keyToUse,
          isConnected: true,
          lastSyncTime: new Date().toISOString(),
          autoSync: true,
        };

        saveStoredSupabaseConfig(newDbConfig);
        onLoginSuccess(session, loadedShop, newDbConfig);
      } else {
        setLoginError(loginRes.message || 'লগইন ব্যর্থ হয়েছে। আইডি ও পিন চেক করুন।');
      }
    } catch (err: any) {
      setLoginError(err.message || 'সার্ভার যোগাযোগ সমস্যা। ইন্টারনেট চেক করুন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const sName = regShopName.trim();
    const oName = regOwnerName.trim();
    const phone = regPhone.trim();
    const address = regAddress.trim();
    const cleanShopId = regShopId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const pin = regPin.trim();

    if (!sName) {
      setRegError('দোকানের নাম প্রদান করুন');
      return;
    }
    if (!oName) {
      setRegError('মালিকের নাম প্রদান করুন');
      return;
    }
    if (!phone) {
      setRegError('মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!address) {
      setRegError('দোকানের ঠিকানা প্রদান করুন');
      return;
    }
    if (!cleanShopId || cleanShopId.length < 3) {
      setRegError('শপ আইডি কমপক্ষে ৩ অক্ষরের (ইংরেজি) হতে হবে');
      return;
    }
    if (!pin) {
      setRegError('পাসওয়ার্ড বা ৪-ডিজিটের পিন কোড দিন');
      return;
    }
    if (pin !== regConfirmPin.trim()) {
      setRegError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি');
      return;
    }

    const dbUrl = regDbUrl.trim();
    const dbKey = regDbKey.trim();
    if (!dbUrl || !dbKey) {
      setRegError('Supabase ডাটাবেজের প্রজেক্ট URL এবং Anon Key দিন');
      return;
    }

    setIsRegistering(true);

    try {
      const client = getSupabaseClient(dbUrl, dbKey);
      if (!client) {
        setRegError('ডাটাবেজ সংযোগ তৈরি করা সম্ভব হয়নি');
        setIsRegistering(false);
        return;
      }

      // Execute shop registration into Supabase
      const finalLogo = logoPreview || regLogoUrl || undefined;

      const regRes = await registerNewShopInSupabase(client, {
        shopId: cleanShopId,
        shopName: sName,
        shopSubtitle: regShopSubtitle,
        ownerName: oName,
        phone,
        address,
        logo: finalLogo,
        pin,
        openingCashBalance: regOpeningCash,
      });

      if (regRes.success && regRes.shopSettings) {
        const createdShop = regRes.shopSettings;

        const session: UserSession = {
          username: cleanShopId,
          name: oName,
          shopId: cleanShopId,
          shopName: sName,
          shopLogo: finalLogo,
          role: 'owner',
          loginTime: new Date().toISOString(),
        };

        const newDbConfig: SupabaseConfig = {
          url: dbUrl,
          anonKey: dbKey,
          isConnected: true,
          lastSyncTime: new Date().toISOString(),
          autoSync: true,
        };

        saveStoredSupabaseConfig(newDbConfig);
        onLoginSuccess(session, createdShop, newDbConfig);
      } else {
        setRegError(regRes.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setRegError(err.message || 'রেজিস্ট্রেশন প্রক্রিয়ায় ত্রুটি ঘটেছে');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Container Box */}
      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 px-6 py-6 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          {/* Logo / Badge */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-emerald-800 shadow-xl flex items-center justify-center font-black text-2xl border-2 border-emerald-400/30 mb-3 overflow-hidden">
            {activeMode === 'register' && logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
            ) : settings.shopLogo ? (
              <img src={settings.shopLogo} alt="Shop Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-emerald-700" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {activeMode === 'register' && regShopName
              ? regShopName
              : settings.shopName || 'ডিজিটাল পয়েন্ট অব সেল (POS)'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-md mx-auto">
            {activeMode === 'register'
              ? 'নতুন দোকান রেজিস্ট্রেশন ও ক্লাউড ডাটাবেজ সেটআপ'
              : 'যেকোনো মোবাইল, কম্পিউটার বা ট্যাবলেট থেকে আপনার দোকানে প্রবেশ করুন'}
          </p>

          {/* Segmented Mode Switcher */}
          <div className="mt-5 max-w-xs mx-auto bg-slate-950/50 p-1 rounded-2xl border border-white/20 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'login'
                  ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগইন (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'register'
                  ? 'bg-emerald-500 text-white shadow-md font-extrabold'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>নতুন রেজিস্ট্রেশন</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: LOGIN (CROSS-DEVICE ACCESS)                     */}
        {/* ======================================================== */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="bg-emerald-950/50 border border-emerald-700/40 rounded-2xl p-3.5 text-xs text-emerald-200 flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">মাল্টি-ডিভাইস ক্লাউড লগইন:</span>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  আপনার <strong>শপ আইডি</strong> এবং <strong>পিন/পাসওয়ার্ড</strong> দিয়ে যেকোনো মোবাইল বা কম্পিউটার থেকে সরাসরি লগইন করতে পারবেন। কোনো পেয়ারিং দরকার নেই।
                </p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Registered Shops in Database Banner */}
            {registeredShops.length > 0 && (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Store className="w-4 h-4 text-emerald-400" />
                    ডাটাবেজে পাওয়া দোকান ({registeredShops.length}টি):
                  </span>
                  <button
                    type="button"
                    onClick={fetchRegisteredShops}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    title="দোকানের তালিকা রিফ্রেশ করুন"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingShops ? 'animate-spin' : ''}`} />
                    রিফ্রেশ
                  </button>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {registeredShops.map((s) => (
                    <div
                      key={s.shopId}
                      onClick={() => {
                        setLoginShopId(s.shopId);
                        setLoginPin('1235');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        loginShopId.toLowerCase() === s.shopId.toLowerCase()
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {s.logo ? (
                          <img src={s.logo} alt={s.shopName} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {s.shopId.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-white">{s.shopName}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            আইডি: <span className="font-mono text-emerald-400 font-bold">{s.shopId}</span> • {s.phone || s.ownerName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold shrink-0">
                        {loginShopId.toLowerCase() === s.shopId.toLowerCase() ? 'নির্বাচিত ✓' : 'লগইন নির্বাচন'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shop ID / Username / Name / Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                শপ আইডি, দোকানের নাম অথবা মোবাইল নম্বর
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Store className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={loginShopId}
                  onChange={(e) => setLoginShopId(e.target.value)}
                  placeholder="যেমন: bdc বা ব্রাদার্স ডিজিটাল বা 01309369789"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                আপনার শপ আইডি (<span className="font-mono text-emerald-400 font-bold">bdc</span>), অথবা দোকানের নাম, অথবা মোবাইল নম্বর লিখে লগইন করতে পারবেন।
              </p>
            </div>

            {/* Security PIN / Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                সিকিউরিটি পিন বা পাসওয়ার্ড (Security PIN / Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showLoginPin ? 'text' : 'password'}
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="৪-ডিজিটের পিন দিন (যেমন: 1235)"
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm font-bold text-white placeholder-slate-500 tracking-wider focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPin(!showLoginPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>ডিফল্ট মাস্টার পিন: <strong className="text-amber-300">1235</strong> বা <strong className="text-amber-300">1234</strong></span>
                <button
                  type="button"
                  onClick={() => setLoginPin('1235')}
                  className="text-emerald-400 hover:underline cursor-pointer font-bold"
                >
                  পিন পূরণ করুন
                </button>
              </div>
            </div>

            {/* Manual Database & SQL Code Accordion */}
            <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowManualSql(!showManualSql)}
                className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>ডাটাবেজে ম্যানুয়ালি তথ্য ঢুকানো ও SQL স্ক্রিপ্ট</span>
                </div>
                {showManualSql ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showManualSql && (
                <div className="mt-3 space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    আপনার Supabase ড্যাশবোর্ডে গিয়ে <strong>SQL Editor</strong> &gt; <strong>New Query</strong>-তে গিয়ে নিচের কোডটি পেস্ট করে <strong>Run</strong> বাটনে ক্লিক করলে সমস্ত টেবিল ও <code className="text-emerald-400 font-mono">bdc</code> দোকান তৈরি হয়ে যাবে:
                  </p>
                  <div className="relative">
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-300 max-h-48 overflow-y-auto leading-relaxed select-all">
{`-- ১. শপ সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS shop_settings (
  shop_id TEXT PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_subtitle TEXT,
  owner_name TEXT,
  phone1 TEXT,
  phone2 TEXT,
  address TEXT,
  email TEXT,
  opening_cash_balance NUMERIC DEFAULT 0,
  receipt_footer_note TEXT,
  receipt_type TEXT DEFAULT 'standard',
  admin_pin TEXT DEFAULT '1235',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. ব্রাদার্স ডিজিটাল সেন্টার (bdc) ইনসার্ট
INSERT INTO shop_settings (
  shop_id, shop_name, shop_subtitle, owner_name,
  phone1, phone2, address, email, opening_cash_balance,
  receipt_footer_note, receipt_type, admin_pin, updated_at
) VALUES (
  'bdc',
  'ব্রাদার্স ডিজিটাল সেন্টার',
  'Brothers Digital Center & Cyber Point',
  'শাহরিয়ার ইমন',
  '01309369789',
  '01518947904',
  'বটতলা বাজার, মদন, নেত্রকোনা',
  'brothersdigital.bd@gmail.com',
  15000,
  'আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!',
  'standard',
  '1235',
  NOW()
) ON CONFLICT (shop_id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  owner_name = EXCLUDED.owner_name,
  phone1 = EXCLUDED.phone1,
  admin_pin = EXCLUDED.admin_pin,
  updated_at = NOW();

-- ৩. এমএফএস একাউন্টস টেবিল
CREATE TABLE IF NOT EXISTS mfs_accounts (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_name TEXT NOT NULL,
  agent_number TEXT,
  balance NUMERIC DEFAULT 0,
  commission_earned_today NUMERIC DEFAULT 0,
  cash_in_today NUMERIC DEFAULT 0,
  cash_out_today NUMERIC DEFAULT 0,
  color TEXT
);

INSERT INTO mfs_accounts (id, shop_id, provider, account_name, agent_number, balance, color)
VALUES
  ('mfs-bkash-bdc', 'bdc', 'BKASH', 'বিকাশ এজেন্ট', '01309369789', 15000, '#E2136E'),
  ('mfs-nagad-bdc', 'bdc', 'NAGAD', 'নগদ এজেন্ট', '01309369789', 10000, '#F7941D'),
  ('mfs-rocket-bdc', 'bdc', 'ROCKET', 'রকেট এজেন্ট', '01309369789', 5000, '#8C3494')
ON CONFLICT (id) DO NOTHING;`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const sqlText = `-- ১. শপ সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS shop_settings (
  shop_id TEXT PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_subtitle TEXT,
  owner_name TEXT,
  phone1 TEXT,
  phone2 TEXT,
  address TEXT,
  email TEXT,
  opening_cash_balance NUMERIC DEFAULT 0,
  receipt_footer_note TEXT,
  receipt_type TEXT DEFAULT 'standard',
  admin_pin TEXT DEFAULT '1235',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. ব্রাদার্স ডিজিটাল সেন্টার (bdc) ইনসার্ট
INSERT INTO shop_settings (
  shop_id, shop_name, shop_subtitle, owner_name,
  phone1, phone2, address, email, opening_cash_balance,
  receipt_footer_note, receipt_type, admin_pin, updated_at
) VALUES (
  'bdc',
  'ব্রাদার্স ডিজিটাল সেন্টার',
  'Brothers Digital Center & Cyber Point',
  'শাহরিয়ার ইমন',
  '01309369789',
  '01518947904',
  'বটতলা বাজার, মদন, নেত্রকোনা',
  'brothersdigital.bd@gmail.com',
  15000,
  'আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!',
  'standard',
  '1235',
  NOW()
) ON CONFLICT (shop_id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  owner_name = EXCLUDED.owner_name,
  phone1 = EXCLUDED.phone1,
  admin_pin = EXCLUDED.admin_pin,
  updated_at = NOW();

-- ৩. এমএফএস একাউন্টস টেবিল
CREATE TABLE IF NOT EXISTS mfs_accounts (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_name TEXT NOT NULL,
  agent_number TEXT,
  balance NUMERIC DEFAULT 0,
  commission_earned_today NUMERIC DEFAULT 0,
  cash_in_today NUMERIC DEFAULT 0,
  cash_out_today NUMERIC DEFAULT 0,
  color TEXT
);

INSERT INTO mfs_accounts (id, shop_id, provider, account_name, agent_number, balance, color)
VALUES
  ('mfs-bkash-bdc', 'bdc', 'BKASH', 'বিকাশ এজেন্ট', '01309369789', 15000, '#E2136E'),
  ('mfs-nagad-bdc', 'bdc', 'NAGAD', 'নগদ এজেন্ট', '01309369789', 10000, '#F7941D'),
  ('mfs-rocket-bdc', 'bdc', 'ROCKET', 'রকেট এজেন্ট', '01309369789', 5000, '#8C3494')
ON CONFLICT (id) DO NOTHING;`;
                        navigator.clipboard.writeText(sqlText);
                        setSqlCopied(true);
                        setTimeout(() => setSqlCopied(false), 2500);
                      }}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      {sqlCopied ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-white" />
                          <span>SQL কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Custom Database Accordion */}
            <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowCustomDbLogin(!showCustomDbLogin)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">অন্য কোনো Supabase ডাটাবেজ ব্যবহার করবেন? (ঐচ্ছিক)</span>
                </div>
                {showCustomDbLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCustomDbLogin && (
                <div className="mt-3 space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Project URL</label>
                    <input
                      type="url"
                      value={customDbUrl}
                      onChange={(e) => setCustomDbUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Anon Key</label>
                    <input
                      type="text"
                      value={customDbKey}
                      onChange={(e) => setCustomDbKey(e.target.value)}
                      placeholder="eyJhb..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-950/50 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>দোকানে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Register link */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">নতুন দোকান খুলতে চান? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('register');
                  setRegError(null);
                }}
                className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                এখানে ক্লিক করে রেজিস্ট্রেশন করুন
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: REGISTRATION (NEW SHOP & DATABASE CONFIG)       */}
        {/* ======================================================== */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
            {regError && (
              <div className="p-3 bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* STEP 1: SHOP PROFILE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
                <Store className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">১. দোকানের প্রাথমিক তথ্য</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  দোকানের নাম (বাংলা বা ইংরেজি) *
                </label>
                <input
                  type="text"
                  required
                  value={regShopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  placeholder="যেমন: ব্রাদার্স ডিজিটাল সেন্টার / নিউ ঢাকা টেলিকম"
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  দোকানের স্লোগান বা ধরন (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={regShopSubtitle}
                  onChange={(e) => setRegShopSubtitle(e.target.value)}
                  placeholder="যেমন: কম্পিউটার, ফটোকপি ও মোবাইল ব্যাংকিং"
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    মালিক / প্রোপাইটরের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    placeholder="যেমন: শাহরিয়ার ইমন"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="যেমন: 01309369789"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  দোকানের ঠিকানা / লোকেশন *
                </label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="যেমন: বটতলা বাজার, মদন, নেত্রকোনা"
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  প্রারম্ভিক ক্যাশ ব্যালেন্স (ক্যাশ ড্রয়ারে শুরুর টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={regOpeningCash}
                  onChange={(e) => setRegOpeningCash(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* STEP 2: LOGO SELECTION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">২. দোকানের লোগো (Shop Logo)</h3>
                </div>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLogoMode('upload')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      logoMode === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ফাইল আপলোড
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('preset')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      logoMode === 'preset' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    রেডিমেড লোগো
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('url')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      logoMode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ইমেজ লিংক
                  </button>
                </div>
              </div>

              {/* Logo Preview Bar */}
              <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-600 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">
                    {regShopName || 'দোকানের নাম প্রিভিউ'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {regShopSubtitle || 'ডিজিটাল সেন্টার ও সেবা'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {logoPreview ? '✓ লোগো নির্বাচিত হয়েছে' : 'লোগো ফাইল নির্বাচন করুন বা রেডিমেড থেকে বেছে নিন'}
                  </div>
                </div>
              </div>

              {/* Logo Upload Input */}
              {logoMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>লোগো ছবি সিলেক্ট করুন (PNG, JPG, WEBP - Max 2MB)</span>
                  </button>
                </div>
              )}

              {/* Preset Logos */}
              {logoMode === 'preset' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setLogoPreview(preset.url);
                        setRegLogoUrl(preset.url);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        logoPreview === preset.url
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{preset.icon}</span>
                      <div className="text-[11px] font-bold leading-tight">{preset.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Logo URL Input */}
              {logoMode === 'url' && (
                <div>
                  <input
                    type="url"
                    value={regLogoUrl}
                    onChange={(e) => {
                      setRegLogoUrl(e.target.value);
                      setLogoPreview(e.target.value);
                    }}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* STEP 3: LOGIN ID & PIN */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
                <KeyRound className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">৩. যেকোনো ডিভাইস থেকে প্রবেশের তথ্য</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  শপ আইডি / ইউজার আইডি (Shop ID) *
                </label>
                <input
                  type="text"
                  required
                  value={regShopId}
                  onChange={(e) => setRegShopId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                  placeholder="যেমন: brothers-digital"
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  এই আইডি দিয়ে যেকোনো মোবাইল বা কম্পিউটারে লগইন করতে পারবেন (ইংরেজি ছোট হাতের অক্ষর)।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    পাসওয়ার্ড বা ৪-ডিজিট পিন *
                  </label>
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    required
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="যেমন: 1235"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 tracking-wider focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন *
                  </label>
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    required
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value)}
                    placeholder="আবার লিখুন"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 tracking-wider focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowRegPin(!showRegPin)}
                  className="hover:text-white cursor-pointer flex items-center gap-1"
                >
                  {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRegPin ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}</span>
                </button>
              </div>
            </div>

            {/* STEP 4: SUPABASE DATABASE CONFIGURATION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Database className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">৪. ডাটাবেজ তথ্য (Supabase Database)</h3>
                </div>
                <button
                  type="button"
                  onClick={handleTestDatabaseConnection}
                  disabled={isTestingDb}
                  className="px-2.5 py-1 bg-emerald-950 border border-emerald-600/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'পরীক্ষা হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                আপনার সমস্ত লেনদেন, কাস্টমার বাকি, স্টক এবং এমএফএস ব্যালেন্স আপনার নিজস্ব Supabase ডাটাবেজে স্থায়ীভাবে সেভ হবে। নিচে আপনার ডাটাবেজের বিবরণ রয়েছে:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  required
                  value={regDbUrl}
                  onChange={(e) => setRegDbUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Supabase Anon Key *
                </label>
                <textarea
                  rows={2}
                  required
                  value={regDbKey}
                  onChange={(e) => setRegDbKey(e.target.value)}
                  placeholder="sb_publishable_... বা eyJhbGci..."
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {dbTestStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    dbTestStatus.success
                      ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-600 text-rose-300'
                  }`}
                >
                  {dbTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{dbTestStatus.message}</span>
                </div>
              )}
            </div>

            {/* STEP 5: DATABASE TABLE CREATION (SQL SCRIPT) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">৫. ডেটাবেজ টেবিল তৈরি (SQL)</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRegSql}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {regSqlCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>১-ক্লিকে SQL কপি</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <Code className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-300 leading-relaxed space-y-1.5">
                    <p className="font-bold text-white text-xs">
                      নতুন Supabase প্রজেক্টে ডেটাবেজ টেবিল তৈরির সহজ নিয়ম:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>
                        উপরের <strong className="text-emerald-400 font-bold">"১-ক্লিকে SQL কপি"</strong> বাটনে ক্লিক করে স্ক্রিপ্টটি কপি করুন।
                      </li>
                      <li>
                        Supabase ড্যাশবোর্ডে গিয়ে বামের মেনু থেকে{' '}
                        <strong className="text-white font-bold">SQL Editor</strong>-এ যান ও{' '}
                        <strong className="text-white font-bold">New Query</strong> খুলুন।
                      </li>
                      <li>
                        কপিকৃত কোডটি পেস্ট করে নিচে সবুজ রঙের{' '}
                        <strong className="text-emerald-400 font-bold">Run</strong> বাটনে চাপুন।
                      </li>
                    </ol>
                    <p className="text-[10px] text-emerald-400/90 pt-1">
                      ✓ এটি স্বয়ংক্রিয়ভাবে shop_settings, transactions, customers, inventory_items, mfs_accounts টেবিল এবং রিয়েলটাইম লাইভ সিঙ্ক অ্যাক্টিভ করে দেবে।
                    </p>
                  </div>
                </div>

                {/* View/Hide SQL Toggle & Supabase Dashboard Link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRegSql(!showRegSql)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer flex items-center gap-1"
                  >
                    {showRegSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showRegSql ? 'SQL স্ক্রিপ্ট লুকান' : 'সম্পূর্ণ SQL স্ক্রিপ্ট দেখতে ক্লিক করুন'}</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Supabase Dashboard</span>
                  </a>
                </div>

                {showRegSql && (
                  <div className="relative mt-2">
                    <pre className="p-3 bg-slate-950 text-emerald-300 rounded-xl text-[10px] font-mono overflow-x-auto max-h-56 border border-slate-800 select-all leading-relaxed">
                      {getRegistrationSql()}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopyRegSql}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {regSqlCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{regSqlCopied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Submit Button */}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isRegistering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>রেজিস্ট্রেশন ও ডাটাবেজ সেটআপ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>রেজিস্ট্রেশন সম্পন্ন করুন ও দোকানে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Login link */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">ইতিমধ্যেই অ্যাকাউন্ট বা দোকান আছে? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('login');
                  setRegError(null);
                }}
                className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                এখানে ক্লিক করে সরাসরি লগইন করুন
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
        <div>Brothers Digital Center POS • Multi-Device Cloud Point of Sale</div>
        <div className="text-[11px] text-slate-600">
          যেকোনো ডিভাইস থেকে একযোগে রিয়েলটাইম হিসাব পরিচালনা করুন
        </div>
      </div>
    </div>
  );
};
