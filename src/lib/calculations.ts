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
 */
export function auditAllCalculations(
  settings: ShopSettings,
  transactions: Transaction[],
  mfsAccounts: MFSAccount[],
  customers: Customer[],
  inventory: InventoryItem[]
): CalculationAudit {
  // দোকান রেজিস্ট্রেশন এর প্রারম্ভিক ক্যাশ
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

  for (const trx of transactions) {
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
        const isOwnerDeposit =
          (trx.category as string) === 'owner_deposit' ||
          (trx.categoryLabelBn && (trx.categoryLabelBn.includes('জমা') || trx.categoryLabelBn.includes('যুক্ত')) && trx.categoryLabelBn.includes('মালিক')) ||
          (trx.categoryLabelEn && /owner deposit|capital|owner cash/i.test(trx.categoryLabelEn)) ||
          (trx.note && /মালিক.*(জমা|যুক্ত|মূলধন)|owner.*(deposit|capital)/i.test(trx.note));

        const isDueRepayment =
          !isOwnerDeposit &&
          ((trx.category === 'other_income' || (trx.category as string) === 'due_collection') &&
          (
            (trx.categoryLabelBn && (trx.categoryLabelBn.includes('বাকি') || trx.categoryLabelBn.includes('বকেয়া'))) ||
            (trx.categoryLabelEn && /due|repayment|credit/i.test(trx.categoryLabelEn)) ||
            (trx.note && (trx.note.includes('বকেয়া') || trx.note.includes('বাকি')))
          ));

        if (isOwnerDeposit) {
          // মালিকের ড্রয়ারে টাকা যুক্ত / মূলধন ক্যাশ জমা:
          // শুধুমাত্র ড্রয়ারের নগদ ক্যাশ বৃদ্ধি পায়! কোনো এমএফএস ব্যাংকিং প্রয়োজন নেই।
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
        const isOwnerDrawing =
          trx.category === 'owner_drawing' ||
          (trx.categoryLabelBn && trx.categoryLabelBn.includes('উত্তোলন')) ||
          (trx.categoryLabelEn && /drawing|withdraw/i.test(trx.categoryLabelEn)) ||
          (trx.note && /উত্তোলন|ড্রয়িং|drawing|withdraw/i.test(trx.note));

        if (isOwnerDrawing) {
          // মালিকের ড্রয়ার উত্তোলন:
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
