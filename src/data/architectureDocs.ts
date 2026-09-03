export interface DocSection {
  id: string;
  titleBn: string;
  titleEn: string;
  description: string;
  code: string;
  language: string;
}

export const ARCHITECTURE_DOCUMENTATION: {
  overview: string;
  databaseSchemas: DocSection[];
  apiEndpoints: DocSection[];
  singleFilePrototypeLayout: string;
} = {
  overview: `
### Brothers Digital Center (ব্রাদার্স ডিজিটাল সেন্টার)
#### System Architecture & High-Performance POS Specifications

- **Application Domain:** Digital Cyber Center, Studio Photography, Online e-Gov Form Fill-up (NID/Passport/Admission), Document Print & Photocopy, MFS Agent Banking (bKash/Nagad/Rocket), and Stationery POS.
- **Architectural Paradigm:** Full-Stack Reactive Architecture. 
  - **Client:** React 19 + Tailwind CSS + Lucide Icons + Motion Engine.
  - **Server/Backend:** Node.js (Express / Fastify) with either MongoDB (Mongoose ODM) or Relational SQL (SQLite / PostgreSQL / Cloud SQL).
  - **Transaction Integrity:** ACID guarantees for ledger entries; concurrent wallet balance updates with double-entry bookkeeping (Cash-in-Hand vs. MFS Agent e-Money vs. Accounts Receivable).
  `,

  databaseSchemas: [
    {
      id: 'mongo-schema',
      titleBn: 'মঙ্গোডিবি স্কিমা (MongoDB Mongoose Schema)',
      titleEn: 'MongoDB Mongoose Data Models',
      description: 'Production-ready Mongoose Schemas with compound indexes for fast date queries, customer relations, and atomic transactions.',
      language: 'javascript',
      code: `// =================================================================
// 1. MONGOOSE DATA MODELS (Brothers Digital Center POS)
// =================================================================
import mongoose, { Schema } from 'mongoose';

// -----------------------------------------------------------------
// A. Transaction Schema (Daily Income & Expense Ledger)
// -----------------------------------------------------------------
const TransactionSchema = new Schema({
  invoiceNo: { type: String, required: true, unique: true, index: true },
  type: { 
    type: String, 
    enum: ['INCOME', 'EXPENSE'], 
    required: true, 
    index: true 
  },
  category: {
    type: String,
    enum: [
      // Income categories
      'photocopy', 'print_bw', 'print_color', 'online_form',
      'photo_studio', 'laminating', 'mfs_fee', 'product_sale', 'other_income',
      // Expense categories
      'shop_rent', 'electricity_bill', 'supplies', 'internet_bill',
      'tea_snacks', 'maintenance', 'other_expense'
    ],
    required: true,
    index: true
  },
  categoryLabelBn: { type: String, required: true },
  categoryLabelEn: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'DUE'],
    default: 'CASH',
    required: true
  },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  linkedInventoryId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  note: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Compound index for fast daily/monthly report aggregation
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ paymentMethod: 1, createdAt: -1 });

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);

// -----------------------------------------------------------------
// B. Customer Due Ledger Schema (বকেয়া খাতা)
// -----------------------------------------------------------------
const CustomerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, index: true, trim: true },
  address: { type: String, trim: true },
  totalBilled: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  currentDue: { type: Number, default: 0, index: true },
  lastTransactionDate: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export const CustomerModel = mongoose.model('Customer', CustomerSchema);

// -----------------------------------------------------------------
// C. Customer Due Payment Record (বকেয়া পরিশোধের খতিয়ান)
// -----------------------------------------------------------------
const DuePaymentSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, enum: ['CASH', 'BKASH', 'NAGAD', 'ROCKET'], default: 'CASH' },
  receiptNo: { type: String, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export const DuePaymentModel = mongoose.model('DuePayment', DuePaymentSchema);

// -----------------------------------------------------------------
// D. Mobile Financial Services (MFS) Wallet Schema (বিকাশ/নগদ/রকেট)
// -----------------------------------------------------------------
const MFSAccountSchema = new Schema({
  provider: { type: String, enum: ['BKASH', 'NAGAD', 'ROCKET'], required: true, unique: true },
  accountName: { type: String, required: true },
  agentNumber: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  commissionEarnedToday: { type: Number, default: 0 },
  cashInToday: { type: Number, default: 0 },
  cashOutToday: { type: Number, default: 0 }
}, { timestamps: true });

export const MFSAccountModel = mongoose.model('MFSAccount', MFSAccountSchema);

// -----------------------------------------------------------------
// E. Inventory Item Schema (স্টক ও ইনভেন্টরি)
// -----------------------------------------------------------------
const InventoryItemSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  nameBn: { type: String, required: true },
  nameEn: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['paper', 'stationery', 'supplies', 'electronics'], 
    required: true 
  },
  stockQuantity: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'Pcs' },
  unitBn: { type: String, default: 'টি' },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  lastRestocked: { type: Date, default: Date.now }
}, { timestamps: true });

export const InventoryItemModel = mongoose.model('InventoryItem', InventoryItemSchema);`
    },
    {
      id: 'sqlite-schema',
      titleBn: 'এসকিউএল / এসকিউলাইট রিলেশনাল স্কিমা (SQLite / PostgreSQL DDL)',
      titleEn: 'Relational SQL DDL Schema',
      description: 'Normalized SQL tables with foreign key constraints, checks, triggers, and indices for standard relational storage.',
      language: 'sql',
      code: `-- =================================================================
-- 2. RELATIONAL SQL DDL SCHEMA (SQLite / PostgreSQL)
-- =================================================================

-- Customers Table (বকেয়া খাতা)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address TEXT,
    total_billed REAL DEFAULT 0.0 CHECK (total_billed >= 0),
    total_paid REAL DEFAULT 0.0 CHECK (total_paid >= 0),
    current_due REAL DEFAULT 0.0 CHECK (current_due >= 0),
    last_transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_due ON customers(current_due);

-- Inventory Items Table (স্টক)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name_bn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('paper', 'stationery', 'supplies', 'electronics')),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'Pcs',
    unit_bn TEXT NOT NULL DEFAULT 'টি',
    purchase_price REAL NOT NULL CHECK (purchase_price >= 0),
    selling_price REAL NOT NULL CHECK (selling_price >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    last_restocked DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_code ON inventory_items(code);

-- Transactions Table (দৈনিক লেনদেন)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT NOT NULL,
    category_label_bn TEXT NOT NULL,
    category_label_en TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'DUE')),
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    linked_inventory_id TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_inventory_id) REFERENCES inventory_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trx_type_created ON transactions(type, created_at);
CREATE INDEX IF NOT EXISTS idx_trx_payment ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_trx_customer ON transactions(customer_id);

-- Due Payment Records Table (বকেয়া আদায়ের হিসাব)
CREATE TABLE IF NOT EXISTS customer_due_payments (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET')),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- MFS Agent Accounts Table (বিকাশ / নগদ / রকেট এজেন্ট ওয়ালেট)
CREATE TABLE IF NOT EXISTS mfs_accounts (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL UNIQUE CHECK (provider IN ('BKASH', 'NAGAD', 'ROCKET')),
    account_name TEXT NOT NULL,
    agent_number TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0.0,
    commission_earned_today REAL NOT NULL DEFAULT 0.0,
    cash_in_today REAL NOT NULL DEFAULT 0.0,
    cash_out_today REAL NOT NULL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
    }
  ],

  apiEndpoints: [
    {
      id: 'post-transaction',
      titleBn: '১. ট্রানজেকশন সংরক্ষণ API (POST /api/transactions)',
      titleEn: '1. Record New Transaction (POST /api/transactions)',
      description: 'Records income/expense with automatic customer due adjustment and inventory stock deduction.',
      language: 'javascript',
      code: `// Express.js Route Handler
app.post('/api/transactions', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      type, category, categoryLabelBn, categoryLabelEn,
      amount, paymentMethod, customerId, customerName,
      customerPhone, linkedInventoryId, quantity = 1, note
    } = req.body;

    // 1. Generate human-readable invoice code
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await TransactionModel.countDocuments();
    const invoiceNo = \`BDC-\${todayStr}-\${String(count + 1).padStart(4, '0')}\`;

    // 2. Create the transaction record
    const transaction = new TransactionModel({
      invoiceNo,
      type,
      category,
      categoryLabelBn,
      categoryLabelEn,
      amount: Number(amount),
      paymentMethod,
      customerId: customerId || undefined,
      customerName,
      customerPhone,
      linkedInventoryId,
      note
    });
    await transaction.save({ session });

    // 3. If payment method is DUE and customer is linked, update customer due ledger
    if (paymentMethod === 'DUE') {
      let targetCustomer;
      if (customerId) {
        targetCustomer = await CustomerModel.findById(customerId).session(session);
      } else if (customerPhone) {
        targetCustomer = await CustomerModel.findOne({ phone: customerPhone }).session(session);
      }

      if (targetCustomer) {
        targetCustomer.totalBilled += Number(amount);
        targetCustomer.currentDue += Number(amount);
        targetCustomer.lastTransactionDate = new Date();
        await targetCustomer.save({ session });
      } else if (customerName && customerPhone) {
        // Auto-create new customer in due ledger
        await CustomerModel.create([{
          name: customerName,
          phone: customerPhone,
          totalBilled: Number(amount),
          totalPaid: 0,
          currentDue: Number(amount),
          lastTransactionDate: new Date()
        }], { session });
      }
    }

    // 4. If linked to inventory item, decrement stock atomically
    if (linkedInventoryId && type === 'INCOME') {
      const item = await InventoryItemModel.findById(linkedInventoryId).session(session);
      if (item) {
        item.stockQuantity = Math.max(0, item.stockQuantity - quantity);
        await item.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully (লেনদেন সফলভাবে সংরক্ষিত হয়েছে)',
      data: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, error: error.message });
  }
});`
    },
    {
      id: 'get-daily-profit',
      titleBn: '২. দৈনিক লাভ-ক্ষতি ও ক্যাশ ব্যালেন্স API (GET /api/reports/daily-profit)',
      titleEn: '2. Daily Net Profit & Cash Balance (GET /api/reports/daily-profit)',
      description: 'Calculates Today\'s Total Income, Total Expenses, Net Profit, Cash-in-Hand, and Pending Customer Dues.',
      language: 'javascript',
      code: `// Express.js Route: Calculate Daily Net Profit & Financial Health
app.get('/api/reports/daily-profit', async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // MongoDB Aggregation Pipeline
    const [summary] = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0] }
          },
          cashIncome: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'INCOME'] }, { $eq: ['$paymentMethod', 'CASH'] }] },
                '$amount',
                0
              ]
            }
          },
          cashExpense: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'EXPENSE'] }, { $eq: ['$paymentMethod', 'CASH'] }] },
                '$amount',
                0
              ]
            }
          },
          bKashIncome: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'INCOME'] }, { $eq: ['$paymentMethod', 'BKASH'] }] },
                '$amount',
                0
              ]
            }
          },
          nagadIncome: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'INCOME'] }, { $eq: ['$paymentMethod', 'NAGAD'] }] },
                '$amount',
                0
              ]
            }
          },
          dueIncome: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'INCOME'] }, { $eq: ['$paymentMethod', 'DUE'] }] },
                '$amount',
                0
              ]
            }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // Total outstanding dues across all customers
    const [dueAgg] = await CustomerModel.aggregate([
      { $group: { _id: null, totalPendingDues: { $sum: '$currentDue' } } }
    ]);

    const totalIncome = summary?.totalIncome || 0;
    const totalExpenses = summary?.totalExpenses || 0;
    const netProfit = totalIncome - totalExpenses;
    const cashInHand = (summary?.cashIncome || 0) - (summary?.cashExpense || 0);

    return res.json({
      success: true,
      data: {
        date: startOfDay.toISOString().slice(0, 10),
        totalIncome, // মোট আয়
        totalExpenses, // মোট খরচ
        netProfit, // নিট লাভ
        cashInHand, // হাতে নগদ ক্যাশ
        totalPendingDues: dueAgg?.totalPendingDues || 0, // মোট কাস্টমার বকেয়া
        channelBreakdown: {
          cash: summary?.cashIncome || 0,
          bKash: summary?.bKashIncome || 0,
          nagad: summary?.nagadIncome || 0,
          due: summary?.dueIncome || 0
        },
        transactionsCount: summary?.totalTransactions || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});`
    },
    {
      id: 'post-due-payment',
      titleBn: '৩. বকেয়া আদায় রেকর্ড API (POST /api/customers/:id/dues)',
      titleEn: '3. Record Customer Due Recovery (POST /api/customers/:id/dues)',
      description: 'Records partial or full settlement of outstanding dues and reflects it into cash-in-hand.',
      language: 'javascript',
      code: `app.post('/api/customers/:id/dues', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, paymentMethod = 'CASH', note } = req.body;
    const customer = await CustomerModel.findById(req.params.id).session(session);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be positive' });
    }

    // Adjust customer ledger
    customer.totalPaid += payAmount;
    customer.currentDue = Math.max(0, customer.currentDue - payAmount);
    customer.lastTransactionDate = new Date();
    await customer.save({ session });

    // Record due payment event
    const receiptNo = \`DUE-REC-\${Date.now().toString().slice(-6)}\`;
    const record = new DuePaymentModel({
      customerId: customer._id,
      amount: payAmount,
      paymentMethod,
      receiptNo,
      note
    });
    await record.save({ session });

    // Also log as an income transaction for daily cash accounting
    const transaction = new TransactionModel({
      invoiceNo: receiptNo,
      type: 'INCOME',
      category: 'other_income',
      categoryLabelBn: 'বকেয়া আদায় / পরিষদ',
      categoryLabelEn: \`Due Collection (\${customer.name})\`,
      amount: payAmount,
      paymentMethod,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      note: note || \`বকেয়া খাতা থেকে আদায় - \${customer.name}\`
    });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: 'Due payment recorded successfully',
      data: { customer, record, transaction }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, error: error.message });
  }
});`
    }
  ],

  singleFilePrototypeLayout: `<!-- ================================================================= -->
<!-- BROTHERS DIGITAL CENTER (ব্রাদার্স ডিজিটাল সেন্টার) -->
<!-- Single-File HTML5 + Tailwind CSS Prototype Template               -->
<!-- ================================================================= -->
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Brothers Digital Center POS Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Hind Siliguri', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <!-- Top Navigation Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
          BDC
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight">ব্রাদার্স ডিজিটাল সেন্টার</h1>
          <p class="text-xs text-slate-500">Brothers Digital Center • Point of Sale & Shop Management</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
          ● দোকান চালু আছে (Open)
        </span>
        <button class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs">
          + নতুন হিসাব যুক্ত করুন
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 py-6">
    <!-- Top 5 Key Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 font-medium">আজকের মোট আয় (Income)</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">৳ ৩,৭৬০</p>
        <p class="text-[11px] text-emerald-500 mt-1">↑ ৯টি লেনদেন সম্পন্ন</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 font-medium">আজকের মোট খরচ (Expense)</p>
        <p class="text-2xl font-bold text-rose-600 mt-1">৳ ৭৭০</p>
        <p class="text-[11px] text-rose-500 mt-1">কালি ও নাস্তা খরচ</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 font-medium">আজকের নিট লাভ (Net Profit)</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">৳ ২,৯৯০</p>
        <p class="text-[11px] text-slate-400 mt-1">মার্জিন: ৭৯.৫%</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 font-medium">হাতে নগদ ক্যাশ (Cash-in-Hand)</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">৳ ৮,৪২০</p>
        <p class="text-[11px] text-slate-400 mt-1">ড্রয়ারের নগদ টাকা</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 font-medium">রানিং বকেয়া (Total Dues)</p>
        <p class="text-2xl font-bold text-purple-600 mt-1">৳ ৫,৩৫০</p>
        <p class="text-[11px] text-purple-500 mt-1">৫ জন কাস্টমারের কাছে বাকি</p>
      </div>
    </div>

    <!-- Layout Grid: Form (Left) & Transaction List (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Quick Add Transaction Form (5 cols) -->
      <div class="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 class="text-base font-bold text-slate-800 border-b pb-3 mb-4">
          লেনদেন লিপিবদ্ধ করুন (Add Transaction)
        </h2>
        <form class="space-y-4">
          <div class="flex rounded-lg bg-slate-100 p-1">
            <button type="button" class="w-1/2 py-2 text-sm font-semibold rounded-md bg-emerald-600 text-white shadow-xs">
              + আয় / জমা (Income)
            </button>
            <button type="button" class="w-1/2 py-2 text-sm font-semibold rounded-md text-slate-600 hover:text-slate-900">
              - খরচ / ব্যয় (Expense)
            </button>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">সেবার ধরন (Service Category)</label>
            <select class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500">
              <option>ফটোকপি / জেরক্স (Photocopy)</option>
              <option>কম্পিউটার প্রিন্ট (B&W / Color)</option>
              <option>পাসপোর্ট / এনআইডি / অনলাইন আবেদন</option>
              <option>স্টুডিও ছবি তোলা ও ল্যাব প্রিন্ট</option>
              <option>লেমিনেশন সার্ভিস</option>
              <option>মোবাইল ব্যাংকিং ফি / ক্যাশআউট চার্জ</option>
              <option>স্টেশনারি পণ্য বিক্রি (কাগজ, ক্যাবল, পেনড্রাইভ)</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (Amount ৳)</label>
              <input type="number" placeholder="৳ 0.00" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম (Payment)</label>
              <select class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500">
                <option>নগদ ক্যাশ (Cash)</option>
                <option>বিকাশ (bKash)</option>
                <option>নগদ (Nagad)</option>
                <option>রকেট (Rocket)</option>
                <option>বকেয়া / বাকি (Due)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">কাস্টমারের নাম ও মোবাইল (ঐচ্ছিক)</label>
            <input type="text" placeholder="নাম ও ফোন নম্বর লিখুন" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">বিবরণ বা নোট (Note)</label>
            <textarea rows="2" placeholder="কাজের বিস্তারিত..." class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-xs transition">
            লেনদেন সংরক্ষণ করুন (Save Transaction)
          </button>
        </form>
      </div>

      <!-- Recent Transactions Table (7 cols) -->
      <div class="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between border-b pb-3 mb-4">
          <h2 class="text-base font-bold text-slate-800">আজকের লেনদেনসমূহ (Today's Transactions)</h2>
          <span class="text-xs text-slate-400">সর্বশেষ আপডেট: কিছুক্ষণ আগে</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-500 border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th class="py-2.5 px-3">চালান নং</th>
                <th class="py-2.5 px-3">সেবার বিবরণ</th>
                <th class="py-2.5 px-3">মাধ্যম</th>
                <th class="py-2.5 px-3 text-right">টাকা</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-mono font-medium text-slate-500">BDC-001</td>
                <td class="py-3 px-3">
                  <div class="font-semibold text-slate-800">পাসপোর্ট ও এনআইডি আবেদন</div>
                  <div class="text-[11px] text-slate-400">মোঃ শফিকুল ইসলাম</div>
                </td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">ক্যাশ</span></td>
                <td class="py-3 px-3 text-right font-bold text-emerald-600">+ ৳ ৩৫০</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-medium text-slate-500">BDC-002</td>
                <td class="py-3 px-3">
                  <div class="font-semibold text-slate-800">ফটোকপি (৫০ পৃষ্ঠা)</div>
                  <div class="text-[11px] text-slate-400">মাওলানা আব্দুল করিম</div>
                </td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">ক্যাশ</span></td>
                <td class="py-3 px-3 text-right font-bold text-emerald-600">+ ৳ ১৫০</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-medium text-slate-500">BDC-004</td>
                <td class="py-3 px-3">
                  <div class="font-semibold text-slate-800">নাস্তা ও চা খরচ</div>
                  <div class="text-[11px] text-slate-400">দোকানের নাস্তা</div>
                </td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-medium">খরচ</span></td>
                <td class="py-3 px-3 text-right font-bold text-rose-600">- ৳ ১২০</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`
};
