import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Customer, InventoryItem, MFSAccount, Transaction } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const targetUrl = url || import.meta.env.VITE_SUPABASE_URL || '';
  const targetKey = anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!targetUrl || !targetKey) {
    return null;
  }

  if (cachedClient && currentUrl === targetUrl && currentKey === targetKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(targetUrl, targetKey, {
      auth: { persistSession: false },
    });
    currentUrl = targetUrl;
    currentKey = targetKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Test connection
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    // Try a simple select from any table or health check
    const { error } = await client.from('transactions').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's connected to Supabase project but tables need creation
      if (error.message.includes('relation "public.transactions" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Supabase প্রজেক্ট সফলভাবে সংযুক্ত হয়েছে! তবে টেবিলগুলো এখনও তৈরি করা হয়নি। নিচে দেওয়া SQL স্ক্রিপ্টটি রান করুন।',
        };
      }
      return { success: false, message: `সংযোগে সমস্যা: ${error.message}` };
    }
    return { success: true, message: 'Supabase সফলভাবে সংযুক্ত এবং ডেটাবেজ প্রস্তুত!' };
  } catch (err: any) {
    return { success: false, message: `সংযোগে ত্রুটি: ${err.message || 'Unknown error'}` };
  }
}

// Push local data to Supabase
export async function pushAllToSupabase(
  client: SupabaseClient,
  data: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Customers
    if (data.customers.length > 0) {
      const { error: custErr } = await client.from('customers').upsert(
        data.customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address || null,
          total_billed: c.totalBilled,
          total_paid: c.totalPaid,
          current_due: c.currentDue,
          last_transaction_date: c.lastTransactionDate,
          notes: c.notes || null,
        }))
      );
      if (custErr) throw new Error(`Customers sync failed: ${custErr.message}`);
    }

    // 2. Inventory
    if (data.inventory.length > 0) {
      const { error: invErr } = await client.from('inventory_items').upsert(
        data.inventory.map((i) => ({
          id: i.id,
          code: i.code,
          name_bn: i.nameBn,
          name_en: i.nameEn,
          category: i.category,
          stock_quantity: i.stockQuantity,
          unit: i.unit,
          unit_bn: i.unitBn,
          purchase_price: i.purchasePrice,
          selling_price: i.sellingPrice,
          low_stock_threshold: i.lowStockThreshold,
          last_restocked: i.lastRestocked,
        }))
      );
      if (invErr) throw new Error(`Inventory sync failed: ${invErr.message}`);
    }

    // 3. MFS Accounts
    if (data.mfsAccounts.length > 0) {
      const { error: mfsErr } = await client.from('mfs_accounts').upsert(
        data.mfsAccounts.map((m) => ({
          id: m.id,
          provider: m.provider,
          account_name: m.accountName,
          agent_number: m.agentNumber,
          balance: m.balance,
          commission_earned_today: m.commissionEarnedToday,
          cash_in_today: m.cashInToday,
          cash_out_today: m.cashOutToday,
          color: m.color,
        }))
      );
      if (mfsErr) throw new Error(`MFS sync failed: ${mfsErr.message}`);
    }

    // 4. Transactions
    if (data.transactions.length > 0) {
      const { error: trxErr } = await client.from('transactions').upsert(
        data.transactions.map((t) => ({
          id: t.id,
          invoice_no: t.invoiceNo,
          type: t.type,
          category: t.category,
          category_label_bn: t.categoryLabelBn,
          category_label_en: t.categoryLabelEn,
          amount: t.amount,
          payment_method: t.paymentMethod,
          payment_method_label_bn: t.paymentMethodLabelBn,
          customer_name: t.customerName || null,
          customer_phone: t.customerPhone || null,
          customer_id: t.customerId || null,
          linked_inventory_id: t.linkedInventoryId || null,
          note: t.note || null,
          timestamp: t.timestamp,
        }))
      );
      if (trxErr) throw new Error(`Transactions sync failed: ${trxErr.message}`);
    }

    return { success: true, message: 'সকল ডেটা সফলভাবে Supabase ক্লাউডে সিঙ্ক করা হয়েছে!' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// Pull cloud data from Supabase
export async function pullAllFromSupabase(
  client: SupabaseClient
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
  };
}> {
  try {
    const [trxRes, custRes, invRes, mfsRes] = await Promise.all([
      client.from('transactions').select('*').order('timestamp', { ascending: false }),
      client.from('customers').select('*').order('name'),
      client.from('inventory_items').select('*').order('name_bn'),
      client.from('mfs_accounts').select('*'),
    ]);

    if (trxRes.error) throw trxRes.error;
    if (custRes.error) throw custRes.error;
    if (invRes.error) throw invRes.error;
    if (mfsRes.error) throw mfsRes.error;

    const customers: Customer[] = (custRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address || undefined,
      totalBilled: Number(c.total_billed || 0),
      totalPaid: Number(c.total_paid || 0),
      currentDue: Number(c.current_due || 0),
      lastTransactionDate: c.last_transaction_date || new Date().toISOString(),
      notes: c.notes || undefined,
    }));

    const inventory: InventoryItem[] = (invRes.data || []).map((i: any) => ({
      id: i.id,
      code: i.code,
      nameBn: i.name_bn,
      nameEn: i.name_en,
      category: i.category,
      stockQuantity: Number(i.stock_quantity || 0),
      unit: i.unit || 'Pcs',
      unitBn: i.unit_bn || 'টি',
      purchasePrice: Number(i.purchase_price || 0),
      sellingPrice: Number(i.selling_price || 0),
      lowStockThreshold: Number(i.low_stock_threshold || 5),
      lastRestocked: i.last_restocked || new Date().toISOString(),
    }));

    const mfsAccounts: MFSAccount[] = (mfsRes.data || []).map((m: any) => ({
      id: m.id,
      provider: m.provider,
      accountName: m.account_name,
      agentNumber: m.agent_number,
      balance: Number(m.balance || 0),
      commissionEarnedToday: Number(m.commission_earned_today || 0),
      cashInToday: Number(m.cash_in_today || 0),
      cashOutToday: Number(m.cash_out_today || 0),
      color: m.color || (m.provider === 'BKASH' ? '#E2136E' : m.provider === 'NAGAD' ? '#F7941D' : '#8C3494'),
    }));

    const transactions: Transaction[] = (trxRes.data || []).map((t: any) => ({
      id: t.id,
      invoiceNo: t.invoice_no,
      type: t.type,
      category: t.category,
      categoryLabelBn: t.category_label_bn,
      categoryLabelEn: t.category_label_en,
      amount: Number(t.amount || 0),
      paymentMethod: t.payment_method,
      paymentMethodLabelBn: t.payment_method_label_bn,
      customerName: t.customer_name || undefined,
      customerPhone: t.customer_phone || undefined,
      customerId: t.customer_id || undefined,
      linkedInventoryId: t.linked_inventory_id || undefined,
      note: t.note || undefined,
      timestamp: t.timestamp,
    }));

    return {
      success: true,
      data: { transactions, customers, inventory, mfsAccounts },
    };
  } catch (err: any) {
    return { success: false, message: `ক্লাউড থেকে ডেটা আনতে ব্যর্থ: ${err.message}` };
  }
}

// Ready-to-use Supabase SQL setup script
export const SUPABASE_SETUP_SQL = `-- ==========================================
-- Brothers Digital Center - Supabase Schema
-- Run this in your Supabase SQL Editor (1-Click Setup)
-- ==========================================

-- 1. Customers Table (বকেয়া খাতা)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
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

-- 2. Inventory Items Table (স্টক ও ইনভেন্টরি)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
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

-- 3. MFS Accounts Table (মোবাইল ব্যাংকিং ওয়ালেট)
CREATE TABLE IF NOT EXISTS mfs_accounts (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    agent_number TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    commission_earned_today NUMERIC DEFAULT 0,
    cash_in_today NUMERIC DEFAULT 0,
    cash_out_today NUMERIC DEFAULT 0,
    color TEXT DEFAULT '#10b981'
);

-- 4. Transactions Table (দৈনিক লেনদেন)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label_bn TEXT NOT NULL,
    category_label_en TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_method_label_bn TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_id TEXT,
    linked_inventory_id TEXT,
    note TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and allow public anon access for single shop owner
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on inventory" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on mfs_accounts" ON mfs_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE customers, inventory_items, mfs_accounts, transactions;
`;
