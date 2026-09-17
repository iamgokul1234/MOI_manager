export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  token?: string;
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
  // Computed on the server from Transactions (never stored on the Person)
  totalReceived?: number;
  totalGiven?: number;
  transactionCount?: number;
  lastTransaction?: string | null;
}

export interface PersonDetail extends Person {
  totalReceived: number;
  totalGiven: number;
  transactionCount: number;
  totalFunctions: number;
  lastTransaction: string | null;
  transactions: Transaction[];
}

export type FunctionCategory = 'OUR' | 'RELATIVE';

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
  category: FunctionCategory;
  type: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed (list endpoint)
  received?: number;
  given?: number;
  transactionCount?: number;
  peopleCount?: number;
}

export interface FunctionDetail extends FunctionEvent {
  totalReceived: number;
  totalGiven: number;
  totalPeople: number;
  transactionCount: number;
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
  attended: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** One row of the Our-Function people list (one row per transaction). */
export interface FunctionPersonRow {
  transactionId: string;
  person: Pick<Person, '_id' | 'husbandName' | 'wifeName' | 'area' | 'phone'>;
  type: TransactionType;
  amount: number;
  attended: boolean;
  transactionDate: string;
  notes?: string;
  createdAt: string;
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
  totalTransactions: number;
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
  totalTransactions: number;
  totalPeople: number;
  totalFunctions: number;
}

export interface FunctionReport {
  _id: string;
  name: string;
  type: string;
  category: FunctionCategory;
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
  transactionCount: number;
  peopleCount: number;
}

export interface YearlyReport {
  year: number;
  received: number;
  given: number;
  netDifference: number;
  transactionCount: number;
}
