import { MonthlyRecord, FinancialItem, DashboardMetrics } from '../types';

/**
 * Recalculates the FinancialItem's final INR value based on its subItems (if any),
 * originalValue, and exchangeRate.
 * Returns a new FinancialItem object.
 */
export const recalculateItem = (item: FinancialItem): FinancialItem => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  // If sub-items exist, the originalValue is the sum of sub-items
  let originalValue = item.originalValue;
  if (hasSubItems) {
    originalValue = item.subItems.reduce((sum, sub) => sum + (sub.value || 0), 0);
  }

  const rate = item.exchangeRate || 1;
  const value = originalValue * rate;

  // Handle Invested Value
  let originalInvestedValue = item.originalInvestedValue || 0;
  // If user hasn't set originalInvested but has set investedValue (legacy data), sync back roughly
  if (!item.originalInvestedValue && item.investedValue) {
    originalInvestedValue = item.investedValue / rate;
  }
  const investedValue = originalInvestedValue * rate;

  return {
    ...item,
    originalValue,
    value,
    originalInvestedValue,
    investedValue
  };
};

export const sumValues = (items: FinancialItem[]): number => {
  return items.reduce((acc, item) => acc + (item.value || 0), 0);
};

export const sumInvestedValues = (items: FinancialItem[]): number => {
  return items.reduce((acc, item) => acc + (item.investedValue || 0), 0);
};

export const calculateMetrics = (record: MonthlyRecord, previousRecord?: MonthlyRecord): DashboardMetrics => {
  const bankTotal = sumValues(record.banks);
  const investmentTotal = sumValues(record.investments);
  const deductionTotal = sumValues(record.deductions);
  const othersTotal = sumValues(record.others);

  const totalAssets = bankTotal + investmentTotal;
  const finalTotal = totalAssets - deductionTotal;
  const ultimateTotal = finalTotal + othersTotal;

  let netWorthChange = 0;
  if (previousRecord) {
    const prevBank = sumValues(previousRecord.banks);
    const prevInv = sumValues(previousRecord.investments);
    const prevDed = sumValues(previousRecord.deductions);
    const prevOther = sumValues(previousRecord.others);
    const prevFinal = (prevBank + prevInv) - prevDed;
    const prevUltimate = prevFinal + prevOther; 
    
    if (prevUltimate !== 0) {
      netWorthChange = ((ultimateTotal - prevUltimate) / prevUltimate) * 100;
    }
  }

  return {
    totalAssets,
    totalDeductions: deductionTotal,
    finalTotal,
    ultimateTotal,
    netWorthChange
  };
};

export const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
};
