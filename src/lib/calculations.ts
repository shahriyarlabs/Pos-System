import {
  Customer,
  InventoryItem,
  MFSAccount,
  ShopSettings,
  Transaction,
} from '../types';

export interface CalculationAudit {
  openingCash: number;
  cashSalesIncome: number;
  dueCollectedInCash: number;
  mfsCashInReceived: number;
  totalCashInflow: number;

  cashExpenses: number;
  mfsCashOutPaid: number;
  totalCashOutflow: number;

  netCashInHand: number;

  // Revenue & Profit
  totalSalesAndServicesIncome: number;
  totalOperatingExpenses: number;
  mfsCommissionsEarned: number;
  netOperatingProfit: number;

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
 * Performs full mathematical audit & reconciliation of all accounts
 */
export function auditAllCalculations(
  settings: ShopSettings,
  transactions: Transaction[],
  mfsAccounts: MFSAccount[],
  customers: Customer[],
  inventory: InventoryItem[]
): CalculationAudit {
  const openingCash = Number(settings?.openingCashBalance || 0);

  // 1. Transactions breakdown
  let cashSalesIncome = 0;
  let dueCollectedInCash = 0;
  let cashExpenses = 0;
  let digitalIncomeBkash = 0;
  let digitalIncomeNagad = 0;
  let digitalIncomeRocket = 0;
  let totalSalesAndServicesIncome = 0;
  let totalOperatingExpenses = 0;

  for (const trx of transactions) {
    const isTrxToday = isToday(trx.timestamp);
    // Income
    if (trx.type === 'INCOME') {
      if (isTrxToday) {
        totalSalesAndServicesIncome += trx.amount;

        if (trx.paymentMethod === 'CASH') {
          if (trx.category === 'other_income' && trx.categoryLabelBn?.includes('বাকি')) {
            dueCollectedInCash += trx.amount;
          } else {
            cashSalesIncome += trx.amount;
          }
        } else if (trx.paymentMethod === 'BKASH') {
          digitalIncomeBkash += trx.amount;
        } else if (trx.paymentMethod === 'NAGAD') {
          digitalIncomeNagad += trx.amount;
        } else if (trx.paymentMethod === 'ROCKET') {
          digitalIncomeRocket += trx.amount;
        }
      }
    } else if (trx.type === 'EXPENSE') {
      if (isTrxToday) {
        totalOperatingExpenses += trx.amount;
        if (trx.paymentMethod === 'CASH') {
          cashExpenses += trx.amount;
        }
      }
    }
  }

  // 2. MFS Calculations
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

  // 3. Cash in Hand Calculation:
  // Inflow = Opening Cash + Cash from Sales + Cash from Due Recovery + MFS Cash-In Physical Cash
  const totalCashInflow = openingCash + cashSalesIncome + dueCollectedInCash + mfsCashInReceived;
  // Outflow = Cash Expenses + MFS Cash-Out given to customers
  const totalCashOutflow = cashExpenses + mfsCashOutPaid;
  // Net Cash in Drawer
  const netCashInHand = Number((totalCashInflow - totalCashOutflow).toFixed(2));

  // 4. Net Operating Profit:
  // Revenue (Services + Sales + MFS Commission) - Expenses
  const netOperatingProfit = Number(
    (totalSalesAndServicesIncome + mfsCommissionsEarned - totalOperatingExpenses).toFixed(2)
  );

  // 5. Customer Dues
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

  // 6. Inventory Valuation
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

  // 7. Total Business Liquid Assets:
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
    openingCash,
    cashSalesIncome: Number(cashSalesIncome.toFixed(2)),
    dueCollectedInCash: Number(dueCollectedInCash.toFixed(2)),
    mfsCashInReceived: Number(mfsCashInReceived.toFixed(2)),
    totalCashInflow: Number(totalCashInflow.toFixed(2)),

    cashExpenses: Number(cashExpenses.toFixed(2)),
    mfsCashOutPaid: Number(mfsCashOutPaid.toFixed(2)),
    totalCashOutflow: Number(totalCashOutflow.toFixed(2)),

    netCashInHand,

    totalSalesAndServicesIncome: Number(totalSalesAndServicesIncome.toFixed(2)),
    totalOperatingExpenses: Number(totalOperatingExpenses.toFixed(2)),
    mfsCommissionsEarned: Number(mfsCommissionsEarned.toFixed(2)),
    netOperatingProfit,

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
