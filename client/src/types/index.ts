export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Person {
  _id: string;
  userId: string;
  area: string;
  husbandName?: string;
  wifeName?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  totalReceived?: number;
  totalGiven?: number;
  lastTransaction?: string | null;
}

export interface PersonDetail extends Person {
  totalFunctions: number;
  transactions: Transaction[];
}

export type FunctionType =
  | 'Wedding'
  | 'Housewarming'
  | 'Birthday'
  | 'EarPiercing'
  | 'Engagement'
  | 'BabyShower'
  | 'Funeral'
  | 'Other';

export interface FunctionEvent {
  _id: string;
  userId: string;
  name: string;
  type: string;
  date: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  received?: number;
  given?: number;
  transactionCount?: number;
  peopleCount?: number;
}

export interface FunctionDetail extends FunctionEvent {
  totalReceived: number;
  totalGiven: number;
  totalPeople: number;
  transactions: Transaction[];
}

export type TransactionType = 'RECEIVED' | 'GIVEN';

export interface Transaction {
  _id: string;
  userId: string;
  personId: Person | string;
  functionId: FunctionEvent | string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardData {
  totalReceived: number;
  totalGiven: number;
  netDifference: number;
  totalPeople: number;
  totalFunctions: number;
  recentTransactions: Transaction[];
  upcomingFunctions: FunctionEvent[];
  recentPeople: Person[];
}

export interface ReportSummary {
  totalReceived: number;
  totalGiven: number;
  netDifference: number;
  totalPeople: number;
  totalFunctions: number;
}

export interface FunctionReport {
  _id: string;
  name: string;
  type: string;
  date: string;
  received: number;
  given: number;
  transactionCount: number;
  peopleCount: number;
}

export interface AreaReport {
  area: string;
  received: number;
  given: number;
  peopleCount: number;
}

export interface YearlyReport {
  year: number;
  received: number;
  given: number;
  transactionCount: number;
}
