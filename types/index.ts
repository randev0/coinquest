import { AccountType, ImportStatus, MatchType, TransactionDirection } from "@prisma/client";

export type { AccountType, ImportStatus, MatchType, TransactionDirection };

export interface ParsedTransaction {
  postedDate: Date;
  description: string;
  normalizedDescription: string;
  amount: number;
  direction: TransactionDirection;
  merchantGuess: string;
  rawLine: string;
  fingerprint: string;
}

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
}

export interface StatementProfile {
  name: string;
  detectHeaders: (headers: string[]) => boolean;
  mapColumns: (headers: string[]) => ColumnMapping;
  parseAmount?: (debit: string, credit: string) => { amount: number; direction: TransactionDirection };
}

export interface InsightData {
  month: string;
  totalSpend: number;
  totalIncome: number;
  topCategories: CategoryTotal[];
  topMerchants: MerchantTotal[];
  subscriptions: SubscriptionItem[];
  subscriptionTotal: number;
  subscriptionShare: number;
  previousMonthComparison?: MonthComparison;
  leakCategory?: CategoryLeak;
  suggestions: string[];
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export interface MerchantTotal {
  merchant: string;
  total: number;
  count: number;
}

export interface SubscriptionItem {
  merchant: string;
  avgAmount: number;
  lastCharge: Date;
  annualizedCost: number;
  monthsDetected: number;
  isMarkedSubscription: boolean;
}

export interface MonthComparison {
  previousMonth: string;
  currentTotal: number;
  previousTotal: number;
  delta: number;
  deltaPercent: number;
}

export interface CategoryLeak {
  categoryName: string;
  currentTotal: number;
  previousTotal: number;
  increase: number;
  increasePercent: number;
}

export interface BudgetWithActual {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  budgeted: number;
  actual: number;
  remaining: number;
  percentUsed: number;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicates: number;
  errors: string[];
  batchId: string;
}

// Next-auth type extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}
