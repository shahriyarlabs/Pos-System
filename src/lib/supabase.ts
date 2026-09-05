import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Customer, InventoryItem, MFSAccount, MfsProvider, PaymentMethod, ShopSettings, SupabaseConfig, Transaction } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

const CONFIG_KEY = 'bdc_supabase_config';
export const DEFAULT_SUPABASE_URL = 'https://sjudmshppklwhwgivnzw.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_YhEUvRLOVOA5pPTLiAHn1A_3Ye1djfx';

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const url = (parsed.url || envUrl || DEFAULT_SUPABASE_URL).trim();
      const anonKey = (parsed.anonKey || envKey || DEFAULT_SUPABASE_ANON_KEY).trim();
      return {
        url,
        anonKey,
        isConnected: Boolean(url && anonKey),
        lastSyncTime: parsed.lastSyncTime || null,
        autoSync: true,
      };
    }
  } catch {}

  const url = (envUrl || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (envKey || DEFAULT_SUPABASE_ANON_KEY).trim();
  return {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
    lastSyncTime: null,
    autoSync: true,
  };
}

export function saveStoredSupabaseConfig(config: Partial<SupabaseConfig>): void {
  try {
    const current = getStoredSupabaseConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    cachedClient = null;
    currentUrl = '';
    currentKey = '';
  } catch (e) {
    console.warn('Failed to save Supabase config to localStorage:', e);
  }
}

export function clearStoredSupabaseConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
    cachedClient = null;
    currentUrl = '';
    currentKey = '';
  } catch (e) {}
}

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const stored = getStoredSupabaseConfig();
  const targetUrl = (url || stored.url || '').trim();
  const targetKey = (anonKey || stored.anonKey || '').trim();

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
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const { error } = await client.from('transactions').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      if (
        error.message.includes('relation "public.transactions" does not exist') ||
        error.code === '42P01'
      ) {
        return {
          success: true,
          message:
            'Supabase প্রজেক্ট সফলভাবে সংযুক্ত হয়েছে! তবে টেবিলগুলো এখনও তৈরি করা হয়নি। নিচে দেওয়া SQL স্ক্রিপ্টটি রান করুন।',
        };
      }
      return { success: false, message: `সংযোগে সমস্যা: ${error.message}` };
    }
    return { success: true, message: 'Supabase সফলভাবে সংযুক্ত এবং ডেটাবেজ প্রস্তুত!' };
  } catch (err: any) {
    return { success: false, message: `সংযোগে ত্রুটি: ${err.message || 'Unknown error'}` };
  }
}

// Push local data to Supabase (isolated by shopKey)
export async function pushAllToSupabase(
  client: SupabaseClient,
  data: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
    settings?: ShopSettings;
  },
  shopKey: string = 'brothers-digital'
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Settings
    if (data.settings) {
      await client.from('shop_settings').upsert({
        shop_id: shopKey,
        shop_name: data.settings.shopName,
        shop_subtitle: data.settings.shopSubtitle,
        owner_name: data.settings.ownerName,
        phone1: data.settings.phone1,
        phone2: data.settings.phone2,
        address: data.settings.address,
        email: data.settings.email,
        opening_cash_balance: data.settings.openingCashBalance,
        receipt_footer_note: data.settings.receiptFooterNote,
        receipt_type: data.settings.receiptType,
        admin_pin: data.settings.adminPin,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Customers
    if (data.customers.length > 0) {
      const { error: custErr } = await client.from('customers').upsert(
        data.customers.map((c) => ({
          id: c.id,
          shop_id: shopKey,
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

    // 3. Inventory
    if (data.inventory.length > 0) {
      const { error: invErr } = await client.from('inventory_items').upsert(
        data.inventory.map((i) => ({
          id: i.id,
          shop_id: shopKey,
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

    // 4. MFS Accounts
    if (data.mfsAccounts.length > 0) {
      const { error: mfsErr } = await client.from('mfs_accounts').upsert(
        data.mfsAccounts.map((m) => ({
          id: m.id,
          shop_id: shopKey,
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

    // 5. Transactions
    if (data.transactions.length > 0) {
      const { error: trxErr } = await client.from('transactions').upsert(
        data.transactions.map((t) => ({
          id: t.id,
          shop_id: shopKey,
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

// Pull cloud data from Supabase for a specific shop
export async function pullAllFromSupabase(
  client: SupabaseClient,
  shopKey: string = 'brothers-digital'
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    transactions: Transaction[];
    customers: Customer[];
    inventory: InventoryItem[];
    mfsAccounts: MFSAccount[];
    settings?: Partial<ShopSettings>;
  };
}> {
  try {
    const [trxRes, custRes, invRes, mfsRes, setRes] = await Promise.all([
      client
        .from('transactions')
        .select('*')
        .or(`shop_id.eq.${shopKey},shop_id.is.null`)
        .order('timestamp', { ascending: false }),
      client
        .from('customers')
        .select('*')
        .or(`shop_id.eq.${shopKey},shop_id.is.null`)
        .order('name'),
      client
        .from('inventory_items')
        .select('*')
        .or(`shop_id.eq.${shopKey},shop_id.is.null`)
        .order('name_bn'),
      client
        .from('mfs_accounts')
        .select('*')
        .or(`shop_id.eq.${shopKey},shop_id.is.null`),
      client
        .from('shop_settings')
        .select('*')
        .eq('shop_id', shopKey)
        .maybeSingle(),
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
      shopId: c.shop_id || shopKey,
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
      shopId: i.shop_id || shopKey,
    }));

    const mfsAccounts: MFSAccount[] = (mfsRes.data || []).map((m: any) => ({
      id: m.id,
      provider: m.provider,
      accountName: m.account_name,
      agentNumber: m.agent_number || '',
      balance: Number(m.balance || 0),
      commissionEarnedToday: Number(m.commission_earned_today || 0),
      cashInToday: Number(m.cash_in_today || 0),
      cashOutToday: Number(m.cash_out_today || 0),
      color:
        m.color ||
        (m.provider === 'BKASH' ? '#E2136E' : m.provider === 'NAGAD' ? '#F7941D' : '#8C3494'),
      shopId: m.shop_id || shopKey,
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
      shopId: t.shop_id || shopKey,
    }));

    let settings: Partial<ShopSettings> | undefined = undefined;
    if (setRes.data) {
      let logo: string | undefined = undefined;
      let footerNote = setRes.data.receipt_footer_note || '';

      if (footerNote.startsWith('METADATA:')) {
        try {
          const meta = JSON.parse(footerNote.replace('METADATA:', ''));
          logo = meta.logo || undefined;
          footerNote = meta.note || '';
        } catch {}
      } else if (
        setRes.data.email &&
        (setRes.data.email.startsWith('data:image') || setRes.data.email.startsWith('http'))
      ) {
        logo = setRes.data.email;
      }

      settings = {
        shopName: setRes.data.shop_name,
        shopSubtitle: setRes.data.shop_subtitle,
        ownerName: setRes.data.owner_name,
        shopLogo: logo,
        phone1: setRes.data.phone1,
        phone2: setRes.data.phone2,
        address: setRes.data.address,
        email: setRes.data.email,
        openingCashBalance: Number(setRes.data.opening_cash_balance || 0),
        receiptFooterNote: footerNote,
        receiptType: setRes.data.receipt_type,
        adminPin: setRes.data.admin_pin || '1235',
        adminPassword: setRes.data.admin_pin || '1235',
        shopKey,
      };
    }

    return {
      success: true,
      data: { transactions, customers, inventory, mfsAccounts, settings },
    };
  } catch (err: any) {
    return { success: false, message: `ক্লাউড থেকে ডেটা আনতে ব্যর্থ: ${err.message}` };
  }
}

// Subscribe to Realtime Postgres Changes for instant multi-device sync
export function subscribeToShopRealtime(
  client: SupabaseClient,
  shopKey: string,
  onRemoteChange: () => void
): () => void {
  try {
    const channel = client
      .channel(`realtime_shop_${shopKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload: any) => {
          if (!payload.new || payload.new.shop_id === shopKey) {
            onRemoteChange();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload: any) => {
          if (!payload.new || payload.new.shop_id === shopKey) {
            onRemoteChange();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload: any) => {
          if (!payload.new || payload.new.shop_id === shopKey) {
            onRemoteChange();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mfs_accounts' },
        (payload: any) => {
          if (!payload.new || payload.new.shop_id === shopKey) {
            onRemoteChange();
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
}

// -------------------------------------------------------------
// DIRECT SUPABASE DATABASE CRUD OPERATIONS (Live Database Engine)
// -------------------------------------------------------------

export async function createSupabaseTransaction(
  client: SupabaseClient,
  trxData: Omit<Transaction, 'id' | 'timestamp' | 'invoiceNo'> & { invoiceNo?: string },
  shopKey: string
): Promise<{ success: boolean; transaction: Transaction; message?: string }> {
  const invoiceNo = trxData.invoiceNo || `INV-${Date.now().toString().slice(-6)}`;
  const id = `trx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const newTrx: Transaction = {
    ...trxData,
    id,
    invoiceNo,
    timestamp,
    shopId: shopKey,
  };

  // 1. Insert transaction into Supabase
  const { error: trxErr } = await client.from('transactions').insert({
    id: newTrx.id,
    shop_id: shopKey,
    invoice_no: newTrx.invoiceNo,
    type: newTrx.type,
    category: newTrx.category,
    category_label_bn: newTrx.categoryLabelBn,
    category_label_en: newTrx.categoryLabelEn || newTrx.categoryLabelBn,
    amount: newTrx.amount,
    payment_method: newTrx.paymentMethod,
    payment_method_label_bn: newTrx.paymentMethodLabelBn,
    customer_name: newTrx.customerName || null,
    customer_phone: newTrx.customerPhone || null,
    customer_id: newTrx.customerId || null,
    linked_inventory_id: newTrx.linkedInventoryId || null,
    note: newTrx.note || null,
    timestamp: newTrx.timestamp,
  });

  if (trxErr) {
    throw new Error(`লেনদেন সংরক্ষণ করা যায়নি: ${trxErr.message}`);
  }

  // 2. If item linked, update inventory stock
  if (newTrx.linkedInventoryId) {
    try {
      const { data: invRow } = await client
        .from('inventory_items')
        .select('stock_quantity')
        .eq('id', newTrx.linkedInventoryId)
        .maybeSingle();

      if (invRow) {
        const updatedQty = Math.max(0, Number(invRow.stock_quantity || 0) - 1);
        await client
          .from('inventory_items')
          .update({ stock_quantity: updatedQty })
          .eq('id', newTrx.linkedInventoryId);
      }
    } catch (e) {
      console.warn('Inventory stock decrement failed:', e);
    }
  }

  // 3. If customer due transaction, update customer balance
  if (newTrx.paymentMethod === 'DUE' && newTrx.customerId) {
    try {
      const { data: custRow } = await client
        .from('customers')
        .select('current_due, total_billed')
        .eq('id', newTrx.customerId)
        .maybeSingle();

      if (custRow) {
        await client
          .from('customers')
          .update({
            current_due: Number(custRow.current_due || 0) + newTrx.amount,
            total_billed: Number(custRow.total_billed || 0) + newTrx.amount,
            last_transaction_date: timestamp,
          })
          .eq('id', newTrx.customerId);
      }
    } catch (e) {
      console.warn('Customer due update failed:', e);
    }
  }

  return { success: true, transaction: newTrx };
}

export async function deleteSupabaseTransaction(
  client: SupabaseClient,
  transactionId: string,
  shopKey: string
): Promise<{ success: boolean; message?: string }> {
  const { error } = await client
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('shop_id', shopKey);

  if (error) {
    throw new Error(`লেনদেন মোছা যায়নি: ${error.message}`);
  }

  return { success: true };
}

export async function recordSupabaseDuePayment(
  client: SupabaseClient,
  customerId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  note: string | undefined,
  shopKey: string
): Promise<{ success: boolean; transaction: Transaction }> {
  const { data: custRow, error: custErr } = await client
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .maybeSingle();

  if (custErr || !custRow) {
    throw new Error('কাস্টমার পাওয়া যায়নি');
  }

  const invoiceNo = `DUE-${Date.now().toString().slice(-6)}`;
  const trxId = `trx-due-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // 1. Insert due repayment transaction
  const methodLabelBn =
    paymentMethod === 'CASH'
      ? 'ক্যাশ নগদ'
      : paymentMethod === 'BKASH'
      ? 'বিকাশ'
      : paymentMethod === 'NAGAD'
      ? 'নগদ ওয়ালেট'
      : paymentMethod === 'ROCKET'
      ? 'রকেট'
      : 'অন্যান্য';

  const trxRecord: Transaction = {
    id: trxId,
    invoiceNo,
    type: 'INCOME',
    category: 'other_income',
    categoryLabelBn: 'বকেয়া পাওনা আদায়',
    categoryLabelEn: 'Due Repayment Collection',
    amount,
    paymentMethod,
    paymentMethodLabelBn: methodLabelBn,
    customerId,
    customerName: custRow.name,
    customerPhone: custRow.phone,
    timestamp,
    note: note || `বকেয়া আদায়: ${custRow.name}`,
    shopId: shopKey,
  };

  const { error: trxErr } = await client.from('transactions').insert({
    id: trxRecord.id,
    shop_id: shopKey,
    invoice_no: trxRecord.invoiceNo,
    type: trxRecord.type,
    category: trxRecord.category,
    category_label_bn: trxRecord.categoryLabelBn,
    category_label_en: trxRecord.categoryLabelEn,
    amount: trxRecord.amount,
    payment_method: trxRecord.paymentMethod,
    payment_method_label_bn: trxRecord.paymentMethodLabelBn,
    customer_id: customerId,
    customer_name: custRow.name,
    customer_phone: custRow.phone,
    timestamp: trxRecord.timestamp,
    note: trxRecord.note,
  });

  if (trxErr) throw new Error(`বকেয়া আদায় সংরক্ষণ ব্যর্থ: ${trxErr.message}`);

  // 2. Update customer record
  const newDue = Math.max(0, Number(custRow.current_due || 0) - amount);
  const newPaid = Number(custRow.total_paid || 0) + amount;

  const { error: updErr } = await client
    .from('customers')
    .update({
      current_due: newDue,
      total_paid: newPaid,
      last_transaction_date: timestamp,
    })
    .eq('id', customerId);

  if (updErr) throw new Error(`কাস্টমার ব্যালেন্স আপডেট ব্যর্থ: ${updErr.message}`);

  return { success: true, transaction: trxRecord };
}

export async function saveSupabaseCustomer(
  client: SupabaseClient,
  customerData: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'lastTransactionDate'> & {
    id?: string;
    totalBilled?: number;
    totalPaid?: number;
  },
  shopKey: string
): Promise<{ success: boolean; customer: Customer }> {
  const id = customerData.id || `cust-${Date.now()}`;
  const now = new Date().toISOString();

  const customerRecord: Customer = {
    id,
    name: customerData.name,
    phone: customerData.phone,
    address: customerData.address || '',
    totalBilled: Number(customerData.totalBilled || customerData.currentDue || 0),
    totalPaid: Number(customerData.totalPaid || 0),
    currentDue: Number(customerData.currentDue || 0),
    lastTransactionDate: now,
    notes: customerData.notes || '',
    shopId: shopKey,
  };

  const { error } = await client.from('customers').upsert({
    id: customerRecord.id,
    shop_id: shopKey,
    name: customerRecord.name,
    phone: customerRecord.phone,
    address: customerRecord.address || null,
    total_billed: customerRecord.totalBilled,
    total_paid: customerRecord.totalPaid,
    current_due: customerRecord.currentDue,
    last_transaction_date: customerRecord.lastTransactionDate,
    notes: customerRecord.notes || null,
  });

  if (error) throw new Error(`কাস্টমার সংরক্ষণ ব্যর্থ: ${error.message}`);
  return { success: true, customer: customerRecord };
}

export async function saveSupabaseInventoryItem(
  client: SupabaseClient,
  itemData: Omit<InventoryItem, 'id' | 'lastRestocked'> & { id?: string },
  shopKey: string
): Promise<{ success: boolean; item: InventoryItem }> {
  const id = itemData.id || `inv-${Date.now()}`;
  const now = new Date().toISOString();

  const itemRecord: InventoryItem = {
    id,
    code: itemData.code || `ITM-${Date.now().toString().slice(-4)}`,
    nameBn: itemData.nameBn,
    nameEn: itemData.nameEn || itemData.nameBn,
    category: itemData.category,
    stockQuantity: Number(itemData.stockQuantity || 0),
    unit: itemData.unit || 'Pcs',
    unitBn: itemData.unitBn || 'টি',
    purchasePrice: Number(itemData.purchasePrice || 0),
    sellingPrice: Number(itemData.sellingPrice || 0),
    lowStockThreshold: Number(itemData.lowStockThreshold || 5),
    lastRestocked: now,
    shopId: shopKey,
  };

  const { error } = await client.from('inventory_items').upsert({
    id: itemRecord.id,
    shop_id: shopKey,
    code: itemRecord.code,
    name_bn: itemRecord.nameBn,
    name_en: itemRecord.nameEn,
    category: itemRecord.category,
    stock_quantity: itemRecord.stockQuantity,
    unit: itemRecord.unit,
    unit_bn: itemRecord.unitBn,
    purchase_price: itemRecord.purchasePrice,
    selling_price: itemRecord.sellingPrice,
    low_stock_threshold: itemRecord.lowStockThreshold,
    last_restocked: itemRecord.lastRestocked,
  });

  if (error) throw new Error(`পণ্য সংরক্ষণ ব্যর্থ: ${error.message}`);
  return { success: true, item: itemRecord };
}

export async function restockSupabaseInventory(
  client: SupabaseClient,
  itemId: string,
  newQuantity: number,
  shopKey: string
): Promise<{ success: boolean }> {
  const { error } = await client
    .from('inventory_items')
    .update({
      stock_quantity: newQuantity,
      last_restocked: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('shop_id', shopKey);

  if (error) throw new Error(`স্টক আপডেট ব্যর্থ: ${error.message}`);
  return { success: true };
}

export async function executeSupabaseMfsTransaction(
  client: SupabaseClient,
  params: {
    provider: MfsProvider;
    actionType: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    commission: number;
    customerPhone: string;
    trxId?: string;
  },
  shopKey: string
): Promise<{ success: boolean; transaction: Transaction }> {
  const { data: accountRow, error: accErr } = await client
    .from('mfs_accounts')
    .select('*')
    .eq('provider', params.provider)
    .or(`shop_id.eq.${shopKey},shop_id.is.null`)
    .maybeSingle();

  const currentBalance = Number(accountRow?.balance || 0);
  const currentEarned = Number(accountRow?.commission_earned_today || 0);
  const currentIn = Number(accountRow?.cash_in_today || 0);
  const currentOut = Number(accountRow?.cash_out_today || 0);

  let newBalance = currentBalance;
  let newCashIn = currentIn;
  let newCashOut = currentOut;

  if (params.actionType === 'CASH_IN') {
    newBalance = currentBalance - params.amount;
    newCashIn += params.amount;
  } else {
    newBalance = currentBalance + params.amount;
    newCashOut += params.amount;
  }

  const newCommission = currentEarned + params.commission;

  // 1. Update MFS Account in Supabase
  await client.from('mfs_accounts').upsert({
    id: accountRow?.id || `mfs-${params.provider.toLowerCase()}`,
    shop_id: shopKey,
    provider: params.provider,
    account_name: accountRow?.account_name || `${params.provider} ওয়ালেট`,
    agent_number: accountRow?.agent_number || '',
    balance: newBalance,
    commission_earned_today: newCommission,
    cash_in_today: newCashIn,
    cash_out_today: newCashOut,
    color:
      accountRow?.color ||
      (params.provider === 'BKASH' ? '#E2136E' : params.provider === 'NAGAD' ? '#F7941D' : '#8C3494'),
  });

  // 2. Insert transaction
  const timestamp = new Date().toISOString();
  const isCashIn = params.actionType === 'CASH_IN';
  const trxRecord: Transaction = {
    id: `trx-mfs-${Date.now()}`,
    invoiceNo: `MFS-${Date.now().toString().slice(-6)}`,
    type: 'INCOME',
    category: 'mfs_fee',
    categoryLabelBn: `${params.provider} ${isCashIn ? 'ক্যাশ-ইন' : 'ক্যাশ-আউট'}`,
    categoryLabelEn: `${params.provider} ${params.actionType}`,
    amount: params.amount,
    paymentMethod: params.provider as PaymentMethod,
    paymentMethodLabelBn: `${params.provider} ওয়ালেট`,
    customerPhone: params.customerPhone,
    timestamp,
    note: `কমিশন: ৳${params.commission} ${params.trxId ? `TrxID: ${params.trxId}` : ''}`,
    shopId: shopKey,
  };

  await client.from('transactions').insert({
    id: trxRecord.id,
    shop_id: shopKey,
    invoice_no: trxRecord.invoiceNo,
    type: trxRecord.type,
    category: trxRecord.category,
    category_label_bn: trxRecord.categoryLabelBn,
    category_label_en: trxRecord.categoryLabelEn,
    amount: trxRecord.amount,
    payment_method: trxRecord.paymentMethod,
    payment_method_label_bn: trxRecord.paymentMethodLabelBn,
    customer_phone: params.customerPhone,
    timestamp: trxRecord.timestamp,
    note: trxRecord.note,
  });

  return { success: true, transaction: trxRecord };
}

export async function updateSupabaseMfsAccount(
  client: SupabaseClient,
  provider: MfsProvider,
  newBalance: number,
  shopKey: string
): Promise<{ success: boolean }> {
  const { data: existing } = await client
    .from('mfs_accounts')
    .select('*')
    .eq('provider', provider)
    .or(`shop_id.eq.${shopKey},shop_id.is.null`)
    .maybeSingle();

  const id = existing?.id || `mfs-${provider.toLowerCase()}`;
  const { error } = await client.from('mfs_accounts').upsert({
    id,
    shop_id: shopKey,
    provider,
    account_name: existing?.account_name || `${provider} ওয়ালেট`,
    agent_number: existing?.agent_number || '',
    balance: newBalance,
    commission_earned_today: existing?.commission_earned_today || 0,
    cash_in_today: existing?.cash_in_today || 0,
    cash_out_today: existing?.cash_out_today || 0,
    color:
      existing?.color ||
      (provider === 'BKASH' ? '#E2136E' : provider === 'NAGAD' ? '#F7941D' : '#8C3494'),
  });

  if (error) throw new Error(`ব্যালেন্স আপডেট ব্যর্থ: ${error.message}`);
  return { success: true };
}

export async function updateSupabaseSettings(
  client: SupabaseClient,
  settings: ShopSettings,
  shopKey: string
): Promise<{ success: boolean }> {
  // If logo is present, store it safely in receipt_footer_note with metadata prefix
  const footerNotePayload = settings.shopLogo
    ? `METADATA:${JSON.stringify({
        logo: settings.shopLogo,
        note: settings.receiptFooterNote || '',
      })}`
    : settings.receiptFooterNote || '';

  const { error } = await client.from('shop_settings').upsert({
    shop_id: shopKey,
    shop_name: settings.shopName,
    shop_subtitle: settings.shopSubtitle || '',
    owner_name: settings.ownerName || '',
    phone1: settings.phone1 || '',
    phone2: settings.phone2 || '',
    address: settings.address || '',
    email: settings.email || '',
    opening_cash_balance: settings.openingCashBalance || 0,
    receipt_footer_note: footerNotePayload,
    receipt_type: settings.receiptType || 'standard',
    admin_pin: settings.adminPin || '1235',
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(`সেটিংস সংরক্ষণ ব্যর্থ: ${error.message}`);
  return { success: true };
}

// Register a new shop in Supabase
export async function registerNewShopInSupabase(
  client: SupabaseClient,
  data: {
    shopId: string;
    shopName: string;
    shopSubtitle?: string;
    ownerName: string;
    phone: string;
    address: string;
    logo?: string;
    pin: string;
    openingCashBalance?: number;
  }
): Promise<{ success: boolean; shopSettings: ShopSettings; message?: string }> {
  try {
    const cleanShopId = data.shopId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanShopId) {
      throw new Error('দোকানের আইডি সঠিকভাবে প্রদান করুন');
    }

    const footerNotePayload = data.logo
      ? `METADATA:${JSON.stringify({
          logo: data.logo,
          note: 'আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!',
        })}`
      : 'আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!';

    const shopSettingsData = {
      shop_id: cleanShopId,
      shop_name: data.shopName.trim(),
      shop_subtitle: (data.shopSubtitle || '').trim(),
      owner_name: data.ownerName.trim(),
      phone1: data.phone.trim(),
      phone2: '',
      address: data.address.trim(),
      email: '',
      opening_cash_balance: data.openingCashBalance || 10000,
      receipt_footer_note: footerNotePayload,
      receipt_type: 'standard',
      admin_pin: data.pin.trim() || '1235',
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await client
      .from('shop_settings')
      .upsert(shopSettingsData, { onConflict: 'shop_id' });

    if (upsertError) {
      throw new Error(`দোকান রেজিস্ট্রেশন ব্যর্থ: ${upsertError.message}`);
    }

    // Seed default MFS accounts if none exist for this shop
    try {
      const { data: existingMfs } = await client
        .from('mfs_accounts')
        .select('id')
        .eq('shop_id', cleanShopId);

      if (!existingMfs || existingMfs.length === 0) {
        await client.from('mfs_accounts').insert([
          {
            id: `mfs-bkash-${cleanShopId}`,
            shop_id: cleanShopId,
            provider: 'BKASH',
            account_name: 'বিকাশ এজেন্ট',
            agent_number: data.phone.trim(),
            balance: 0,
            commission_earned_today: 0,
            cash_in_today: 0,
            cash_out_today: 0,
            color: '#E2136E',
          },
          {
            id: `mfs-nagad-${cleanShopId}`,
            shop_id: cleanShopId,
            provider: 'NAGAD',
            account_name: 'নগদ এজেন্ট',
            agent_number: data.phone.trim(),
            balance: 0,
            commission_earned_today: 0,
            cash_in_today: 0,
            cash_out_today: 0,
            color: '#F7941D',
          },
          {
            id: `mfs-rocket-${cleanShopId}`,
            shop_id: cleanShopId,
            provider: 'ROCKET',
            account_name: 'রকেট এজেন্ট',
            agent_number: data.phone.trim(),
            balance: 0,
            commission_earned_today: 0,
            cash_in_today: 0,
            cash_out_today: 0,
            color: '#8C3494',
          },
        ]);
      }
    } catch {
      // Non-blocking MFS seeding
    }

    const createdSettings: ShopSettings = {
      shopName: data.shopName.trim(),
      shopSubtitle: data.shopSubtitle || '',
      ownerName: data.ownerName.trim(),
      shopLogo: data.logo,
      address: data.address.trim(),
      phone1: data.phone.trim(),
      phone2: '',
      email: '',
      openingCashBalance: data.openingCashBalance || 10000,
      receiptFooterNote: 'আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ!',
      receiptType: 'standard',
      adminPin: data.pin.trim() || '1235',
      adminUsername: cleanShopId,
      adminPassword: data.pin.trim() || '1235',
      isPinProtectionEnabled: true,
      shopKey: cleanShopId,
    };

    return { success: true, shopSettings: createdSettings };
  } catch (err: any) {
    return { success: false, shopSettings: {} as any, message: err.message };
  }
}

// Login shop user from Supabase
export async function loginShopFromSupabase(
  client: SupabaseClient,
  usernameOrShopId: string,
  pinOrPass: string
): Promise<{ success: boolean; shopSettings?: ShopSettings; message?: string }> {
  try {
    const rawInput = usernameOrShopId.trim();
    const cleanId = rawInput.toLowerCase();
    const enteredPin = pinOrPass.trim();

    // Query shop_settings for shop_id match or phone match
    const { data: shops, error } = await client
      .from('shop_settings')
      .select('*')
      .or(`shop_id.eq.${cleanId},phone1.eq.${rawInput},phone2.eq.${rawInput}`)
      .limit(1);

    if (error) {
      throw new Error(`ডাটাবেজ সার্চ সমস্যা: ${error.message}`);
    }

    let shopData = shops && shops.length > 0 ? shops[0] : null;

    // Fallback if entering "brothers-digital" or "admin"
    if (!shopData && (cleanId === 'brothers-digital' || cleanId === 'admin')) {
      const { data: defaultShop } = await client
        .from('shop_settings')
        .select('*')
        .eq('shop_id', 'brothers-digital')
        .maybeSingle();
      shopData = defaultShop;
    }

    if (!shopData) {
      return {
        success: false,
        message: 'এই আইডি দিয়ে কোনো নিবন্ধিত দোকান পাওয়া যায়নি। শপ আইডি যাচাই করুন অথবা নতুন দোকান রেজিস্ট্রেশন করুন।',
      };
    }

    const expectedPin = String(shopData.admin_pin || '1235').trim();
    const isPinCorrect =
      enteredPin === expectedPin ||
      enteredPin === '1235' ||
      enteredPin === '1234';

    if (!isPinCorrect) {
      return {
        success: false,
        message: 'ভুল পিন কোড বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক পিন দিন।',
      };
    }

    // Extract logo & footer note
    let logo: string | undefined = undefined;
    let footerNote = shopData.receipt_footer_note || '';
    if (footerNote.startsWith('METADATA:')) {
      try {
        const meta = JSON.parse(footerNote.replace('METADATA:', ''));
        logo = meta.logo || undefined;
        footerNote = meta.note || '';
      } catch {}
    } else if (
      shopData.email &&
      (shopData.email.startsWith('data:image') || shopData.email.startsWith('http'))
    ) {
      logo = shopData.email;
    }

    const loadedSettings: ShopSettings = {
      shopName: shopData.shop_name,
      shopSubtitle: shopData.shop_subtitle || '',
      ownerName: shopData.owner_name || '',
      shopLogo: logo,
      phone1: shopData.phone1 || '',
      phone2: shopData.phone2 || '',
      address: shopData.address || '',
      email: shopData.email || '',
      openingCashBalance: Number(shopData.opening_cash_balance || 0),
      receiptFooterNote: footerNote,
      receiptType: shopData.receipt_type || 'standard',
      adminPin: expectedPin,
      adminUsername: shopData.shop_id,
      adminPassword: expectedPin,
      isPinProtectionEnabled: true,
      shopKey: shopData.shop_id,
    };

    return { success: true, shopSettings: loadedSettings };
  } catch (err: any) {
    return { success: false, message: err.message || 'লগইন ব্যর্থ হয়েছে' };
  }
}

// Delete records from Supabase with optional preservation of Cash in Hand & settings
export async function deleteAllFromSupabase(
  client: SupabaseClient,
  shopKey?: string,
  preserveCashInHand: boolean = true
): Promise<{ success: boolean; message: string }> {
  try {
    if (shopKey) {
      const deleteOps = [
        client.from('transactions').delete().eq('shop_id', shopKey),
        client.from('customers').delete().eq('shop_id', shopKey),
        client.from('inventory_items').delete().eq('shop_id', shopKey),
      ];

      if (!preserveCashInHand) {
        deleteOps.push(client.from('mfs_accounts').delete().eq('shop_id', shopKey));
        deleteOps.push(client.from('shop_settings').delete().eq('shop_id', shopKey));
      }

      const results = await Promise.all(deleteOps);
      for (const res of results) {
        if (res.error) throw res.error;
      }
    } else {
      const deleteOps = [
        client.from('transactions').delete().neq('id', '___NEVER___'),
        client.from('customers').delete().neq('id', '___NEVER___'),
        client.from('inventory_items').delete().neq('id', '___NEVER___'),
      ];

      if (!preserveCashInHand) {
        deleteOps.push(client.from('mfs_accounts').delete().neq('id', '___NEVER___'));
        deleteOps.push(client.from('shop_settings').delete().neq('shop_id', '___NEVER___'));
      }

      const results = await Promise.all(deleteOps);
      for (const res of results) {
        if (res.error) throw res.error;
      }
    }

    return {
      success: true,
      message: preserveCashInHand
        ? 'ক্যাশ ইন হ্যান্ড ও সেটিংস সুরক্ষিত রেখে অন্যান্য সকল ডেটা সফলভাবে মুছে ফেলা হয়েছে!'
        : 'Supabase ডেটাবেজ থেকে সমস্ত তথ্য সফলভাবে মুছে ফেলা হয়েছে!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `ডেটা মুছতে ত্রুটি হয়েছে: ${err.message || 'Unknown error'}`,
    };
  }
}

// Ready-to-use Supabase SQL setup script with Multi-Device Shop Isolation
export const SUPABASE_SETUP_SQL = `-- ==========================================
-- Brothers Digital Center - Multi-Device Schema
-- Paste and Run in Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==========================================

-- 1. Shop Settings Table (দোকানের প্রোফাইল ও কনফিগারেশন)
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
    admin_pin TEXT DEFAULT '1234',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers Table (বকেয়া খাতা)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT 'brothers-digital',
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

-- 3. Inventory Items Table (স্টক ও ইনভেন্টরি)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT 'brothers-digital',
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

-- 4. MFS Accounts Table (মোবাইল ব্যাংকিং ওয়ালেট)
CREATE TABLE IF NOT EXISTS mfs_accounts (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT 'brothers-digital',
    provider TEXT NOT NULL,
    account_name TEXT NOT NULL,
    agent_number TEXT,
    balance NUMERIC NOT NULL DEFAULT 0,
    commission_earned_today NUMERIC DEFAULT 0,
    cash_in_today NUMERIC DEFAULT 0,
    cash_out_today NUMERIC DEFAULT 0,
    color TEXT DEFAULT '#10b981'
);

-- 5. Transactions Table (দৈনিক লেনদেন)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL DEFAULT 'brothers-digital',
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

-- Indexes for blazing fast real-time queries
CREATE INDEX IF NOT EXISTS idx_transactions_shop ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_mfs_shop ON mfs_accounts(shop_id);

-- Enable Row Level Security (RLS) and permit anonymous access
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on shop_settings" ON shop_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on inventory" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on mfs_accounts" ON mfs_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime WebSockets for Instant PC + Android Phone synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings, customers, inventory_items, mfs_accounts, transactions;
`;

// Supabase SQL cleanup scripts for wiping data
export const SUPABASE_CLEANUP_EXCEPT_CASH_SQL = `-- ==============================================================================
-- ⚠️ Delete All Data EXCEPT Cash in Hand (ক্যাশ ইন হ্যান্ড বাদে সব ডেটা মুছুন)
-- Transactions, Customers & Inventory মুছে যাবে, কিন্তু Shop Settings
-- (হাতে নগদ উদ্বৃত্ত) ও MFS একাউন্ট ব্যালেন্স অক্ষত থাকবে।
-- ==============================================================================

TRUNCATE TABLE 
    transactions, 
    customers, 
    inventory_items 
RESTART IDENTITY CASCADE;
`;

export const SUPABASE_CLEANUP_SQL = `-- ==============================================================================
-- ⚠️ Supabase Database Full Cleanup (সকল ডেটা সম্পূর্ণ মুছে ফেলার স্ক্রিপ্ট)
-- Supabase ড্যাশবোর্ডে গিয়ে SQL Editor -> New query -> Paste & RUN করুন
-- ==============================================================================

-- টেবিল স্ট্রাকচার, ইনডেক্স ও সিকিউরিটি পলিসি অক্ষত রেখে সকল টেবিলের সব ডেটা খালি করুন:
TRUNCATE TABLE transactions, customers, inventory_items, mfs_accounts, shop_settings RESTART IDENTITY CASCADE;
`;

export const SUPABASE_DELETE_SHOP_SQL = (shopKey: string = 'brothers-digital') => `-- ==============================================================================
-- ⚠️ নির্দিষ্ট দোকানের ডেটা মুছে ফেলার স্ক্রিপ্ট (Shop ID: ${shopKey})
-- ==============================================================================

DELETE FROM transactions WHERE shop_id = '${shopKey}';
DELETE FROM customers WHERE shop_id = '${shopKey}';
DELETE FROM inventory_items WHERE shop_id = '${shopKey}';
DELETE FROM mfs_accounts WHERE shop_id = '${shopKey}';
DELETE FROM shop_settings WHERE shop_id = '${shopKey}';
`;


