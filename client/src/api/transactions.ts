import api from '@/lib/axios';
import type { ApiResponse, Transaction, TransactionType } from '@/types';

export interface TransactionsQuery {
  personId?: string;
  functionId?: string;
  type?: TransactionType | '';
  area?: string;
  attended?: 'true' | 'false' | '';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
  limit?: number;
}

export interface TransactionInput {
  personId: string;
  functionId: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  attended?: boolean;
  notes?: string;
}

export const transactionsApi = {
  list: async (query: TransactionsQuery = {}) => {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const res = await api.get<ApiResponse<Transaction[]>>('/transactions', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: TransactionInput) => {
    const res = await api.post<ApiResponse<Transaction>>('/transactions', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      type?: TransactionType;
      amount?: number;
      transactionDate?: string;
      attended?: boolean;
      notes?: string;
    }
  ) => {
    const res = await api.patch<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return res.data;
  },

  /** Single-tap strike-through toggle. */
  setAttendance: async (id: string, attended: boolean) => {
    const res = await api.patch<ApiResponse<{ _id: string; attended: boolean }>>(
      `/transactions/${id}/attendance`,
      { attended }
    );
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return res.data;
  },
};
