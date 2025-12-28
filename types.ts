export interface SubItem {
  id: string;
  name: string;
  value: number; // Value in native currency
}

export interface FinancialItem {
  id: string;
  name: string;
  
  // Final calculated values in base currency (INR)
  value: number; 
  investedValue?: number; // Only for investments

  // Currency & Calculation logic
  currency: string;
  exchangeRate: number;
  originalValue: number; // Value in native currency (or sum of sub-items)
  originalInvestedValue?: number; // Value in native currency
  
  subItems: SubItem[];

  comment?: string;
  isCustom?: boolean; // Kept for legacy, but we will allow deleting all
}

export interface MonthlyRecord {
  id: string;
  monthLabel: string; // e.g., "Jan 24"
  year: number;
  banks: FinancialItem[];
  investments: FinancialItem[];
  deductions: FinancialItem[];
  others: FinancialItem[];
  timestamp: number;
}

export type CategoryType = 'banks' | 'investments' | 'deductions' | 'others';

export interface DashboardMetrics {
  totalAssets: number; // Banks + Investments(Current)
  totalDeductions: number;
  finalTotal: number; // Total Assets - Deductions
  ultimateTotal: number; // Final Total + Others
  netWorthChange: number; // Percentage
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed or not stored in client state
  createdAt: number;
}

export interface CloudConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  lastSyncedAt?: number;
}