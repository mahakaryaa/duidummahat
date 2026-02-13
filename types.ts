
export interface Transaction {
  id: number;
  date: string;
  description: string;
  income: number | null;
  expense: number | null;
  balance: number;
}

export interface SummaryData {
  totalBalance: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface MonthlyFlow {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}
