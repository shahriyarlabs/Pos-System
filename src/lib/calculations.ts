import {
  Customer,
  InventoryItem,
  MFSAccount,
  ShopSettings,
  Transaction,
} from '../types';

export interface CalculationAudit {
  openingCash: number; // Previous day's closing cash (আজকের প্রারম্ভিক ক্যাশ = পূর্ববর্তী দিনের ক্যাশ)
  initialRegistrationCash: number; // দোকান রেজিস্ট্রেশন প্রারম্ভিক ক্যাশ
  pastDaysNetCash: number; // পূর্ববর্তী দিনগুলোর নেট ক্যাশ ব্যালেন্স
  cashSalesIncome: number;
  dueCollectedInCash: number;
  ownerCashDeposits: number; // মালিকের ড্রয়ারে টাকা যুক্ত/জমা (শুধু ক্যাশ বাড়বে, MFS ব্যাংকিং নয়)
  mfsCashInReceived: number;
  totalCashInflow: number;

  cashExpenses: number;
  ownerCashWithdrawals: number; // মালিকের ড্রয়ার উত্তোলন (শুধু ক্যাশ কমবে, MFS ব্যাংকিং নয়)
  mfsCashOutPaid: number;
  totalCashOutflow: number;

  netCashInHand: number;

  // Revenue & Profit
  totalSalesAndServicesIncome: number;
  totalOperatingExpenses: number;
  mfsCommissionsEarned: number;
  netOperatingProfit: number;
  todayDueSalesIncome: number; // আজকের বাকি বিক্রয় (যা ড্রয়ার ক্যাশে যোগ হয়নি)

  // Owner Equity, Capital & Drawing (মালিকের মূলধন ও উত্তোলন খতিয়ান মেট্রিক্স)
  totalOwnerCapitalInvested: number; // সর্বমোট বিনিয়োগকৃত মূলধন (প্রারম্ভিক মূলধন + মালিকের সব জমা)
  totalOwnerDrawings: number; // সর্বমোট মালিকের উত্তোলন (ব্যক্তিগত খরচ/ড্রয়িং)
  netOwnerCapitalRemaining: number; // বর্তমান অবশিষ্ট মূলধন স্থিতি
  excessDrawingsFromIncome: number; // মূলধনের অতিরিক্ত উত্তোলন (যা ব্যবসায়ের আয়/লাভ হ্রাস করে)
  adjustedNetProfit: number; // মূলধনের অতিরিক্ত উত্তোলন সমন্বয়ের পর অবশিষ্ট নিট মুনাফা
  todayOwnerDeposits: number; // আজকের মূলধন জমা / টাকা যুক্ত
  todayOwnerDrawings: number; // আজকের মালিকের উত্তোলন
  todayNetCapitalChange: number; // আজকের মূলধনের নিট পরিবর্তন

  // Digital & Other Balances
  digitalIncomeBkash: number;
  digitalIncomeNagad: number;
  digitalIncomeRocket: number;
  totalMfsElectronicBalance: number;

  // Market Dues
  totalPendingCustomerDues: number;
  activeDueCustomersCount: number;

  // Inventory Asset Value
  totalInventoryPurchaseValue: number;
  totalInventoryRetailValue: number;
  inventoryGrossMarginProjected: number;
  lowStockItemsCount: number;

  // Total Business Liquidity / Net Worth
  totalBusinessLiquidAssets: number;
}

/**
 * Standardizes ISO date comparison for today
 */
export function isToday(timestamp: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Identifies if a transaction is an Owner Deposit / Capital Injection
 * মালিকের টাকা যুক্ত / মূলধন বিনিয়োগ (আয় নয়, মূলধন বৃদ্ধি)
 */
export function isOwnerDepositTrx(trx: Transaction): boolean {
  if (!trx) return false;
  return (
    (trx.category as string) === 'owner_deposit' ||
    Boolean(
      trx.categoryLabelBn &&
      (trx.categoryLabelBn.includes('জমা') || trx.categoryLabelBn.includes('যুক্ত') || trx.categoryLabelBn.includes('মূলধন')) &&
      trx.categoryLabelBn.includes('মালিক')
    ) ||
    Boolean(trx.categoryLabelEn && /owner deposit|capital|owner cash/i.test(trx.categoryLabelEn)) ||
    Boolean(trx.note && /মালিক.*(জমা|যুক্ত|মূলধন)|owner.*(deposit|capital)/i.test(trx.note))
  );
}

/**
 * Identifies if a transaction is an Owner Drawing / Withdrawal
 * মালিকের উত্তোলন (ব্যক্তিগত খরচ, ড্রয়ারের ক্যাশ হ্রাস)
 */
export function isOwnerDrawingTrx(trx: Transaction): boolean {
  if (!trx) return false;
  return (
    (trx.category as string) === 'owner_drawing' ||
    Boolean(trx.categoryLabelBn && (trx.categoryLabelBn.includes('উত্তোলন') || trx.categoryLabelBn.includes('ড্রয়িং'))) ||
    Boolean(trx.categoryLabelEn && /drawing|withdraw/i.test(trx.categoryLabelEn)) ||
    Boolean(trx.note && /উত্তোলন|ড্রয়িং|drawing|withdraw/i.test(trx.note))
  );
}

/**
 * Checks if a transaction date is strictly prior to today
 */
export function isBeforeToday(timestamp: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return date.getTime() < startOfToday;
}

/**
 * Performs full mathematical audit & reconciliation of all accounts
 * রুল: হাতে নগদ হিসাব (Cash in Drawer Formula) হবে পূর্ববর্তী দিনের ক্যাশ।
 * প্রারম্ভিক ক্যাশ শুধুমাত্র দোকান রেজিস্ট্রেশন এর দিন দিলেই হবে।
 * মালিকের উত্তোলন: শুধু ড্রয়ারের নগদ ক্যাশ কমবে (MFS এ কোনো প্রভাব নেই)।
 * বাকী খাতা: বাকি বিক্রিতে ক্যাশ বাড়ে না, গ্রাহক পরিশোধ করলেই কেবল ড্রয়ারে ক্যাশ বাড়ে।
 * মালিকের মূলধন: টাকা যুক্ত বা উত্তোলন মূলধন পরিবর্তন করে, আয় নয়। মূলধনের অতিরিক্ত উত্তোলন আয় হ্রাস করে।
 */
export function auditAllCalculations(
  settings: ShopSettings,
  transactions: Transaction[],
  mfsAccounts: MFSAccount[],
  customers: Customer[],
  inventory: InventoryItem[]
): CalculationAudit {
  // দোকান রেজিস্ট্রেশন এর প্রারম্ভিক ক্যাশ / মূলধন
  const initialRegistrationCash = Number(settings?.openingCashBalance || 0);

  // 1. Transactions breakdown (পূর্ববর্তী দিন ও আজকের হিসাব পৃথকীকরণ)
  let pastCashInflow = 0;
  let pastCashOutflow = 0;

  let cashSalesIncome = 0;
  let dueCollectedInCash = 0;
  let todayDueSalesIncome = 0;
  let ownerCashDeposits = 0;
  let cashExpenses = 0;
  let ownerCashWithdrawals = 0;
  let digitalIncomeBkash = 0;
  let digitalIncomeNagad = 0;
  let digitalIncomeRocket = 0;
  let totalSalesAndServicesIncome = 0;
  let totalOperatingExpenses = 0;

  // সর্বমোট মূলধন ও ড্রয়িং হিসাব (All-Time Owner Equity Ledger)
  let allTimeOwnerDeposits = 0;
  let allTimeOwnerDrawings = 0;

  for (const trx of transactions) {
    const isOwnerDep = isOwnerDepositTrx(trx);
    const isOwnerDraw = isOwnerDrawingTrx(trx);

    if (isOwnerDep) {
      allTimeOwnerDeposits += Number(trx.amount || 0);
    } else if (isOwnerDraw) {
      allTimeOwnerDrawings += Number(trx.amount || 0);
    }

    const isTrxToday = isToday(trx.timestamp);
    const isTrxBeforeToday = isBeforeToday(trx.timestamp);

    // পূর্ববর্তী দিনগুলোর ক্যাশ হিসাব (বিগত দিনের সমাপনী ক্যাশ নির্ধারণের জন্য)
    // বাকি বিক্রি (DUE) কখনো ক্যাশে যোগ হয়নি; বকেয়া পরিশোধ হলে তা CASH হিসেবে যুক্ত হয়েছে
    if (isTrxBeforeToday) {
      if (trx.paymentMethod === 'CASH') {
        if (trx.type === 'INCOME') {
          pastCashInflow += trx.amount;
        } else if (trx.type === 'EXPENSE') {
          pastCashOutflow += trx.amount;
        }
      }
    }

    // আজকের দিনের হিসাব
    if (isTrxToday) {
      if (trx.type === 'INCOME') {
        const isDueRepayment =
          !isOwnerDep &&
          ((trx.category === 'other_income' || (trx.category as string) === 'due_collection') &&
          (
            (trx.categoryLabelBn && (trx.categoryLabelBn.includes('বাকি') || trx.categoryLabelBn.includes('বকেয়া'))) ||
            (trx.categoryLabelEn && /due|repayment|credit/i.test(trx.categoryLabelEn)) ||
            (trx.note && (trx.note.includes('বকেয়া') || trx.note.includes('বাকি')))
          ));

        if (isOwnerDep) {
          // মালিকের ড্রয়ারে টাকা যুক্ত / মূলধন ক্যাশ জমা:
          // শুধুমাত্র ড্রয়ারের নগদ ক্যাশ বৃদ্ধি পায়! কোনো এমএফএস ব্যাংকিং প্রয়োজন নেই।
          // এটি বিক্রয় আয় নয়, এটি মালিকের মূলধন বৃদ্ধি।
          if (trx.paymentMethod === 'CASH') {
            ownerCashDeposits += trx.amount;
          }
        } else if (isDueRepayment) {
          // বকেয়া আদায় / পরিশোধ:
          // গ্রাহক বাকির টাকা পরিশোধ করলে তবেই ড্রয়ারের ক্যাশ বৃদ্ধি পায়!
          if (trx.paymentMethod === 'CASH') {
            dueCollectedInCash += trx.amount;
          } else if (trx.paymentMethod === 'BKASH') {
            digitalIncomeBkash += trx.amount;
          } else if (trx.paymentMethod === 'NAGAD') {
            digitalIncomeNagad += trx.amount;
          } else if (trx.paymentMethod === 'ROCKET') {
            digitalIncomeRocket += trx.amount;
          }
        } else {
          // নতুন সেবা বা বিক্রয় আয় (নগদ বা বাকি বা ডিজিটাল):
          totalSalesAndServicesIncome += trx.amount;

          if (trx.paymentMethod === 'CASH') {
            // নগদ বিক্রয়: ড্রয়ারের ক্যাশ বৃদ্ধি পাবে
            cashSalesIncome += trx.amount;
          } else if (trx.paymentMethod === 'DUE') {
            // বাকিতে সেবা/পণ্য বিক্রি: ক্যাশ ড্রয়ারে ১ পয়সাও বাড়বে না ("বাকী খাতাও ক্যাশ বারবে না")
            // এটি কাস্টমারের বকেয়া খাতায় জমা হয়
            todayDueSalesIncome += trx.amount;
          } else if (trx.paymentMethod === 'BKASH') {
            digitalIncomeBkash += trx.amount;
          } else if (trx.paymentMethod === 'NAGAD') {
            digitalIncomeNagad += trx.amount;
          } else if (trx.paymentMethod === 'ROCKET') {
            digitalIncomeRocket += trx.amount;
          }
        }
      } else if (trx.type === 'EXPENSE') {
        if (isOwnerDraw) {
          // মালিকের ড্রয়ার উত্তোলন:
          // এটি সাধারণ দোকান পরিচালন খরচ নয়, তবে ড্রয়ার থেকে নগদ টাকা উত্তোলিত হয়েছে ("উত্তোলন কৃত টাকাও খরচ")
          // শুধুমাত্র ড্রয়ারের নগদ ক্যাশ কমবে। এমএফএস ব্যাংকিংয়ে কোনো পরিবর্তন হবে না!
          if (trx.paymentMethod === 'CASH') {
            ownerCashWithdrawals += trx.amount;
          }
        } else {
          // সাধারণ দোকান পরিচালনা খরচ (ভাড়া, বিদ্যুৎ, মাল ক্রয় ইত্যাদি)
          totalOperatingExpenses += trx.amount;
          if (trx.paymentMethod === 'CASH') {
            cashExpenses += trx.amount;
          }
        }
      }
    }
  }

  // 2. MFS Calculations (আজকের)
  let mfsCashInReceived = 0;
  let mfsCashOutPaid = 0;
  let mfsCommissionsEarned = 0;
  let totalMfsElectronicBalance = 0;

  for (const acc of mfsAccounts) {
    totalMfsElectronicBalance += Number(acc.balance || 0);
    mfsCommissionsEarned += Number(acc.commissionEarnedToday || 0);
    mfsCashInReceived += Number(acc.cashInToday || 0);
    mfsCashOutPaid += Number(acc.cashOutToday || 0);
  }

  // 3. পূর্ববর্তী দিনের ক্যাশ ও আজকের প্রারম্ভিক ক্যাশ হিসাব:
  // প্রারম্ভিক ক্যাশ শুধুমাত্র দোকান রেজিস্ট্রেশনের দিন দিলেই হয়।
  // এরপর প্রতিদিন সকালের প্রারম্ভিক ক্যাশ = পূর্ববর্তী দিনের সমাপনী ক্যাশ।
  const pastDaysNetCash = pastCashInflow - pastCashOutflow;
  const previousDayClosingCash = Number((initialRegistrationCash + pastDaysNetCash).toFixed(2));
  const openingCash = previousDayClosingCash;

  // 4. আজকের ক্যাশ আগমন ও বহির্গমন (ড্রয়ার ফর্মুলা):
  // আগমন = প্রারম্ভিক ক্যাশ + নগদ বিক্রি + বকেয়া আদায় + মালিকের ক্যাশ জমা + এমএফএস ক্যাশ-ইন (কাস্টমার নগদ দিয়েছে)
  // বহির্গমন = দোকান খরচ + মালিকের ক্যাশ উত্তোলন + এমএফএস ক্যাশ-আউট (কাস্টমারকে নগদ দেওয়া হয়েছে)
  const totalCashInflow = openingCash + cashSalesIncome + dueCollectedInCash + ownerCashDeposits + mfsCashInReceived;
  const totalCashOutflow = cashExpenses + ownerCashWithdrawals + mfsCashOutPaid;
  const netCashInHand = Number((totalCashInflow - totalCashOutflow).toFixed(2));

  // 5. Net Operating Profit:
  // Revenue (Services + Sales + MFS Commission) - Operating Expenses
  const netOperatingProfit = Number(
    (totalSalesAndServicesIncome + mfsCommissionsEarned - totalOperatingExpenses).toFixed(2)
  );

  // মালিকের মূলধন ও ড্রয়িং হিসাব:
  // মোট বিনিয়োগকৃত মূলধন = দোকান রেজিস্ট্রেশন প্রারম্ভিক ক্যাশ + সর্বমোট মালিকের ক্যাশ জমা
  const totalOwnerCapitalInvested = Number((initialRegistrationCash + allTimeOwnerDeposits).toFixed(2));
  const totalOwnerDrawings = Number(allTimeOwnerDrawings.toFixed(2));

  // অবশিষ্ট মূলধন স্থিতি:
  const rawCapitalRemaining = totalOwnerCapitalInvested - totalOwnerDrawings;
  const netOwnerCapitalRemaining = Number(Math.max(0, rawCapitalRemaining).toFixed(2));

  // "মুলধনের থেকে বেশি উত্তোলন করলে আয় হ্রাস করে":
  // মূলধনের চেয়ে উত্তোলন বেশি হলে অতিরিক্ত অংশ ব্যবসায়ের নিট লাভ বা আয় থেকে হ্রাস পায়
  const excessDrawingsFromIncome = Number(Math.max(0, totalOwnerDrawings - totalOwnerCapitalInvested).toFixed(2));
  const adjustedNetProfit = Number(Math.max(0, netOperatingProfit - excessDrawingsFromIncome).toFixed(2));

  const todayOwnerDeposits = Number(ownerCashDeposits.toFixed(2));
  const todayOwnerDrawings = Number(ownerCashWithdrawals.toFixed(2));
  const todayNetCapitalChange = Number((todayOwnerDeposits - todayOwnerDrawings).toFixed(2));

  // 6. Customer Dues
  let totalPendingCustomerDues = 0;
  let activeDueCustomersCount = 0;
  for (const cust of customers) {
    const due = Number(cust.currentDue || 0);
    if (due > 0) {
      totalPendingCustomerDues += due;
      activeDueCustomersCount += 1;
    }
  }
  totalPendingCustomerDues = Number(totalPendingCustomerDues.toFixed(2));

  // 7. Inventory Valuation
  let totalInventoryPurchaseValue = 0;
  let totalInventoryRetailValue = 0;
  let lowStockItemsCount = 0;

  for (const item of inventory) {
    const qty = Number(item.stockQuantity || 0);
    const pPrice = Number(item.purchasePrice || 0);
    const sPrice = Number(item.sellingPrice || 0);

    totalInventoryPurchaseValue += qty * pPrice;
    totalInventoryRetailValue += qty * sPrice;

    if (qty <= (item.lowStockThreshold || 5)) {
      lowStockItemsCount += 1;
    }
  }
  totalInventoryPurchaseValue = Number(totalInventoryPurchaseValue.toFixed(2));
  totalInventoryRetailValue = Number(totalInventoryRetailValue.toFixed(2));
  const inventoryGrossMarginProjected = Number(
    (totalInventoryRetailValue - totalInventoryPurchaseValue).toFixed(2)
  );

  // 8. Total Business Liquid Assets:
  // Physical Cash + MFS Balances + Market Dues (Receivables) + Stock Purchase Value
  const totalBusinessLiquidAssets = Number(
    (
      Math.max(0, netCashInHand) +
      totalMfsElectronicBalance +
      totalPendingCustomerDues +
      totalInventoryPurchaseValue
    ).toFixed(2)
  );

  return {
    initialRegistrationCash: Number(initialRegistrationCash.toFixed(2)),
    pastDaysNetCash: Number(pastDaysNetCash.toFixed(2)),
    openingCash,
    cashSalesIncome: Number(cashSalesIncome.toFixed(2)),
    dueCollectedInCash: Number(dueCollectedInCash.toFixed(2)),
    ownerCashDeposits: Number(ownerCashDeposits.toFixed(2)),
    mfsCashInReceived: Number(mfsCashInReceived.toFixed(2)),
    totalCashInflow: Number(totalCashInflow.toFixed(2)),

    cashExpenses: Number(cashExpenses.toFixed(2)),
    ownerCashWithdrawals: Number(ownerCashWithdrawals.toFixed(2)),
    mfsCashOutPaid: Number(mfsCashOutPaid.toFixed(2)),
    totalCashOutflow: Number(totalCashOutflow.toFixed(2)),

    netCashInHand,

    totalSalesAndServicesIncome: Number(totalSalesAndServicesIncome.toFixed(2)),
    totalOperatingExpenses: Number(totalOperatingExpenses.toFixed(2)),
    mfsCommissionsEarned: Number(mfsCommissionsEarned.toFixed(2)),
    netOperatingProfit,
    todayDueSalesIncome: Number(todayDueSalesIncome.toFixed(2)),

    totalOwnerCapitalInvested,
    totalOwnerDrawings,
    netOwnerCapitalRemaining,
    excessDrawingsFromIncome,
    adjustedNetProfit,
    todayOwnerDeposits,
    todayOwnerDrawings,
    todayNetCapitalChange,

    digitalIncomeBkash: Number(digitalIncomeBkash.toFixed(2)),
    digitalIncomeNagad: Number(digitalIncomeNagad.toFixed(2)),
    digitalIncomeRocket: Number(digitalIncomeRocket.toFixed(2)),
    totalMfsElectronicBalance: Number(totalMfsElectronicBalance.toFixed(2)),

    totalPendingCustomerDues,
    activeDueCustomersCount,

    totalInventoryPurchaseValue,
    totalInventoryRetailValue,
    inventoryGrossMarginProjected,
    lowStockItemsCount,

    totalBusinessLiquidAssets,
  };
}

export interface OwnerLedgerItem {
  id: string;
  invoiceNo: string;
  timestamp: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  note: string;
  paymentMethod: string;
  runningCapitalBalance: number;
  isExcessDrawing: boolean;
  excessAmount: number;
  trx: Transaction;
}

/**
 * Compiles a sorted, running-balance Owner Ledger (মালিকের মূলধন ও উত্তোলন খতিয়ান)
 */
export function getOwnerLedgerData(
  settings: ShopSettings,
  transactions: Transaction[]
): {
  items: OwnerLedgerItem[];
  initialCapital: number;
  totalDeposited: number;
  totalWithdrawn: number;
  netCapitalRemaining: number;
  excessWithdrawn: number;
  todayDeposited: number;
  todayWithdrawn: number;
} {
  const initialCapital = Number(settings?.openingCashBalance || 0);

  // Filter only owner transactions
  const ownerTransactions = transactions.filter(
    (t) => isOwnerDepositTrx(t) || isOwnerDrawingTrx(t)
  );

  // Sort chronologically ascending to compute progressive running balance
  const sorted = [...ownerTransactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let runningCapital = initialCapital;
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let todayDeposited = 0;
  let todayWithdrawn = 0;

  const items: OwnerLedgerItem[] = [];

  for (const trx of sorted) {
    const isDep = isOwnerDepositTrx(trx);
    const amount = Number(trx.amount || 0);
    const isTrxToday = isToday(trx.timestamp);

    if (isDep) {
      totalDeposited += amount;
      if (isTrxToday) todayDeposited += amount;
      runningCapital += amount;

      items.push({
        id: trx.id,
        invoiceNo: trx.invoiceNo || '',
        timestamp: trx.timestamp,
        type: 'DEPOSIT',
        amount,
        note: trx.note || 'মালিকের মূলধন ক্যাশ জমা / টাকা যুক্ত',
        paymentMethod: trx.paymentMethodLabelBn || 'ক্যাশ ড্রয়ার',
        runningCapitalBalance: runningCapital,
        isExcessDrawing: false,
        excessAmount: 0,
        trx,
      });
    } else {
      totalWithdrawn += amount;
      if (isTrxToday) todayWithdrawn += amount;

      let isExcessDrawing = false;
      let excessAmount = 0;

      if (amount > runningCapital) {
        isExcessDrawing = true;
        excessAmount = amount - Math.max(0, runningCapital);
        runningCapital = runningCapital - amount; // can be negative reflecting deficit
      } else {
        runningCapital -= amount;
      }

      items.push({
        id: trx.id,
        invoiceNo: trx.invoiceNo || '',
        timestamp: trx.timestamp,
        type: 'WITHDRAWAL',
        amount,
        note: trx.note || 'মালিকের ক্যাশ উত্তোলন (ড্রয়ার থেকে)',
        paymentMethod: trx.paymentMethodLabelBn || 'ক্যাশ ড্রয়ার',
        runningCapitalBalance: runningCapital,
        isExcessDrawing,
        excessAmount,
        trx,
      });
    }
  }

  // Reverse items so newest shows first in default table view, but running balances remain accurate
  items.reverse();

  const totalCapitalInvested = initialCapital + totalDeposited;
  const netCapitalRemaining = Math.max(0, totalCapitalInvested - totalWithdrawn);
  const excessWithdrawn = Math.max(0, totalWithdrawn - totalCapitalInvested);

  return {
    items,
    initialCapital,
    totalDeposited,
    totalWithdrawn,
    netCapitalRemaining,
    excessWithdrawn,
    todayDeposited,
    todayWithdrawn,
  };
}

/**
 * Formats a number to Bangladeshi Taka format with symbol ৳
 */
export function formatTaka(amount: number): string {
  const num = Number(amount || 0);
  return `৳${num.toLocaleString('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Formats standard English number format
 */
export function formatNumber(amount: number): string {
  const num = Number(amount || 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
