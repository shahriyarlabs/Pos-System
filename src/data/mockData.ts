import { Customer, InventoryItem, MFSAccount, Transaction } from '../types';

// ==========================================
// CLEAN PRODUCTION DATA (Default for Netlify & Real Shop)
// ==========================================
export const CLEAN_CUSTOMERS: Customer[] = [];

export const CLEAN_TRANSACTIONS: Transaction[] = [];

export const CLEAN_INVENTORY: InventoryItem[] = [];

export const CLEAN_MFS_ACCOUNTS: MFSAccount[] = [
  {
    id: 'mfs-bkash',
    provider: 'BKASH',
    accountName: 'বিকাশ এজেন্ট (bKash)',
    agentNumber: '',
    balance: 0,
    commissionEarnedToday: 0,
    cashInToday: 0,
    cashOutToday: 0,
    color: '#E2136E',
  },
  {
    id: 'mfs-nagad',
    provider: 'NAGAD',
    accountName: 'নগদ এজেন্ট (Nagad)',
    agentNumber: '',
    balance: 0,
    commissionEarnedToday: 0,
    cashInToday: 0,
    cashOutToday: 0,
    color: '#F7941D',
  },
  {
    id: 'mfs-rocket',
    provider: 'ROCKET',
    accountName: 'রকেট এজেন্ট (Rocket)',
    agentNumber: '',
    balance: 0,
    commissionEarnedToday: 0,
    cashInToday: 0,
    cashOutToday: 0,
    color: '#8C3494',
  },
];

// By default, initialize with 100% clean data (No dummy sales, no dummy customers)
export const INITIAL_CUSTOMERS: Customer[] = CLEAN_CUSTOMERS;
export const INITIAL_TRANSACTIONS: Transaction[] = CLEAN_TRANSACTIONS;
export const INITIAL_INVENTORY: InventoryItem[] = CLEAN_INVENTORY;
export const INITIAL_MFS_ACCOUNTS: MFSAccount[] = CLEAN_MFS_ACCOUNTS;

// ==========================================
// STARTER INVENTORY TEMPLATES (Useful Cyber Cafe / Shop items)
// Users can add these in 1-click if they don't want to type names from scratch
// ==========================================
export const STARTER_INVENTORY_TEMPLATES: InventoryItem[] = [
  {
    id: 'tpl-1',
    code: 'PAP-A4-80',
    nameBn: 'A4 পেপার রিম (ডাবল এ ৮০ জিএসএম)',
    nameEn: 'A4 Paper Ream Double-A 80GSM',
    category: 'paper',
    stockQuantity: 0,
    unit: 'Ream',
    unitBn: 'রিম',
    purchasePrice: 480,
    sellingPrice: 560,
    lowStockThreshold: 5,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-2',
    code: 'PAP-A4-70',
    nameBn: 'A4 পেপার রিম (পেপার লাইন ৭০ জিএসএম)',
    nameEn: 'A4 Paper Ream 70GSM',
    category: 'paper',
    stockQuantity: 0,
    unit: 'Ream',
    unitBn: 'রিম',
    purchasePrice: 420,
    sellingPrice: 490,
    lowStockThreshold: 5,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-3',
    code: 'PAP-LEG-80',
    nameBn: 'লিগ্যাল পেপার রিম (৮০ জিএসএম)',
    nameEn: 'Legal Size Paper Ream 80GSM',
    category: 'paper',
    stockQuantity: 0,
    unit: 'Ream',
    unitBn: 'রিম',
    purchasePrice: 580,
    sellingPrice: 680,
    lowStockThreshold: 3,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-4',
    code: 'GLOSS-PHOTO-4R',
    nameBn: 'গ্লসি ফটো পেপার ৪R (১০০ পিস)',
    nameEn: 'Glossy Photo Paper 4R (100 pcs)',
    category: 'supplies',
    stockQuantity: 0,
    unit: 'Pack',
    unitBn: 'প্যাকেট',
    purchasePrice: 220,
    sellingPrice: 300,
    lowStockThreshold: 3,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-5',
    code: 'LAM-POUCH-A4',
    nameBn: 'লেমিনেশন পাউচ A4 (১০০ পিস)',
    nameEn: 'Laminating Pouch Film A4 (100 pcs)',
    category: 'supplies',
    stockQuantity: 0,
    unit: 'Pack',
    unitBn: 'প্যাকেট',
    purchasePrice: 380,
    sellingPrice: 500,
    lowStockThreshold: 3,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-6',
    code: 'LAM-POUCH-ID',
    nameBn: 'এনআইডি সাইজ লেমিনেশন পাউচ (১০০ পিস)',
    nameEn: 'ID Card Laminating Pouch (100 pcs)',
    category: 'supplies',
    stockQuantity: 0,
    unit: 'Pack',
    unitBn: 'প্যাকেট',
    purchasePrice: 120,
    sellingPrice: 200,
    lowStockThreshold: 5,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'tpl-7',
    code: 'USB-32GB-SANDISK',
    nameBn: 'সানডিস্ক ৩২জিবি পেনড্রাইভ (USB 3.0)',
    nameEn: 'SanDisk 32GB USB 3.0 Pendrive',
    category: 'electronics',
    stockQuantity: 0,
    unit: 'Pcs',
    unitBn: 'টি',
    purchasePrice: 420,
    sellingPrice: 550,
    lowStockThreshold: 2,
    lastRestocked: new Date().toISOString().slice(0, 10),
  },
];

// ==========================================
// DEMO / TEST DATA (Available on demand in Admin Panel for testing)
// ==========================================
export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'মাওলানা আব্দুল করিম (Karim Maulana)',
    phone: '01712-345678',
    address: 'বাজার মসজিদ রোড, ওয়ার্ড ৩',
    totalBilled: 3450,
    totalPaid: 2600,
    currentDue: 850,
    lastTransactionDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'মাদ্রাসার প্রশ্নপত্র প্রিন্ট ও ফটোকপি করান',
  },
  {
    id: 'cust-2',
    name: 'মোঃ রাসেল আহমেদ (Engr. Russel)',
    phone: '01819-987654',
    address: 'কলেজ রোড, ধানসিঁড়ি ভিলা',
    totalBilled: 5200,
    totalPaid: 4000,
    currentDue: 1200,
    lastTransactionDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    notes: 'ড্রয়িং প্রিন্ট ও পাসপোর্ট আবেদন',
  },
  {
    id: 'cust-3',
    name: 'সুমন মিয়া (Sumon Telecom)',
    phone: '01911-223344',
    address: 'পশ্চিম বাজার মার্কেট',
    totalBilled: 8600,
    totalPaid: 8100,
    currentDue: 500,
    lastTransactionDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    notes: 'রিম কাগজ ও ক্যাবল পাইকারি নেন',
  },
];

export const DEMO_MFS_ACCOUNTS: MFSAccount[] = [
  {
    id: 'mfs-bkash',
    provider: 'BKASH',
    accountName: 'বিকাশ এজেন্ট (bKash Agent)',
    agentNumber: '01715-098761',
    balance: 48500,
    commissionEarnedToday: 320,
    cashInToday: 24000,
    cashOutToday: 18500,
    color: '#E2136E',
  },
  {
    id: 'mfs-nagad',
    provider: 'NAGAD',
    accountName: 'নগদ উদ্যোক্তা (Nagad Agent)',
    agentNumber: '01918-445522',
    balance: 32400,
    commissionEarnedToday: 210,
    cashInToday: 15000,
    cashOutToday: 12000,
    color: '#F7941D',
  },
  {
    id: 'mfs-rocket',
    provider: 'ROCKET',
    accountName: 'রকেট এজেন্ট (Rocket Agent)',
    agentNumber: '01814-778899',
    balance: 19800,
    commissionEarnedToday: 140,
    cashInToday: 8000,
    cashOutToday: 5500,
    color: '#8C3494',
  },
];

export const DEMO_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    code: 'PAP-A4-80',
    nameBn: 'A4 পেপার রিম (ডাবল এ ৮০ জিএসএম)',
    nameEn: 'A4 Paper Ream Double-A 80GSM',
    category: 'paper',
    stockQuantity: 18,
    unit: 'Ream',
    unitBn: 'রিম',
    purchasePrice: 480,
    sellingPrice: 560,
    lowStockThreshold: 10,
    lastRestocked: '2026-08-28',
  },
  {
    id: 'inv-2',
    code: 'PAP-A4-70',
    nameBn: 'A4 পেপার রিম (পেপার লাইন ৭০ জিএসএম)',
    nameEn: 'A4 Paper Ream 70GSM',
    category: 'paper',
    stockQuantity: 6,
    unit: 'Ream',
    unitBn: 'রিম',
    purchasePrice: 420,
    sellingPrice: 490,
    lowStockThreshold: 10,
    lastRestocked: '2026-08-20',
  },
];

const now = Date.now();
const getPastDate = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString();

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-101',
    invoiceNo: 'BDC-2026-001',
    type: 'INCOME',
    category: 'online_form',
    categoryLabelBn: 'পাসপোর্ট ও এনআইডি আবেদন',
    categoryLabelEn: 'Passport / NID Online Application',
    amount: 350,
    paymentMethod: 'CASH',
    paymentMethodLabelBn: 'ক্যাশ নগদ',
    customerName: 'মোঃ শফিকুল ইসলাম',
    customerPhone: '01711-889922',
    note: 'ই-পাসপোর্ট নবায়ন ফরম পূরণ ও চালান জমা',
    timestamp: getPastDate(1.2),
  },
  {
    id: 'trx-102',
    invoiceNo: 'BDC-2026-002',
    type: 'INCOME',
    category: 'photocopy',
    categoryLabelBn: 'ফটোকপি / ফটোরূপ',
    categoryLabelEn: 'Photocopy (50 Pages)',
    amount: 150,
    paymentMethod: 'CASH',
    paymentMethodLabelBn: 'ক্যাশ নগদ',
    customerName: 'মাওলানা আব্দুল করিম',
    customerPhone: '01712-345678',
    note: '৫০ পৃষ্ঠা ডাবল সাইড ফটোকপি',
    timestamp: getPastDate(2.5),
  },
];
