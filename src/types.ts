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
<<<<<<< HEAD
  | 'owner_drawing'
=======
>>>>>>> c8bce4deaa0f4492c32d6a0b403b72cb39809e2d
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
  shopId?: string;
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
  shopId?: string;
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
  shopId?: string;
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
  shopId?: string;
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
  shopId?: string;
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
  shopLogo?: string; // Logo image URL or base64 data URI
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  openingCashBalance: number;
  receiptFooterNote: string;
<<<<<<< HEAD
  receiptType: 'standard' | 'thermal' | 'quarter_a4' | 'laser_a4' | 'laser_half' | 'laser_half_a4' | 'laser_quarter_a4' | 'laser_full_a4' | 'thermal_pos';
=======
  receiptType: 'standard' | 'thermal' | 'quarter_a4';
>>>>>>> c8bce4deaa0f4492c32d6a0b403b72cb39809e2d
  adminPin: string;
  adminUsername?: string;
  adminPassword?: string;
  isPinProtectionEnabled: boolean;
  shopKey: string;
  isCounterLocked?: boolean;
  requireLoginForEntireApp?: boolean;
<<<<<<< HEAD

  // Voucher, Signature & Laser/Thermal Printer Settings
  voucherSignature?: string; // Signature image (base64 data URI or image URL)
  voucherSignatureTitle?: string; // Title under signature (e.g. "স্বত্বাধিকারী / অনুমোদিত স্বাক্ষর")
  showSignatureOnReceipt?: boolean; // Toggle to print signature line
  showLogoOnReceipt?: boolean; // Toggle to print logo on receipt
  voucherPaperSize?: 'laser_half_a4' | 'laser_quarter_a4' | 'laser_full_a4' | 'thermal_pos';
  voucherCopiesCount?: 1 | 2; // 1 copy or 2 copies (Customer Copy + Office Copy)
  receiptGreeting?: string; // Top greeting text (e.g. "বিসমিল্লাহির রাহমানির রাহিম")
=======
>>>>>>> c8bce4deaa0f4492c32d6a0b403b72cb39809e2d
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

export interface UserSession {
  username: string;
  name: string;
  shopId: string;
  shopName: string;
  shopLogo?: string;
  role: 'owner' | 'admin' | 'cashier';
  loginTime: string;
}
