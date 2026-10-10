import { Customer, InventoryItem, MFSAccount, Transaction } from '../types';

// ==========================================
// 100% CLEAN PRODUCTION DATA (NO DEMO / NO DUMMY VALUES)
// ==========================================

export const CLEAN_CUSTOMERS: Customer[] = [];
export const CLEAN_TRANSACTIONS: Transaction[] = [];
export const CLEAN_INVENTORY: InventoryItem[] = [];

export const CLEAN_MFS_ACCOUNTS: MFSAccount[] = [
  {
    id: 'mfs-bkash',
    provider: 'BKASH',
    accountName: 'বিকাশ এজেন্ট (bKash Agent)',
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
    accountName: 'নগদ উদ্যোক্তা (Nagad Agent)',
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
    accountName: 'রকেট এজেন্ট (Rocket Agent)',
    agentNumber: '',
    balance: 0,
    commissionEarnedToday: 0,
    cashInToday: 0,
    cashOutToday: 0,
    color: '#8C3494',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = CLEAN_CUSTOMERS;
export const INITIAL_TRANSACTIONS: Transaction[] = CLEAN_TRANSACTIONS;
export const INITIAL_INVENTORY: InventoryItem[] = CLEAN_INVENTORY;
export const INITIAL_MFS_ACCOUNTS: MFSAccount[] = CLEAN_MFS_ACCOUNTS;
