export type TransactionType = 'INCOME' | 'EXPENSE';

export type ServiceCategory =
  | 'photocopy'
  | 'print_bw'
  | 'print_color'
  | 'online_form'
  | 'photo_studio'
  | 'laminating'
  | 'mfs_fee'
  | 'product_sale'
  | 'other_income';

export type ExpenseCategory =
  | 'shop_rent'
  | 'electricity_bill'
  | 'supplies'
  | 'internet_bill'
  | 'tea_snacks'
  | 'maintenance'
  | 'other_expense';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'DUE';

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  type: TransactionType;
  category: ServiceCategory | ExpenseCategory;
  categoryLabelBn: string;
  categoryLabelEn: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabelBn: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  note?: string;
  items?: TransactionItem[];
  timestamp: string; // ISO date string
  mfsAccountId?: string;
  linkedInventoryId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalBilled: number;
  totalPaid: number;
  currentDue: number;
  lastTransactionDate: string;
  notes?: string;
}

export interface DuePaymentRecord {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  note?: string;
  receivedBy?: string;
}

export type MfsProvider = 'BKASH' | 'NAGAD' | 'ROCKET';

export interface MFSAccount {
  id: string;
  provider: MfsProvider;
  accountName: string;
  agentNumber: string;
  balance: number;
  commissionEarnedToday: number;
  cashInToday: number;
  cashOutToday: number;
  color: string;
}

export interface MfsLog {
  id: string;
  accountId: string;
  provider: MfsProvider;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  commission: number;
  customerPhone: string;
  trxId?: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  category: 'paper' | 'stationery' | 'supplies' | 'electronics';
  stockQuantity: number;
  unit: string;
  unitBn: string;
  purchasePrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  lastRestocked: string;
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashInHand: number;
  totalPendingDues: number;
  transactionsCount: number;
}

export interface ShopSettings {
  shopName: string;
  shopSubtitle: string;
  ownerName: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  openingCashBalance: number;
  receiptFooterNote: string;
  receiptType: 'standard' | 'thermal';
  adminPin: string;
  isPinProtectionEnabled: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  autoSync: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'transaction' | 'due' | 'mfs' | 'inventory' | 'system';
}
